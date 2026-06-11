# What is the .agent/ folder?

## The problem it solves

AI coding assistants like Antigravity have no memory between sessions.
Every time you open a new chat, the assistant starts completely blind — it does not know
which microservices exist, your AWS layout, your tech decisions, your professor's rules,
or your commit conventions.

Without this folder: inconsistent suggestions, code that contradicts your architecture,
and 10 minutes of re-explaining context every single session.

## What this folder is

A permanent knowledge base committed to your monorepo.
Every file is plain Markdown, always up to date, always readable by any AI tool.
When you start Antigravity, you paste the relevant files and the assistant immediately
has full project context — no re-explanation needed.

## Files in this folder

| File | Contents | Update when |
|------|----------|-------------|
| `AGENT_README.md` | This file — how to use the folder | Rarely |
| `CONTEXT.md` | Living project state — what is done, what is pending | After every sprint |
| `REQUIREMENTS.md` | Full professor spec as a checklist | Never (spec is fixed) |
| `MICROSERVICES.md` | All 10 MS with instance, tech, events, build order | When a MS is added |
| `DATABASES.md` | All 10 DBs with formal academic justification | When a DB is added |
| `AWS_STRATEGY.md` | Account layout, instance map, network rules, costs | When infra changes |
| `CONVENTIONS.md` | Commits, branching, folder structure, templates | When team agrees a change |
| `TASKS.md` | All GitHub Projects tasks — copy directly as cards | When tasks change |

## How to use it with Antigravity — exact steps

### Step 1 — At the start of every session, paste this prompt:

```
I am working on a distributed systems university project called UCE Library.
Read the following context files before helping me with anything.
They contain all architectural decisions, AWS constraints, and current project state.
Do not suggest anything that contradicts what is written in these files.

[paste CONTEXT.md content here]
[paste MICROSERVICES.md content here]
[paste AWS_STRATEGY.md content here]
[paste CONVENTIONS.md content here]

Now help me build: [your specific task, e.g. "the user-service MS-05"]
```

### Step 2 — Choose which files to paste based on the task

| Task | Files to paste |
|------|---------------|
| Building a new microservice | CONTEXT + MICROSERVICES + CONVENTIONS |
| Writing Terraform / infrastructure | CONTEXT + AWS_STRATEGY + CONVENTIONS |
| Database setup or justification | CONTEXT + DATABASES + REQUIREMENTS |
| Planning the next sprint | CONTEXT + REQUIREMENTS + MICROSERVICES |
| Any doubt or general question | CONTEXT + REQUIREMENTS |

You do NOT need to paste all files every time. Less context = faster, more focused answers.

### Step 3 — After every sprint, update CONTEXT.md

Mark the completed microservice as done, update the database count, note infra changes.
A stale CONTEXT.md is worse than no file — keep it current.

## Why this matters for your grade

Having this folder in your repo demonstrates to the professor that:
1. You designed the full architecture before writing a single line of code
2. You documented every technical decision with formal justification
3. You maintained living documentation throughout the project lifecycle
4. You applied professional engineering practices used in real software teams

This is the difference between a 14/20 project and a 20/20 project.
