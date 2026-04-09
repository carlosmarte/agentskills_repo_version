#!/usr/bin/env node

import { Command } from "commander";
import dotenv from "dotenv";
import { initCommand } from "./commands/init.mjs";
import { bumpCommand } from "./commands/bump.mjs";
import { readmeCommand } from "./commands/readme.mjs";

dotenv.config();

const program = new Command();

program
  .name("agentskills")
  .description("CLI for managing CI/CD of agent skill files")
  .version("0.1.0");

program
  .command("init")
  .description("Create a package.json for a skill from its gpt-spec.md")
  .argument("[skill]", "skill directory name")
  .action(async (skill?: string) => {
    await initCommand(skill);
  });

program
  .command("bump")
  .description("Bump the version in a skill's package.json")
  .argument("[skill]", "skill directory name")
  .argument("[release]", "release type: patch | minor | major")
  .action(async (skill?: string, release?: string) => {
    await bumpCommand(skill, release);
  });

program
  .command("readme")
  .description("Generate/update README.md with usage and integration instructions")
  .argument("[skill]", "skill directory name")
  .action(async (skill?: string) => {
    await readmeCommand(skill);
  });

program.parse();
