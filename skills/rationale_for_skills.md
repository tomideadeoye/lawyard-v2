# Rationale for Skills

## The Problem

Every project has patterns — architectural decisions, component conventions, integration recipes, and tribal knowledge buried across dozens of files. When you return to a project weeks later, or start a new one, you waste hours re-discovering:

- How is Paystack wired here?
- What's the form submission pattern?
- How do file uploads work?
- What's the grid layout convention?
- Which packages were chosen and why?

Worse, when an AI assistant works on the project, it has no persistent memory of these patterns across sessions. Each conversation starts from scratch.

## The Solution

**Skills** are flat Markdown files in a `skills/` directory at the project root. They capture the implementation patterns, architectural decisions, and code references for a feature area. They are:

### 1. Human-readable
Written for both you and AI. Clear, concise, focused on the "how" and "why". Not documentation — **reference**.

### 2. Feature-organized
Each skill file maps to a domain: `brand_press_skills.md`, `payment_skills.md`, `supabase_patterns_skills.md`. Not by file type, not by tech stack — by what you need to build next.

### 3. Compound across projects
When you start a new project, drop in the relevant skill files from previous projects. The AI instantly knows:

- "Oh, this project uses the same Paystack pattern as Lawyard"
- "Brand press form? Same submission flow as last time"

### 4. AI-first
Skills are designed to be injected into AI context. At the start of a session, the AI reads the relevant skill files and has full context of the patterns. No more "let me search the codebase to figure out how X works."

### 5. Living documents
Add to them as you build. When you discover a new pattern, fix a gotcha, or learn a better approach, update the skill file. They grow with the project.

## How to Use Skills

### In the current project
- Read the relevant skill file before implementing a feature
- Reference existing patterns instead of reinventing them
- When you build something new, add a new skill file (or update an existing one)

### Across projects
- Copy `skills/` (or selected files) to the new project
- Tell the AI: "This project uses the same patterns as Lawyard. Read `skills/payment_skills.md` for context."
- The AI immediately knows the conventions without re-scanning the entire codebase

### For AI onboarding
Before starting a session on an existing feature:

> Read `skills/brand_press_skills.md` to understand the submission flow patterns before we implement this.

On a new project that follows familiar patterns:

> We're building something similar to Lawyard's brand press. Read `skills/brand_press_skills.md` and `skills/payment_skills.md` for reference patterns.

### For compounding
Set a rule in your AGENTS.md or opencode config:

> Before implementing any feature, check `skills/` for relevant patterns. After implementing, update or add skill files if new patterns were discovered.

## When to Create a Skill File

Create a skill file when you:

1. **Build a new feature** — capture the architecture, key files, and decisions
2. **Integrate a new service** — document the setup, env vars, and API patterns
3. **Establish a convention** — form patterns, component structures, layout grids
4. **Solve something non-trivial** — file uploads, payment flows, auth, rich text editing

Don't create skill files for:
- One-off utility functions
- Trivial components (a single button is not a skill)
- Things that never change

## Skill File Structure

Each skill file follows a loose structure:

```
# Feature Name

Brief description of what this feature does.

## Architecture
Key architectural decisions and file organization.

## Key Files
Paths to important files with brief descriptions.

## Patterns
Code snippets showing the canonical way to do things.

## Database (if applicable)
Schema changes, migrations, key queries.

## Gotchas
Things that tripped us up. Edge cases to watch for.

## Config / Env
Environment variables, config files, feature flags.
```

Not every section is required. The goal is **utility**, not completeness.

## The Goal

**One day, starting a new project looks like this:**

1. Context: "Building a content submission platform with payments"
2. AI loads relevant skills from past projects
3. "I see — similar to Lawyard's brand press + Paystack pattern"
4. Implementation follows proven patterns from day one
5. New patterns get captured for the next project

That's the compound effect.
