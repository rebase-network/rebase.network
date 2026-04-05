import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const defaultEnvCandidates = ['infra/directus/.env.local', 'infra/directus/.env.example'];

export function resolveEnvFile(explicitPath) {
  if (explicitPath) {
    const resolved = resolve(explicitPath);
    if (!existsSync(resolved)) {
      throw new Error(`Directus env file not found: ${resolved}`);
    }
    return resolved;
  }

  for (const candidate of defaultEnvCandidates) {
    const resolved = resolve(candidate);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error('No Directus env file found. Expected infra/directus/.env.local or .env.example.');
}

export function parseEnvFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const result = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = value;
  }

  return result;
}

export function loadDirectusEnv(explicitPath) {
  const envFile = resolveEnvFile(explicitPath);
  return {
    envFile,
    values: parseEnvFile(envFile),
  };
}

export function composeArgs(envFile) {
  return ['compose', '--env-file', envFile, '-f', 'infra/directus/docker-compose.yml'];
}
