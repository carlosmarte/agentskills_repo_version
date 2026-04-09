# Tag Skill Release Workflow

Automatically creates a GitHub tag and release for an agent skill based on the version in its `package.json`.

## Prerequisites

1. A `.agentskillsrc.json` file committed to the repo root with a **relative** `rootDir` pointing to where skill folders live inside the repo:

```json
{
  "rootDir": "skills",
  "author": "Your Name",
  "license": "MIT"
}
```

> **Important:** `rootDir` must be a relative path (relative to the repo root). The workflow resolves it against `$GITHUB_WORKSPACE` on the runner.

2. The target skill must have a `package.json` (created via `agentskills init <skill>`).

Example repo layout:

```
repo-root/
  .agentskillsrc.json          # rootDir: "skills"
  skills/
    email-thread-extraction/
      package.json              # contains version
      gpt-spec.md
      system-instructions.md
      knowledge/
```

## Usage

### Via GitHub UI

1. Go to **Actions** > **Tag Skill Release**
2. Click **Run workflow**
3. Enter the skill folder name (e.g. `email-thread-extraction`)
4. Click **Run workflow**

### Via GitHub CLI

```bash
gh workflow run tag-skill-release.yml -f skill_name=email-thread-extraction
```

## Tag Format

Tags follow the pattern `<skill_name>/v<version>`:

```
email-thread-extraction/v1.0.0
email-thread-extraction/v1.1.0
```

## Behavior

| Scenario | Result |
|----------|--------|
| Tag does not exist | Creates annotated tag, pushes it, creates GitHub Release |
| Tag already exists | Exits with a warning — no failure, no duplicate tag |
| `package.json` missing | Fails with error prompting to run `agentskills init` |
| `.agentskillsrc.json` missing | Fails with error |

## Typical Workflow

```bash
# 1. Initialize the skill (creates package.json from gpt-spec.md)
agentskills init email-thread-extraction

# 2. Make changes to the skill files...

# 3. Bump the version
agentskills bump email-thread-extraction patch

# 4. Commit and push
git add -A && git commit -m "Update email-thread-extraction" && git push

# 5. Trigger the release (GitHub UI or CLI)
gh workflow run tag-skill-release.yml -f skill_name=email-thread-extraction
```

## Permissions

The workflow uses the default `GITHUB_TOKEN` provided by Actions. No additional secrets are required.
