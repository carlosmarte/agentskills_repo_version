import * as p from "@clack/prompts";
import chalk from "chalk";
import fs from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import { loadConfig, resolveSkillDir } from "../config.mjs";
import { listSkills } from "../parser.mjs";

type ReleaseType = "patch" | "minor" | "major";

export async function bumpCommand(
  skillName?: string,
  release?: string,
): Promise<void> {
  p.intro(chalk.bgMagenta(" agentskills bump "));

  const config = await loadConfig();
  const skills = await listSkills(config.rootDir);

  // Filter to skills that already have a package.json
  const initialized: string[] = [];
  for (const s of skills) {
    const pkgPath = path.join(resolveSkillDir(config, s), "package.json");
    try {
      await fs.access(pkgPath);
      initialized.push(s);
    } catch {
      // skip
    }
  }

  if (initialized.length === 0) {
    p.cancel("No skills have been initialized yet. Run `agentskills init` first.");
    process.exit(1);
  }

  let selected: string;

  if (skillName && initialized.includes(skillName)) {
    selected = skillName;
  } else {
    const result = await p.select({
      message: "Select a skill to bump",
      options: initialized.map((s) => ({ value: s, label: s })),
    });

    if (p.isCancel(result)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    selected = result as string;
  }

  let releaseType: ReleaseType;

  if (release && ["patch", "minor", "major"].includes(release)) {
    releaseType = release as ReleaseType;
  } else {
    const result = await p.select({
      message: "Select version bump type",
      options: [
        { value: "patch", label: "patch", hint: "bug fixes (1.0.0 → 1.0.1)" },
        {
          value: "minor",
          label: "minor",
          hint: "new features (1.0.0 → 1.1.0)",
        },
        {
          value: "major",
          label: "major",
          hint: "breaking changes (1.0.0 → 2.0.0)",
        },
      ],
    });

    if (p.isCancel(result)) {
      p.cancel("Operation cancelled.");
      process.exit(0);
    }
    releaseType = result as ReleaseType;
  }

  const skillDir = resolveSkillDir(config, selected);
  const pkgPath = path.join(skillDir, "package.json");
  const raw = await fs.readFile(pkgPath, "utf-8");
  const pkg = JSON.parse(raw);

  const oldVersion = pkg.version;
  const newVersion = semver.inc(oldVersion, releaseType);

  if (!newVersion) {
    p.cancel(`Invalid version: ${oldVersion}`);
    process.exit(1);
  }

  pkg.version = newVersion;
  await fs.writeFile(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  p.note(
    `${chalk.dim(oldVersion)} → ${chalk.green.bold(newVersion)}`,
    `${selected} version bump (${releaseType})`,
  );

  p.outro(chalk.green("Done!"));
}
