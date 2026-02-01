---
icon: i-lucide-file-text
---

# skill

The skill module discovers and parses [agentskills.io](https://agentskills.io/specification) compliant skill files. Use it to load skills from directories and validate them against the specification.

```ts
import { discoverSkills, parseSkillMd, toPromptXml, validateSkill } from 'unagent/skill'
```

## Skill Directory Format

Skills follow the [agentskills.io spec](https://agentskills.io/specification). Each skill is a directory containing a `SKILL.md` file.

```
skills/
├── pdf-processing/
│   └── SKILL.md
├── typescript-helper/
│   └── SKILL.md
```

### SKILL.md Format

The `SKILL.md` file contains YAML frontmatter with metadata and markdown content with instructions.

```md [pdf-processing/SKILL.md]
---
name: pdf-processing
description: Extracts text and metadata from PDF files
license: MIT
compatibility: claude-code, cursor
allowed-tools: Bash Read Write
metadata:
  author: johndoe
  version: 1.0.0
---

# Instructions

Your instructions for the agent go here...
```

## Parsing

The parsing functions extract frontmatter and content from skill files.

### parseSkillMd

This function parses a skill markdown file and returns structured data.

```ts
const parsed = parseSkillMd(`---
name: typescript-helper
description: Helps with TypeScript code
globs: ["*.ts", "*.tsx"]
---
You are a TypeScript expert...
`)

parsed.frontmatter // { name, description, globs, ... }
parsed.content // "You are a TypeScript expert..."
parsed.raw // Original content
```

### extractSkillName

This function extracts the skill name from frontmatter or falls back to the filename.

```ts
extractSkillName({ name: 'my-skill', description: 'test' }) // "my-skill"
extractSkillName({ name: '', description: '' }, 'my-skill.md') // "my skill"
```

## Validation

The validation function checks skills against the agentskills.io specification.

### validateSkill

This function validates a parsed skill and returns errors and warnings.

```ts
const result = validateSkill(parsed, 'pdf-processing')

result.valid // true if no errors
result.errors // ["name is required", ...]
result.warnings // ["skill content is empty", ...]
```

The function enforces these rules:

- `name` must be 1-64 characters, lowercase with hyphens only, no consecutive hyphens, and must match the directory name
- `description` must be 1-1024 characters
- `compatibility` must be 500 characters or fewer when present

## Discovery

The discovery functions find and load skills from the filesystem.

### discoverSkills

This function scans a directory for skill directories containing `SKILL.md`.

```ts
const skills = discoverSkills('~/.claude/skills', {
  recursive: true, // Search nested directories
})

for (const skill of skills) {
  console.log(skill.name) // Directory name (= skill name)
  console.log(skill.path) // Full directory path
  console.log(skill.parsed) // ParsedSkill object
}
```

### filterSkills

This function filters skills by name, description, or tags.

```ts
const tsSkills = filterSkills(skills, 'typescript')
```

### findSkillByName

This function finds a skill by exact name match.

```ts
const skill = findSkillByName(skills, 'pdf-processing')
```

## Prompt Generation

The prompt generation function creates XML output for agent system prompts.

### toPromptXml

This function generates XML following the agentskills.io specification format.

```ts
const xml = toPromptXml(skills)
```

The output follows this structure:

```xml
<available_skills>
  <skill>
    <name>pdf-processing</name>
    <description>Extracts text from PDFs...</description>
    <location>/path/to/skills/pdf-processing</location>
  </skill>
</available_skills>
```

## Types

```ts
interface SkillFrontmatter {
  // Required by spec
  'name': string // lowercase, hyphens, 1-64 chars
  'description': string // 1-1024 chars

  // Optional per spec
  'license'?: string
  'compatibility'?: string // max 500 chars
  'metadata'?: Record<string, string>
  'allowed-tools'?: string // space-delimited

  // Extended (agent-specific)
  'globs'?: string | string[]
  'alwaysApply'?: boolean
  'tags'?: string[]
}

interface ParsedSkill {
  frontmatter: SkillFrontmatter
  content: string
  raw: string
}

interface DiscoveredSkill {
  path: string // Directory path
  name: string // Directory name
  parsed: ParsedSkill
}

interface DiscoverOptions {
  recursive?: boolean
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
```

## Frontmatter Fields

| Field | Type | Spec | Description |
|-------|------|------|-------------|
| `name` | `string` | Required | Skill identifier using lowercase and hyphens |
| `description` | `string` | Required | Short description (max 1024 chars) |
| `license` | `string` | Optional | SPDX license identifier |
| `compatibility` | `string` | Optional | Supported agents (max 500 chars) |
| `metadata` | `object` | Optional | Custom key-value pairs |
| `allowed-tools` | `string` | Optional | Space-delimited tool names |
| `globs` | `string \| string[]` | Extended | File patterns to match |
| `alwaysApply` | `boolean` | Extended | Always include this skill |
| `tags` | `string[]` | Extended | Tags for filtering |
