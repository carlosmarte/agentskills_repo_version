import * as p from "@clack/prompts";
import chalk from "chalk";
import { cosmiconfig } from "cosmiconfig";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

export interface AgentSkillsConfig {
  /** Root directory containing agent skill folders */
  rootDir: string;
  /** Default author for generated package.json files */
  author?: string;
  /** Default license for generated package.json files */
  license?: string;
}

const explorer = cosmiconfig("agentskills");

const defaults: Partial<AgentSkillsConfig> = {
  license: "MIT",
};

let cachedConfig: AgentSkillsConfig | null = null;

/**
 * Check if a cosmiconfig config file exists. If not, prompt the user
 * to create one. Called automatically during `init`.
 */
export async function ensureConfig(): Promise<void> {
  const result = await explorer.search();
  if (result && !result.isEmpty) return;

  p.log.warn(
    chalk.yellow("No agentskills config found.") +
      " Let's create one.",
  );

  const rootDir = await p.text({
    message: "Absolute path to the directory containing agent skill folders",
    placeholder: "/Users/Shared/autoload/openai-gpts/GPTs",
    validate: (val) => {
      const trimmed = val.trim();
      if (!trimmed) return "Path is required";
      if (!path.isAbsolute(trimmed))
        return "Must be an absolute path (e.g. /Users/Shared/autoload/...)";
    },
  });

  if (p.isCancel(rootDir)) {
    p.log.info("Skipping config creation, using defaults.");
    return;
  }

  const author = await p.text({
    message: "Default author (optional, press Enter to skip)",
    initialValue: "",
  });

  if (p.isCancel(author)) {
    p.log.info("Skipping config creation, using defaults.");
    return;
  }

  const license = await p.text({
    message: "Default license",
    initialValue: "MIT",
  });

  if (p.isCancel(license)) {
    p.log.info("Skipping config creation, using defaults.");
    return;
  }

  const location = await p.select({
    message: "Where should the config file be saved?",
    options: [
      {
        value: path.join(os.homedir(), ".agentskillsrc.json"),
        label: `~/.agentskillsrc.json`,
        hint: "global, user-level",
      },
      {
        value: path.join(process.cwd(), ".agentskillsrc.json"),
        label: `.agentskillsrc.json`,
        hint: "project-level (cwd)",
      },
    ],
  });

  if (p.isCancel(location)) {
    p.log.info("Skipping config creation, using defaults.");
    return;
  }

  const config: Record<string, string> = {
    rootDir: (rootDir as string).trim(),
  };

  const authorVal = (author as string).trim();
  if (authorVal) config.author = authorVal;

  const licenseVal = (license as string).trim();
  if (licenseVal) config.license = licenseVal;

  await fs.writeFile(
    location as string,
    JSON.stringify(config, null, 2) + "\n",
    "utf-8",
  );

  // Invalidate cache so loadConfig picks up the new file
  cachedConfig = null;

  p.log.success(`Config saved to ${chalk.bold(location as string)}`);
}

export async function loadConfig(): Promise<AgentSkillsConfig> {
  if (cachedConfig) return cachedConfig;

  const result = await explorer.search();

  if (result && !result.isEmpty) {
    const config = { ...defaults, ...result.config } as AgentSkillsConfig;

    if (!config.rootDir) {
      throw new Error(
        "Config is missing 'rootDir'. Run `agentskills init` to set it up.",
      );
    }

    cachedConfig = config;
  } else {
    throw new Error(
      "No agentskills config found. Run `agentskills init` to create one.",
    );
  }

  return cachedConfig;
}

export function resolveSkillDir(
  config: AgentSkillsConfig,
  skillName: string,
): string {
  return path.resolve(config.rootDir, skillName);
}
