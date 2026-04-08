const { spawn } = require('node:child_process');

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const children = [];

function start(script) {
  const child = spawn(npmCommand, ['run', script], {
    stdio: 'inherit',
    env: process.env
  });

  child.on('exit', (code, signal) => {
    if (signal) {
      shutdown(signal);
      return;
    }

    if (code && code !== 0) {
      process.exitCode = code;
      shutdown();
    }
  });

  children.push(child);
  return child;
}

function shutdown(signal = 'SIGTERM') {
  while (children.length > 0) {
    const child = children.pop();

    if (child && !child.killed) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => {
  shutdown('SIGINT');
  process.exit(130);
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
  process.exit(143);
});

start('start:api');
start('start:client');
