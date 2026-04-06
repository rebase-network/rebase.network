import net from 'node:net';

import { startPrefixedProcess, stopProcessTree } from './helpers.mjs';

const cwd = new URL('../../', import.meta.url);
const arg = process.argv.find((value) => value.startsWith('--services='));

const requestedServices = new Set(
  (arg?.slice('--services='.length) ?? 'api,admin,web')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const serviceDefinitions = [
  {
    key: 'api',
    label: 'api',
    port: 8788,
    command: 'pnpm',
    args: ['--filter', '@rebase/api', 'dev'],
  },
  {
    key: 'admin',
    label: 'admin',
    port: 5174,
    command: 'pnpm',
    args: ['--filter', '@rebase/admin', 'dev'],
  },
  {
    key: 'web',
    label: 'web',
    port: 4321,
    command: 'pnpm',
    args: ['--filter', '@rebase/web', 'dev'],
  },
];

const activeDefinitions = serviceDefinitions.filter((definition) => requestedServices.has(definition.key));

if (activeDefinitions.length === 0) {
  console.error('No valid services selected. Use --services=api,admin,web');
  process.exit(1);
}

const canListenOnPort = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (error) => {
      if (error && (error.code === 'EADDRINUSE' || error.code === 'EACCES')) {
        resolve(false);
        return;
      }

      if (error && error.code === 'EAFNOSUPPORT') {
        resolve(true);
        return;
      }

      resolve(false);
    });

    server.once('listening', () => {
      server.close(() => resolve(true));
    });

    server.listen(port);
  });

const canConnectToPort = (port, host) =>
  new Promise((resolve) => {
    const socket = net.createConnection({ port, host });

    const done = (value) => {
      socket.destroy();
      resolve(value);
    };

    socket.setTimeout(250);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });

const isPortBusy = async (port) => {
  for (const host of ['127.0.0.1', '::1']) {
    if (await canConnectToPort(port, host)) {
      return true;
    }
  }

  return !(await canListenOnPort(port));
};

const unavailablePorts = [];

for (const definition of activeDefinitions) {
  if (await isPortBusy(definition.port)) {
    unavailablePorts.push(definition);
  }
}

if (unavailablePorts.length > 0) {
  console.error('Unable to start the local stack because these ports are already in use:');
  for (const definition of unavailablePorts) {
    console.error(`- ${definition.label}: ${definition.port}`);
  }
  console.error('Stop the existing listeners first, then run the command again.');
  process.exit(1);
}

console.log(`starting local services: ${activeDefinitions.map((definition) => definition.key).join(', ')}`);
console.log('expected ports: api 8788, admin 5174, web 4321');

const children = activeDefinitions.map((definition) => ({
  definition,
  child: startPrefixedProcess(definition, { cwd }),
}));

let shuttingDown = false;

const shutdown = (signal = 'SIGTERM') => {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  for (const { child } of children) {
    stopProcessTree(child, signal);
  }
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

for (const { definition, child } of children) {
  child.on('exit', (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const detail = signal ? `signal ${signal}` : `exit code ${code ?? 'unknown'}`;
    console.error(`[${definition.label}] stopped unexpectedly with ${detail}`);
    shutdown('SIGTERM');
    process.exitCode = code && code !== 0 ? code : 1;
  });
}

await new Promise(() => {});
