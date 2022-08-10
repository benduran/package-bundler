import fs from 'fs-extra';
import path from 'path';
import type { PackageJson } from 'type-fest';

import { executeCmd } from './executeCmd';

export async function copyPackageJsonFile(cwd: string, outDir: string) {
  const pjsonPath = path.join(cwd, 'package.json');
  executeCmd(`cp ${pjsonPath} ${outDir}`);
}

export async function rewritePackageJsonFile(cwd: string, outDir: string, noCJS: boolean) {
  const pjsonDistPath = path.join(outDir, 'package.json');
  const pjson = JSON.parse(await fs.readFile(pjsonDistPath, 'utf8')) as PackageJson;
  pjson.main = noCJS ? './index.js' : './index.cjs.js';
  pjson.module = './index.js';
  pjson.types = './index.d.ts';
  delete pjson.publishConfig?.main;
  delete pjson.publishConfig?.module;
  delete pjson.publishConfig?.types;
  delete pjson.publishConfig?.files;
  await fs.writeFile(pjsonDistPath, JSON.stringify(pjson, null, 2), 'utf8');
}
