import { execSync } from 'child_process';

const FRAMEWORKS = [
  {
    id: 'openclaw',
    name: 'OpenClaw',
    detect: [
      'which openclaw',
      'which /opt/homebrew/bin/openclaw',
      'test -f /opt/homebrew/bin/openclaw && echo /opt/homebrew/bin/openclaw',
      'test -f /usr/local/bin/openclaw && echo /usr/local/bin/openclaw',
    ],
    workspace: [
      '$HOME/.openclaw/workspace',
      '$HOME/.openclaw/',
    ],
    configFiles: ['SOUL.md', 'AGENTS.md', 'AGENT_LEARNINGS.md'],
    messageCmd: (bin, msg) => `${bin} agent --agent main --message '${msg.replace(/'/g, "'\\''")}'`,
    sessionCmd: (bin, sessionId, msg) => `${bin} agent --agent main --session-id ${sessionId} --message '${msg.replace(/'/g, "'\\''")}'`,
    logPaths: ['$HOME/logs/', '$HOME/.openclaw/workspace/logs/'],
    description: 'Full agent framework with skills, memory, cron, and multi-channel support',
  },
  {
    id: 'ollama',
    name: 'Ollama',
    detect: [
      'which ollama',
      'test -f /usr/local/bin/ollama && echo /usr/local/bin/ollama',
    ],
    workspace: [],
    configFiles: [],
    messageCmd: (bin, msg) => `${bin} run $(${bin} list --json 2>/dev/null | head -1 || echo "llama3") "${msg.replace(/"/g, '\\"')}"`,
    sessionCmd: null,
    logPaths: ['$HOME/.ollama/logs/'],
    description: 'Local LLM runner — run open-source models on your own hardware',
  },
  {
    id: 'lmstudio',
    name: 'LM Studio',
    detect: [
      'which lms',
      'test -d "$HOME/.lmstudio" && echo found',
      'test -d "/Applications/LM Studio.app" && echo found',
    ],
    workspace: ['$HOME/.lmstudio/'],
    configFiles: [],
    messageCmd: (_bin, msg) => `curl -s http://localhost:1234/v1/chat/completions -H "Content-Type: application/json" -d '{"messages":[{"role":"user","content":"${msg.replace(/'/g, "'\\''")}"}]}'`,
    sessionCmd: null,
    logPaths: ['$HOME/.lmstudio/logs/'],
    description: 'Desktop app for running local LLMs with a chat UI and API server',
  },
];

function runCmd(cmd, options = {}) {
  try {
    return execSync(cmd, {
      encoding: 'utf-8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe'],
      ...options,
    }).trim();
  } catch {
    return null;
  }
}

function runRemote(sshTarget, cmd) {
  // Use single quotes for the outer SSH command to prevent local shell expansion
  // Then use double quotes inside for the actual command
  return runCmd(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${sshTarget} 'export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH && ${cmd.replace(/'/g, "'\\''")}'`);
}

function expandHome(p, home) {
  return p.replace('$HOME', home);
}

export function detectLocal() {
  const found = [];
  const home = process.env.HOME || '/root';

  for (const fw of FRAMEWORKS) {
    for (const cmd of fw.detect) {
      const result = runCmd(cmd);
      if (result) {
        const binary = result.includes('/') ? result : runCmd(`which ${fw.id}`) || result;
        let workspace = null;
        for (const wp of fw.workspace) {
          const expanded = expandHome(wp, home);
          if (runCmd(`test -d "${expanded}" && echo yes`)) {
            workspace = expanded;
            break;
          }
        }
        let logs = null;
        for (const lp of fw.logPaths) {
          const expanded = expandHome(lp, home);
          if (runCmd(`test -d "${expanded}" && echo yes`)) {
            logs = expanded;
            break;
          }
        }
        found.push({
          ...fw,
          binary,
          workspace,
          logs,
          connection: 'local',
        });
        break;
      }
    }
  }
  return found;
}

export function detectRemote(sshTarget) {
  const found = [];
  const home = runRemote(sshTarget, 'echo $HOME') || '/root';

  for (const fw of FRAMEWORKS) {
    for (const cmd of fw.detect) {
      const result = runRemote(sshTarget, cmd);
      if (result) {
        const binary = result.includes('/') ? result : fw.id;
        let workspace = null;
        for (const wp of fw.workspace) {
          const expanded = expandHome(wp, home);
          if (runRemote(sshTarget, `test -d "${expanded}" && echo yes`)) {
            workspace = expanded;
            break;
          }
        }
        let logs = null;
        for (const lp of fw.logPaths) {
          const expanded = expandHome(lp, home);
          if (runRemote(sshTarget, `test -d "${expanded}" && echo yes`)) {
            logs = expanded;
            break;
          }
        }
        found.push({
          ...fw,
          binary,
          workspace,
          logs,
          connection: 'remote',
          sshTarget,
          home,
        });
        break;
      }
    }
  }
  return found;
}

export function testSSH(sshTarget) {
  return runCmd(`ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${sshTarget} "echo connected"`) === 'connected';
}

export { FRAMEWORKS, runCmd, runRemote };
