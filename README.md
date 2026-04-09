# agentskills

CLI tool for managing CI/CD of agent skill files (Custom GPTs, Claude skills, etc.).

## Install

```bash
npm install
npm run build
npm link  # makes `agentskills` available globally
```

## Commands

### `agentskills init [skill]`

Creates a `package.json` inside a skill directory by parsing its `gpt-spec.md`. Extracts name, description, model, and builds a file manifest automatically.

```bash
agentskills init                          # interactive skill picker
agentskills init email-thread-extraction  # direct
```

### `agentskills bump [skill] [patch|minor|major]`

Bumps the semver version in a skill's `package.json`.

```bash
agentskills bump                                    # interactive
agentskills bump email-thread-extraction patch      # direct
```

### `agentskills readme [skill]`

Generates/updates a `README.md` inside the skill directory with structure, usage, and integration instructions.

```bash
agentskills readme                          # interactive
agentskills readme email-thread-extraction  # direct
```

## Configuration

Uses [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) to load config from any of:

- `.agentskillsrc` (JSON or YAML)
- `.agentskillsrc.json`
- `.agentskillsrc.yml`
- `agentskills.config.js`
- `agentskills.config.mjs`
- `"agentskills"` key in `package.json`

### Config Options

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `rootDir` | `string` | `/Users/Shared/autoload/openai-gpts/GPTs` | Root directory containing skill folders |
| `author` | `string` | — | Default author for generated package.json |
| `license` | `string` | `MIT` | Default license for generated package.json |

### Example `.agentskillsrc.json`

```json
{
  "rootDir": "/Users/Shared/autoload/openai-gpts/GPTs",
  "author": "Your Name",
  "license": "MIT"
}
```

## Skill Directory Structure

Each skill folder is expected to have:

```
skill-name/
  gpt-spec.md              # Name, description, model, capabilities
  system-instructions.md   # Full system prompt
  knowledge-manifest.md    # Knowledge file inventory
  knowledge/               # Knowledge files
  examples/                # (optional) Example conversations
```
