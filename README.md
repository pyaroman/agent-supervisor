# Agent Supervisor

**One command to let Claude Code (or Codex) supervise any AI agent — local or remote.**

Your AI agent runs 24/7 on cheap hardware or a local model. When it gets stuck, makes mistakes, or needs improvement, a top-tier model (Claude Code, Codex) connects, diagnoses, coaches, and fixes it. You just say what you want done.

```
npx agent-supervisor
```

## What This Does

1. **Detects** your agent framework (OpenClaw, Ollama, LM Studio, or any custom CLI)
2. **Generates** a `CLAUDE.md` that teaches Claude Code how to connect to, supervise, and improve your agent
3. **Works locally** (agent on same machine) or **remotely** (agent on a server via SSH)

After setup, open Claude Code in the directory and it knows how to talk to, evaluate, coach, and improve your agent.

## The Pattern

```
┌──────────────┐         ┌─────────────────┐         ┌──────────────┐
│     You      │ ──────> │  Claude Code /   │ ──────> │  Your Agent  │
│  (human)     │         │  Codex           │  SSH /  │  (OpenClaw,  │
│              │ <────── │  (supervisor)    │ <────── │   Ollama,    │
│              │         │                  │  local  │   custom)    │
└──────────────┘         └─────────────────┘         └──────────────┘
                          reads logs, sends            runs 24/7,
                          messages, updates             does the work,
                          rules, fixes issues           learns from
                                                        mistakes
```

**You** tell the supervisor what you want. **The supervisor** connects to your agent, evaluates its work, coaches it through problems, and improves its rules. **Your agent** does the actual work, runs autonomously, and gets better over time.

## Quick Start

### Local Agent (same machine)

```bash
# Navigate to where you want the supervisor config
mkdir my-supervisor && cd my-supervisor

# Run setup
npx agent-supervisor

# Answer the prompts:
# > Where is your agent running? → On this machine (local)
# > Which framework? → (auto-detected)

# Start supervising
claude
```

### Remote Agent (SSH)

```bash
mkdir my-supervisor && cd my-supervisor

npx agent-supervisor

# > Where is your agent running? → On a remote server (SSH)
# > SSH connection: → user@your-server-ip
# > Which framework? → (auto-detected)

claude
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
  CLAUDE.md                 # Supervisor instructions for Claude Code
```

That's it. Two files. The `.agent-supervisor.json` stores how to reach your agent. The `CLAUDE.md` teaches Claude Code everything it needs to know to supervise it: how to connect, how to send messages, where to find logs and configs, how to run health checks, and when to coach vs. directly intervene.

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

## How Supervision Works

### Coaching (default)
When the agent makes a mistake, the supervisor:
1. Identifies what went wrong
2. Asks the agent questions to check understanding
3. Makes the agent fix it (doesn't do it for them)
4. Logs the lesson in AGENT_LEARNINGS.md

### Direct Intervention
When the agent is stuck or time is critical:
1. Reads logs and files to understand the state
2. Fixes the issue directly
3. Explains what was fixed and why
4. Logs the lesson so the agent learns

### System Audit
On request, the supervisor:
1. Checks agent process status
2. Reviews recent logs for errors
3. Scans AGENT_LEARNINGS.md for recurring patterns
4. Reports findings with recommendations

## Requirements

- **Node.js 18+** for the setup CLI
- **Claude Code** or any AI coding assistant that reads CLAUDE.md
- **SSH key-based auth** for remote agents (no password prompts)
- An AI agent running on OpenClaw, Ollama, LM Studio, or any CLI

## License

MIT
