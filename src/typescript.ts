import fs from 'fs-extra';
import path from 'path';

import { executeCmd } from './executeCmd';

export function buildTypes(cwd: string, justTheName: string, outDir: string, tsconfigPath: string) {
  let buildTypeCmd = `tsc --project ${path.join(cwd, tsconfigPath)} --emitDeclarationOnly --outDir ${outDir}`;
  executeCmd(buildTypeCmd);
  const dirsInDist = fs.readdirSync(outDir);
  // TSC built out other deps and put them in their own folder
  if (dirsInDist.includes(justTheName)) {
    dirsInDist.forEach(dir => {
      const dirPath = path.join(outDir, dir);
      if (!dir.includes(justTheName)) {
        executeCmd(`rm -rf ${dirPath}`);
      }
    });
    executeCmd(`cp -r ${path.join(outDir, justTheName, 'src', '*')} ${outDir}`);
    executeCmd(`rm -rf ${path.join(outDir, justTheName)}`);
  }
}
