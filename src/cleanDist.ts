import { executeCmd } from './executeCmd';

export function cleanDist(outDir: string) {
  executeCmd(`rm -rf ${outDir}`);
}
