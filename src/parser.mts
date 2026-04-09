import fs from "node:fs/promises";
import path from "node:path";

export interface GptSpec {
  name: string;
  description: string;
  model?: string;
}

/**
 * Parse gpt-spec.md to extract name and description.
 */
export async function parseGptSpec(skillDir: string): Promise<GptSpec> {
  const specPath = path.join(skillDir, "gpt-spec.md");
  const content = await fs.readFile(specPath, "utf-8");

  const nameMatch = content.match(/\*\*Name:\*\*\s*(.+)/);
  const descMatch = content.match(/\*\*Description:\*\*\s*(.+)/);
  const modelMatch = content.match(/\*\*Model:\*\*\s*(.+)/);

  if (!nameMatch) {
    throw new Error(`Could not parse name from ${specPath}`);
  }

  return {
    name: nameMatch[1].trim(),
    description: descMatch ? descMatch[1].trim() : "",
    model: modelMatch ? modelMatch[1].trim() : undefined,
  };
}

/**
 * List all skill directories under the root.
 */
export async function listSkills(rootDir: string): Promise<string[]> {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });
  const skills: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(".")) continue;

    const specPath = path.join(rootDir, entry.name, "gpt-spec.md");
    try {
      await fs.access(specPath);
      skills.push(entry.name);
    } catch {
      // not a valid skill directory
    }
  }

  return skills.sort();
}
