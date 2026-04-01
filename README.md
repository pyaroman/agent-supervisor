# Agent Supervisor

**One command to let Claude Code (or Codex) supervise any AI agent — local or remote.**

Your AI agent runs 24/7 on cheap hardware or a local model. When it gets stuck, makes mistakes, or needs improvement, a top-tier model (Claude Code, Codex) connects, diagnoses, coaches, and fixes it. You just say what you want done.

```
npx agent-supervisor
```

## What This Does

1. **Detects** your agent framework (OpenClaw, Ollama, LM Studio, or any custom CLI)
2. **Generates** a `CLAUDE.md` that teaches Claude Code how to supervise your agent
3. **Installs** supervision templates (identity, rules, mistake log) into your agent's workspace
4. **Works locally** (agent on same machine) or **remotely** (agent on a server via SSH)

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
# > Install templates? → Yes

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

your-agent-workspace/       # (if templates installed)
  SOUL.md                   # Agent identity, voice, rules
  AGENTS.md                 # Operational procedures
  AGENT_LEARNINGS.md        # Mistake log — grows over time
```

### CLAUDE.md

Generated dynamically based on your setup. Teaches Claude Code:
- How to connect to your agent (local commands or SSH)
- How to send messages and maintain conversations
- Where to find logs, configs, and workspace files
- How to run health checks
- When to coach vs. directly intervene
- How to log learnings so the agent improves

### SOUL.md

Defines your agent's identity. Customize this to set:
- Personality and voice
- Thinking modes (fast operator vs. careful analysis)
- Hard rules the agent must follow
- What to do when uncertain

### AGENT_LEARNINGS.md

A growing log of mistakes and lessons. Format:
```markdown
## Iteration #1 — Descriptive Title

### Mistake
What happened.

### Impact
Why it mattered.

### Pattern to Avoid
The general rule.

### Better Approach
What to do instead.
```

The supervisor adds entries when it catches problems. The agent reads them at startup and avoids repeating mistakes. This is how the agent gets smarter over time.

## Example Usage

After setup, run `claude` and try:

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
