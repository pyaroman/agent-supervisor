import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATES_DIR = join(__dirname, '..', 'templates');

function readTemplate(name) {
  return readFileSync(join(TEMPLATES_DIR, name), 'utf-8');
}

export function generateClaudeMd(config) {
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

This agent runs on a remote machine. All commands must go through SSH.

\`\`\`bash
# Test connection
${sshPrefix} "echo connected"

# Interactive session
${sshPrefix}
\`\`\`

**SSH Target:** \`${sshTarget}\`
`;
  } else {
    connectSection = `## Connection

This agent runs locally on this machine. Commands run directly in the shell.
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

This project is set up to supervise a${framework === 'ollama' ? 'n' : ''} **${getFrameworkName(framework)}** agent running **${isRemote ? 'remotely' : 'locally'}**${isRemote ? ` on \`${sshTarget}\`` : ''}.

You are the **supervisor**. Your job is to:
1. **Evaluate** what the agent did — check its work, read its logs, verify its outputs
2. **Coach** the agent through problems — don't do the work for it, make it learn
3. **Fix** critical issues directly when the agent is stuck or wrong
4. **Improve** the agent's rules and learnings so it gets better over time

When the user asks you to do something on the agent's machine, use the connection details below.

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

## Rules

- **Never do the agent's job for it** unless explicitly asked or time-critical. The agent learns by doing.
- **Always add learnings** to AGENT_LEARNINGS.md when you fix something. Format: Mistake > Impact > Pattern to Avoid > Better Approach.
- **Verify before reporting.** Don't tell the user something is fixed until you've confirmed it.
- **Read before writing.** Always read a file before editing it.
- **Preserve the agent's voice.** When editing SOUL.md, maintain the agent's established personality.
`;

  return claudeMd;
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

export function generateSoulMd() {
  return readTemplate('SOUL.md');
}

export function generateAgentsMd() {
  return readTemplate('AGENTS.md');
}

export function generateLearningsMd() {
  return readTemplate('AGENT_LEARNINGS.md');
}
