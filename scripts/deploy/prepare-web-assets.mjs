import { access, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const generatedConfigPath = path.resolve(projectRoot, 'apps/web/dist/server/wrangler.json');
const templateConfigPath = path.resolve(projectRoot, 'apps/web/wrangler.template.jsonc');
const outputConfigPath = path.resolve(projectRoot, 'apps/web/dist/server/wrangler.production.json');

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const mergeConfig = (generatedConfig, templateConfig) => ({
  ...generatedConfig,
  ...templateConfig,
  vars: {
    ...(generatedConfig.vars ?? {}),
    ...(templateConfig.vars ?? {}),
  },
  observability: {
    ...(generatedConfig.observability ?? {}),
    ...(templateConfig.observability ?? {}),
  },
});

const main = async () => {
  await access(generatedConfigPath, fsConstants.F_OK);
  await access(templateConfigPath, fsConstants.F_OK);

  const generatedConfig = await readJson(generatedConfigPath);
  const templateConfig = await readJson(templateConfigPath);
  const deployConfig = mergeConfig(generatedConfig, templateConfig);

  await writeFile(outputConfigPath, `${JSON.stringify(deployConfig, null, 2)}\n`, 'utf8');
  console.log(`wrote ${path.relative(projectRoot, outputConfigPath)}`);
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
