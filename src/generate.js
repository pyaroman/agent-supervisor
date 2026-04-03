
export function generateSupervisorConfig(config) {
  const { framework, connection, sshTarget, binary, workspace, logs, customCmd, home } = config;
  const isRemote = connection === 'remote';
  const sshPrefix = isRemote ? `ssh -o ConnectTimeout=10 ${sshTarget}` : '';
  const pathExport = isRemote ? 'export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH && ' : '';

  let connectSection = '';
  let messageSection = '';
  let healthSection = '';
  let filesSection = '';

  if (isRemote) {
    connectSection = `## Connection

This agent runs on a remote machine at \`${sshTarget}\`. You have full terminal access via SSH — read files, write files, edit configs, run commands, restart processes, deploy changes. Anything you can do in a terminal, you can do on this machine.

\`\`\`bash
# Test connection
${sshPrefix} "echo connected"

# Run any command
${sshPrefix} "YOUR COMMAND"

# Read a file
${sshPrefix} "cat /path/to/file"

# Edit a file (use sed, tee, or heredoc)
${sshPrefix} "sed -i 's/old/new/g' /path/to/file"

# Write a new file
${sshPrefix} "cat > /path/to/file << 'EOF'
content here
EOF"
\`\`\`
`;
  } else {
    connectSection = `## Connection

This agent runs locally on this machine. You have full terminal access — read files, write files, edit configs, run commands, restart processes, deploy changes. Use your standard tools (Bash, Read, Edit, Write) to work directly on the agent.
`;
  }

  // Framework-specific messaging
  if (framework === 'openclaw') {
    const cmd = isRemote
      ? `${sshPrefix} "${pathExport}${binary} agent --agent main --session-id SESSIONID --message 'YOUR MESSAGE'"`
      : `${binary} agent --agent main --session-id SESSIONID --message 'YOUR MESSAGE'`;

    messageSection = `## Talking to the Agent

Use OpenClaw's agent command to send messages. Use session IDs to maintain conversation context.

\`\`\`bash
# Send a message (new session)
${cmd.replace('SESSIONID', 'task-$(date +%s)')}

# Continue a conversation (same session ID)
${cmd.replace('SESSIONID', 'my-session')}
\`\`\`

**Key flags:**
- \`--session-id\`: Maintains conversation context across messages
- \`--agent main\`: Uses the main agent (default)
- \`--message\`: The message to send

When coaching the agent through a problem, use the SAME session ID for all messages so it has full context.
`;
  } else if (framework === 'ollama') {
    const cmd = isRemote
      ? `${sshPrefix} "${pathExport}ollama run MODEL 'YOUR MESSAGE'"`
      : `ollama run MODEL 'YOUR MESSAGE'`;

    messageSection = `## Talking to the Agent

Use Ollama's run command to send messages.

\`\`\`bash
# List available models
${isRemote ? `${sshPrefix} "${pathExport}ollama list"` : 'ollama list'}

# Send a message
${cmd}
\`\`\`

Note: Ollama doesn't have built-in session management. Each message is independent. For multi-turn conversations, include relevant context in each message.
`;
  } else if (framework === 'lmstudio') {
    const curlTarget = isRemote ? `${sshPrefix} "curl -s http://localhost:1234/v1/chat/completions ..."` : 'curl -s http://localhost:1234/v1/chat/completions ...';

    messageSection = `## Talking to the Agent

LM Studio exposes an OpenAI-compatible API on port 1234.

\`\`\`bash
# Check if LM Studio server is running
${isRemote ? `${sshPrefix} "${pathExport}curl -s http://localhost:1234/v1/models"` : 'curl -s http://localhost:1234/v1/models'}

# Send a message
${isRemote ? `${sshPrefix} "${pathExport}` : ''}curl -s http://localhost:1234/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "YOUR MESSAGE"}],
    "temperature": 0.7
  }'${isRemote ? '"' : ''}
\`\`\`
`;
  } else if (framework === 'custom') {
    const cmd = isRemote
      ? `${sshPrefix} "${pathExport}${customCmd}"`
      : customCmd;

    messageSection = `## Talking to the Agent

Custom command configured for this agent:

\`\`\`bash
${cmd}
\`\`\`

Modify the command above to send different messages to your agent.
`;
  } else {
    messageSection = `## Talking to the Agent

This agent uses raw terminal access. Run commands directly${isRemote ? ' via SSH' : ''}.

\`\`\`bash
${isRemote ? `${sshPrefix} "YOUR COMMAND"` : '# Run commands directly in the terminal'}
\`\`\`
`;
  }

  // Workspace access
  if (workspace) {
    const readCmd = isRemote
      ? `${sshPrefix} "${pathExport}cat ${workspace}/FILENAME"`
      : `cat ${workspace}/FILENAME`;
    const listCmd = isRemote
      ? `${sshPrefix} "${pathExport}ls ${workspace}/"`
      : `ls ${workspace}/`;

    filesSection = `## Agent Workspace

The agent's workspace is at: \`${workspace}\`

\`\`\`bash
# List workspace contents
${listCmd}

# Read a file
${readCmd}
\`\`\`

### Key Files to Know
- **SOUL.md** — Agent identity, voice, rules, thinking modes
- **AGENTS.md** — Startup sequence, memory system, build monitoring rules
- **AGENT_LEARNINGS.md** — Logged mistakes and patterns to avoid
- **memory/** — Persistent memory system (daily logs, structured DB)
- **logs/** — Operational logs (cron, autopull, heartbeat)

When you update SOUL.md or AGENTS.md, the agent picks up the changes on its next session. When you add to AGENT_LEARNINGS.md, the agent reads it at startup and avoids repeating those mistakes.
`;
  } else {
    filesSection = `## Agent Workspace

No workspace directory was detected during setup. If your agent has a workspace or config directory, update the \`workspace\` field in \`.agent-supervisor.json\`.
`;
  }

  // Health checks
  if (isRemote) {
    healthSection = `## Health Checks

Run these to verify the agent is healthy:

\`\`\`bash
# Test SSH connection
${sshPrefix} "echo connected"

# Check if agent process is running
${sshPrefix} "${pathExport}${framework === 'openclaw' ? 'launchctl list | grep openclaw' : framework === 'ollama' ? 'pgrep ollama' : 'ps aux | grep -i agent'}"

# Check recent logs
${sshPrefix} "${pathExport}${logs ? `ls -lt ${logs} | head -5` : 'echo No log directory configured'}"

# Disk space
${sshPrefix} "${pathExport}df -h / | tail -1"

# Memory usage
${sshPrefix} "${pathExport}vm_stat | head -5"
\`\`\`
`;
  } else {
    healthSection = `## Health Checks

Run these to verify the agent is healthy:

\`\`\`bash
# Check if agent process is running
${framework === 'openclaw' ? 'launchctl list | grep openclaw' : framework === 'ollama' ? 'pgrep ollama || echo "Ollama not running"' : 'ps aux | grep -i agent'}

# Check recent logs
${logs ? `ls -lt ${logs} | head -5` : 'echo "No log directory configured"'}

# Disk space
df -h / | tail -1
\`\`\`
`;
  }

  const claudeMd = `# Agent Supervisor Configuration

You have full context and control over a${framework === 'ollama' ? 'n' : ''} **${getFrameworkName(framework)}** agent running **${isRemote ? 'remotely' : 'locally'}**${isRemote ? ` on \`${sshTarget}\`` : ''}. You can connect to it, navigate the terminal, read logs, edit configs, run commands, and implement changes directly.

Your job is to:
1. **Analyze** the agent's work, logs, configs, and behavior patterns
2. **Build** new capabilities, workflows, and rules for the agent
3. **Optimize** how the agent handles tasks — refactor, tighten, improve
4. **Fix** issues at the root cause, not with band-aids
5. **Coach** the agent through problems so it learns to handle them on its own

Use the connection details below to work on the agent.

${connectSection}
${messageSection}
${filesSection}
${healthSection}
## Supervision Patterns

### Coaching (preferred)
When the agent makes a mistake or gets stuck, talk it through the problem:
1. Tell it what went wrong and why
2. Ask it questions to make sure it understands
3. Make it fix the problem itself
4. Add the lesson to AGENT_LEARNINGS.md so it never repeats it

### Direct intervention (when needed)
When the agent is going in circles or time is critical:
1. Read the relevant files/logs to understand the state
2. Fix the issue directly on the machine
3. Tell the agent what you fixed and why
4. Add the lesson to AGENT_LEARNINGS.md

### System audit
When the user asks for a health check or system review:
1. Run the health check commands above
2. Read recent logs for errors
3. Check AGENT_LEARNINGS.md for recurring patterns
4. Report findings with specific recommendations

## Supervisor Memory

You have a persistent memory file at \`SUPERVISOR_MEMORY.md\` in this directory. Read it at the start of every session. Write to it whenever you learn something worth remembering.

**What to save:**
- Agent quirks and known issues (e.g., "this agent hallucinates about API limits")
- What you fixed and how (so you don't re-diagnose the same problem)
- The agent's strengths and weaknesses at specific tasks
- Configuration changes you made and why
- Patterns you've noticed in the agent's mistakes

**Format:** Use dated entries. Keep it concise. This file grows over time and makes you a better supervisor with every session.

**Always read SUPERVISOR_MEMORY.md before starting work.** It contains context from previous sessions that you won't have otherwise.

## Rules

- **Never do the agent's job for it** unless explicitly asked or time-critical. The agent learns by doing.
- **Always update SUPERVISOR_MEMORY.md** when you learn something new about the agent, fix a recurring issue, or make a significant change.
- **Verify before reporting.** Don't tell the user something is fixed until you've confirmed it.
- **Read before writing.** Always read a file before editing it.
- **Preserve the agent's voice.** When editing the agent's config files, maintain its established personality.
`;

  return claudeMd;
}

export function generateMemory() {
  return `# Supervisor Memory

This file persists across sessions. The supervisor reads it at startup and writes to it when it learns something new about the agent.

---

_No entries yet. After your first supervision session, observations about the agent will be logged here automatically._
`;
}

function getFrameworkName(id) {
  const names = {
    openclaw: 'OpenClaw',
    ollama: 'Ollama',
    lmstudio: 'LM Studio',
    custom: 'Custom',
    raw: 'Raw Terminal',
  };
  return names[id] || id;
}

