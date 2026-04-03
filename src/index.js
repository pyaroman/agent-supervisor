#!/usr/bin/env node

import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import ora from 'ora';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { detectLocal, detectRemote, testSSH } from './detect.js';
import { generateClaudeMd } from './generate.js';

const BANNER = `
${chalk.bold.cyan('┌─────────────────────────────────────────┐')}
${chalk.bold.cyan('│')}   ${chalk.bold('Agent Supervisor')}                       ${chalk.bold.cyan('│')}
${chalk.bold.cyan('│')}   ${chalk.dim('Let top-tier AI supervise any agent')}     ${chalk.bold.cyan('│')}
${chalk.bold.cyan('└─────────────────────────────────────────┘')}
`;

async function main() {
  console.log(BANNER);

  // Step 1: Local or Remote
  const connectionType = await select({
    message: 'Where is your agent running?',
    choices: [
      { name: 'On this machine (local)', value: 'local' },
      { name: 'On a remote server (SSH)', value: 'remote' },
    ],
  });

  let sshTarget = null;

  if (connectionType === 'remote') {
    sshTarget = await input({
      message: 'SSH connection (user@host):',
      validate: (v) => v.includes('@') || 'Format: user@host (e.g., openclaw@192.168.1.100)',
    });

    const spinner = ora('Testing SSH connection...').start();
    const connected = testSSH(sshTarget);
    if (!connected) {
      spinner.fail(`Could not connect to ${sshTarget}`);
      console.log(chalk.yellow('\nMake sure:'));
      console.log(chalk.dim('  1. SSH key-based auth is set up (no password prompt)'));
      console.log(chalk.dim('  2. The remote machine is on and reachable'));
      console.log(chalk.dim('  3. The user and host are correct'));
      console.log(chalk.dim(`\n  Test it yourself: ssh ${sshTarget} "echo connected"\n`));
      process.exit(1);
    }
    spinner.succeed(`Connected to ${sshTarget}`);
  }

  // Step 2: Detect frameworks
  const spinner = ora('Scanning for agent frameworks...').start();
  const detected = connectionType === 'local' ? detectLocal() : detectRemote(sshTarget);
  spinner.stop();

  let framework;
  let binary;
  let workspace;
  let logs;
  let customCmd = null;
  let home = process.env.HOME;

  if (detected.length > 0) {
    console.log(chalk.green(`\n  Found ${detected.length} framework${detected.length > 1 ? 's' : ''}:\n`));
    for (const d of detected) {
      console.log(chalk.dim(`  ${chalk.bold(d.name)} — ${d.binary}`));
      if (d.workspace) console.log(chalk.dim(`    Workspace: ${d.workspace}`));
      if (d.logs) console.log(chalk.dim(`    Logs: ${d.logs}`));
    }
    console.log('');

    const choices = [
      ...detected.map((d) => ({
        name: `${d.name} (auto-detected at ${d.binary})`,
        value: d.id,
      })),
      { name: 'Custom CLI (I\'ll specify the command)', value: 'custom' },
      { name: 'Raw terminal (just give supervisor shell access)', value: 'raw' },
    ];

    framework = await select({
      message: 'Which framework should the supervisor manage?',
      choices,
    });

    const match = detected.find((d) => d.id === framework);
    if (match) {
      binary = match.binary;
      workspace = match.workspace;
      logs = match.logs;
      home = match.home || process.env.HOME;
    }
  } else {
    console.log(chalk.yellow('\n  No known frameworks detected.\n'));

    framework = await select({
      message: 'What is your agent running on?',
      choices: [
        { name: 'OpenClaw (not auto-detected — I\'ll specify the path)', value: 'openclaw' },
        { name: 'Ollama (not auto-detected — I\'ll specify the path)', value: 'ollama' },
        { name: 'LM Studio', value: 'lmstudio' },
        { name: 'Custom CLI (I\'ll specify the command)', value: 'custom' },
        { name: 'Raw terminal (just give supervisor shell access)', value: 'raw' },
      ],
    });
  }

  // Get custom command if needed
  if (framework === 'custom') {
    customCmd = await input({
      message: 'Command to send a message to your agent:',
      validate: (v) => v.length > 0 || 'Enter the command (e.g., python3 agent.py --message)',
    });
  }

  // Get binary path if not detected
  if (!binary && framework !== 'custom' && framework !== 'raw') {
    binary = await input({
      message: `Path to ${framework} binary:`,
      default: framework,
    });
  }

  // Get workspace if not detected
  if (!workspace) {
    const hasWorkspace = await confirm({
      message: 'Does your agent have a workspace/config directory?',
      default: false,
    });
    if (hasWorkspace) {
      workspace = await input({
        message: 'Path to agent workspace:',
      });
    }
  } else {
    const useDetected = await confirm({
      message: `Use detected workspace at ${workspace}?`,
      default: true,
    });
    if (!useDetected) {
      workspace = await input({
        message: 'Path to agent workspace:',
      });
    }
  }

  // Get logs path if not detected
  if (!logs) {
    const hasLogs = await confirm({
      message: 'Does your agent have a logs directory?',
      default: false,
    });
    if (hasLogs) {
      logs = await input({
        message: 'Path to agent logs:',
      });
    }
  }

  // Step 3: Generate everything
  console.log('');
  const genSpinner = ora('Generating supervisor configuration...').start();

  const config = {
    framework,
    connection: connectionType,
    sshTarget,
    binary: binary || framework,
    workspace,
    logs,
    customCmd,
    home,
    createdAt: new Date().toISOString(),
  };

  // Write config file
  const configPath = join(process.cwd(), '.agent-supervisor.json');
  writeFileSync(configPath, JSON.stringify(config, null, 2));

  // Generate CLAUDE.md
  const claudeMd = generateClaudeMd(config);
  const claudeMdPath = join(process.cwd(), 'CLAUDE.md');

  if (existsSync(claudeMdPath)) {
    genSpinner.stop();
    const overwrite = await confirm({
      message: 'CLAUDE.md already exists. Overwrite with supervisor config?',
      default: false,
    });
    if (overwrite) {
      writeFileSync(claudeMdPath, claudeMd);
    } else {
      // Append instead
      const existing = readFileSync(claudeMdPath, 'utf-8');
      writeFileSync(claudeMdPath, existing + '\n\n---\n\n' + claudeMd);
      console.log(chalk.dim('  Appended supervisor config to existing CLAUDE.md'));
    }
    genSpinner.start();
  } else {
    writeFileSync(claudeMdPath, claudeMd);
  }

  genSpinner.succeed('Configuration complete!');

  // Summary
  console.log('');
  console.log(chalk.bold('  Setup complete. Here\'s what was created:\n'));
  console.log(chalk.dim(`  ${chalk.green('✓')} .agent-supervisor.json  — connection and framework config`));
  console.log(chalk.dim(`  ${chalk.green('✓')} CLAUDE.md               — supervisor instructions for Claude Code`));

  console.log('');
  console.log(chalk.bold('  Next steps:\n'));
  console.log(`  ${chalk.cyan('1.')} Run ${chalk.bold('claude')} in this directory to start supervising`);
  console.log(`  ${chalk.cyan('2.')} Ask Claude Code to check on your agent, fix problems, or improve its config`);
  console.log('');
  console.log(chalk.dim('  Example commands to try with Claude Code:'));
  console.log(chalk.dim('    "Check if the agent is running and healthy"'));
  console.log(chalk.dim('    "Read the agent\'s recent logs and tell me if anything is wrong"'));
  console.log(chalk.dim('    "Tell the agent to build X and make sure it does it right"'));
  console.log(chalk.dim('    "Add a new rule to the agent\'s SOUL.md about Y"'));
  console.log('');
}

main().catch((err) => {
  console.error(chalk.red(`\nError: ${err.message}`));
  process.exit(1);
});
