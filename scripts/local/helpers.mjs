import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline';

const defaultEnv = { ...process.env };
const resolveCwd = (cwd) => (cwd instanceof URL ? fileURLToPath(cwd) : cwd);

export function runCommand(command, args, options = {}) {
  const { cwd = process.cwd(), env = defaultEnv, stdio = 'inherit' } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: resolveCwd(cwd),
      env,
      stdio,
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
      reject(new Error(`${command} ${args.join(' ')} failed with ${detail}`));
    });
  });
}

export function captureCommand(command, args, options = {}) {
  const { cwd = process.cwd(), env = defaultEnv } = options;

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: resolveCwd(cwd),
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', reject);
    child.on('exit', (code, signal) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
      reject(new Error(`${command} ${args.join(' ')} failed with ${detail}\n${stderr.trim()}`.trim()));
    });
  });
}

export async function waitForContainerHealthy(containerName, options = {}) {
  const { timeoutMs = 120_000, intervalMs = 2_000, cwd = process.cwd() } = options;
  const startedAt = Date.now();

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const { stdout } = await captureCommand('docker', ['inspect', '-f', '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}', containerName], {
        cwd,
      });
      const status = stdout.trim();

      if (status === 'healthy' || status === 'running') {
        return;
      }
    } catch {
      // Ignore transient startup and missing-container states while waiting.
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error(`timed out waiting for container ${containerName} to become healthy`);
}

export function startPrefixedProcess(definition, options = {}) {
  const { cwd = process.cwd(), env = defaultEnv } = options;
  const child = spawn(definition.command, definition.args, {
    cwd: resolveCwd(cwd),
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
    detached: true,
  });

  const attach = (stream, output) => {
    if (!stream) {
      return;
    }

    const rl = readline.createInterface({ input: stream });
    rl.on('line', (line) => {
      output.write(`[${definition.label}] ${line}\n`);
    });
  };

  attach(child.stdout, process.stdout);
  attach(child.stderr, process.stderr);

  return child;
}

export function stopProcessTree(child, signal = 'SIGTERM') {
  if (!child || child.killed) {
    return;
  }

  try {
    process.kill(-child.pid, signal);
  } catch {
    // Ignore already-exited processes.
  }
}
