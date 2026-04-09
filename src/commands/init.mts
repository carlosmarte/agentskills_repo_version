import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import { ensureConfig, loadConfig, resolveSkillDir } from "../config.mjs";
import { listSkills, parseGptSpec } from "../parser.mjs";

export async function initCommand(skillName?: string): Promise<void> {
  p.intro(chalk.bgCyan(" agentskills init "));

  await ensureConfig();
  const config = await loadConfig();
  const skills = await listSkills(config.rootDir);

  if (skills.length === 0) {
    p.cancel(`No skills found in ${config.rootDir}`);
    process.exit(1);
  }

  let selected: string;

  if (skillName && skills.includes(skillName)) {
    selected = skillName;
  } else {
    const result = await p.select({
      message: "Select a skill to initialize",
      options: skills.map((s) => ({ value: s, label: s })),
    });

    if (p.isCancel(result)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    selected = result as string;
  }

  const skillDir = resolveSkillDir(config, selected);
  const pkgPath = path.join(skillDir, "package.json");

  // Check if package.json already exists
  try {
    await fs.access(pkgPath);
    const overwrite = await p.confirm({
      message: `package.json already exists in ${selected}. Overwrite?`,
      initialValue: false,
    });

    if (p.isCancel(overwrite) || !overwrite) {
      p.cancel("Skipped.");
      return;
    }
  } catch {
    // doesn't exist, continue
  }

  const spec = await parseGptSpec(skillDir);

  const spinner = p.spinner();
  spinner.start("Parsing gpt-spec.md...");

  // Gather files for the files array
  const entries = await fs.readdir(skillDir, { withFileTypes: true });
  const files = entries
    .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules")
    .map((e) => (e.isDirectory() ? `${e.name}/` : e.name));

  const pkg = {
    name: `@agentskills/${spec.name}`,
    version: "1.0.0",
    description: spec.description,
    private: true,
    keywords: ["agent-skill", "gpt", spec.name],
    license: config.license ?? "MIT",
    ...(config.author ? { author: config.author } : {}),
    files,
    agentskills: {
      type: "openai-gpt",
      model: spec.model ?? "GPT-4o",
      spec: "gpt-spec.md",
      instructions: "system-instructions.md",
      knowledge: "knowledge-manifest.md",
    },
  };

  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  spinner.stop(`Created package.json for ${chalk.bold(spec.name)}`);

  p.note(
    [
      `${chalk.dim("Name:")}    ${pkg.name}`,
      `${chalk.dim("Version:")} ${pkg.version}`,
      `${chalk.dim("Desc:")}    ${pkg.description.slice(0, 80)}...`,
      `${chalk.dim("Files:")}   ${files.join(", ")}`,
    ].join("\n"),
    "Package Summary",
  );

  p.outro(chalk.green("Done!"));
}
