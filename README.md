# Agent Supervisor

**Connect a top-tier AI to any local agent. It analyzes, builds, optimizes, and fixes — the best models available, engineering your local AI.**

Your AI agent runs on whatever you want — OpenClaw, Ollama, LM Studio, a custom framework on a Raspberry Pi. It does the work. But it has a ceiling. Agent Supervisor connects it to a model with the reasoning to actually raise that ceiling: deep analysis of logs and behavior patterns, designing new capabilities, optimizing how it handles tasks, reviewing output quality, and implementing real fixes when things break. Your agent keeps getting smarter because it has a better engineer working on it.

```
npx agent-supervisor
```

## What This Does

1. **Detects** your agent framework (OpenClaw, Ollama, LM Studio, or any custom CLI)
2. **Generates** a config that teaches Claude Code or Codex how to connect to and work on your agent
3. **Creates** a persistent memory so the supervisor compounds its knowledge of your agent across sessions
4. **Works locally** (agent on same machine) or **remotely** (agent on a server via SSH)

After setup, open Claude Code or Codex in the directory and it knows how to connect to your agent, analyze its work, build new capabilities, optimize its performance, and fix problems at the root.

## The Pattern

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────┐
│     You      │ ──────> │  Claude Code /   │ ──────> │  Your Agent  │
│  (human)     │         │  Codex           │  SSH /  │  (OpenClaw,  │
│              │ <────── │  (top-tier AI)   │ <────── │   Ollama,    │
│              │         │                  │  local  │   custom)    │
└──────────────┘         └─────────────────┘         └──────────────┘
                          analyzes, builds,            runs 24/7,
                          optimizes, fixes,            does the work,
                          designs, reviews             gets better
                                                       over time
```

**You** say what you want done. **The top-tier model** connects to your agent, analyzes its work, builds new capabilities, optimizes its approach, and implements improvements directly. **Your agent** does the daily work, runs autonomously, and keeps getting better because something smarter is engineering it.

## Quick Start

### Local Agent (same machine)

```bash
mkdir my-supervisor && cd my-supervisor

npx agent-supervisor

# > What will supervise your agent? → Claude Code (or Codex)
# > Where is your agent running? → On this machine (local)
# > Which framework? → (auto-detected)

# Start supervising
claude   # or: codex
```

### Remote Agent (SSH)

```bash
mkdir my-supervisor && cd my-supervisor

npx agent-supervisor

# > What will supervise your agent? → Claude Code (or Codex)
# > Where is your agent running? → On a remote server (SSH)
# > SSH connection: → user@your-server-ip
# > Which framework? → (auto-detected)

claude   # or: codex
```

## Supported Frameworks

| Framework | Auto-Detect | Session Support | Notes |
|-----------|------------|-----------------|-------|
| **OpenClaw** | Yes | Yes (session IDs) | Full agent framework with skills, memory, cron |
| **Ollama** | Yes | No | Local LLM runner for open-source models |
| **LM Studio** | Yes | No | Desktop app with OpenAI-compatible API |
| **Custom CLI** | Manual | Depends | Any command-line agent you specify |
| **Raw Terminal** | N/A | N/A | Direct shell access for custom setups |

## What Gets Created

```
your-directory/
  .agent-supervisor.json    # Connection config (gitignored)
  CLAUDE.md or AGENTS.md    # Supervisor instructions (depends on your tool)
  SUPERVISOR_MEMORY.md      # Persistent memory across sessions
```

Three files. The config tells the supervisor how to reach your agent. The `CLAUDE.md` (or `AGENTS.md` for Codex) teaches the supervisor how to connect, send messages, find logs, run health checks, and when to coach vs. directly intervene. The memory file persists everything the supervisor learns about your agent across sessions — quirks, past fixes, known issues, what works and what doesn't.

Your agent's existing setup stays untouched. The supervisor works with whatever identity, rules, and config your agent already has.

## Use Cases

### Diagnose and Fix Agent Issues
The supervisor can scan your agent's logs, configs, and runtime state to find problems you'd never catch manually. Run it on-demand when something feels off, or make it part of a regular health check routine.

```
"Go through the agent's logs from the last 24 hours, find anything
broken or inefficient, and fix it"

"The agent's responses have been slow — figure out why and resolve it"

"Check if any cron jobs failed overnight and restart anything that died"
```

### Coaching Sessions
Tell the supervisor to teach your agent a new skill or fix a recurring problem. It will go back and forth with the agent autonomously — asking questions, reviewing the agent's work, editing code and config files, and retrying until the agent can complete the task correctly on its own. You walk away and come back to a smarter agent.

```
"The agent keeps splitting X posts into threads when they should be
single posts. Coach it until it gets this right every time."

"The agent's deploy process is fragile. Work with it to build a
pre-deploy checklist and test it until deploys pass consistently."

"Teach the agent how to handle Stripe webhook failures gracefully.
Don't do it for the agent — make it learn."
```

### Discover and Implement Improvements
Work alongside the supervisor to brainstorm ways to make your agent better at specific tasks. It reads the agent's current capabilities, identifies gaps, and implements the improvements directly — updating rules, adding new operational procedures, or refactoring how the agent approaches a problem.

```
"Look at how the agent handles error recovery and suggest 3 ways
to make it more resilient. Then implement the best one."

"The agent's memory system works but it's noisy. Find a way to
reduce log spam without losing important events."

"Review the agent's SOUL.md and AGENT_LEARNINGS.md. Are there
patterns we're missing? Add any new rules that would help."
```

### Quick Commands

After setup, run `claude` in your project directory and try:

```
"Check if the agent is running and healthy"
"Read the agent's recent logs and tell me if anything went wrong"
"Tell the agent to deploy the app and make sure it doesn't break anything"
"The agent keeps messing up X — add a rule to prevent it"
"Do a full system audit — check processes, disk, logs, and configs"
```

## How It Works

### Deep Analysis
The supervisor reads your agent's logs, configs, code, and behavior patterns to understand how it operates. It finds inefficiencies, recurring failures, and missed opportunities that surface-level monitoring would never catch.

### Build and Optimize
It doesn't just identify problems — it designs and implements solutions. New capabilities, better workflows, tighter rules, refactored approaches. It writes the code, updates the configs, and verifies the changes work.

### Coaching Sessions
For problems the agent should learn to handle itself, the supervisor works back and forth with it — asking questions, reviewing attempts, editing code, and retrying until the agent can complete the task at a high level on its own.

### Direct Fixes
When something is broken and time matters, the supervisor diagnoses the root cause, implements the fix directly, and logs what happened so the agent doesn't repeat it.

### Persistent Memory
Everything the supervisor learns about your agent is saved to `SUPERVISOR_MEMORY.md`. Next session, it picks up right where it left off — knowing the agent's quirks, past issues, what's been tried, and what works.

## Requirements

- **Node.js 18+** for the setup CLI
- **Claude Code** or **Codex** (setup auto-generates the correct config file)
- **SSH key-based auth** for remote agents (no password prompts)
- An AI agent running on OpenClaw, Ollama, LM Studio, or any CLI

## License

MIT
