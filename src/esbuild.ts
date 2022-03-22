import * as esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import { sassPlugin } from 'esbuild-sass-plugin';
import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import { executeCmd } from './executeCmd';

export async function buildESM(srcFilesToCompile: string[], outDir: string, sourcemap: boolean, target: string[]) {
  await esbuild.build({
    sourcemap,
    target,
    bundle: false,
    entryPoints: srcFilesToCompile,
    format: 'esm',
    outdir: outDir,
    plugins: [sassPlugin()],
  });
}

export async function buildCJS(
  packageName: string,
  cjsFilesToCompile: string[],
  outDir: string,
  sourcemap: boolean,
  packageJsonFiles: string[],
  target: string[],
) {
  await esbuild.build({
    sourcemap,
    target,
    bundle: true,
    entryPoints: cjsFilesToCompile,
    format: 'cjs',
    outdir: path.join(outDir, 'cjs'),
    plugins: [
      nodeExternalsPlugin({
        packagePath: packageJsonFiles,
      }),
      sassPlugin(),
    ],
  });
  const compiledCJSFiles = glob.sync(path.join(outDir, 'cjs', '**', '*.js'), { absolute: true, onlyFiles: true });
  compiledCJSFiles.forEach(cjsFilePath => {
    fs.moveSync(cjsFilePath, cjsFilePath.replace(/\.js$/, '.cjs.js'));
  });

  executeCmd(`cp -r ${path.join(outDir, 'cjs', '*')} ${outDir}`);
  executeCmd(`rm -rf ${path.join(outDir, 'cjs')}`);
  glob
    .sync(path.join(outDir, '**', '*.cjs.js'), { absolute: true, onlyFiles: true })
    .filter(cjsFilePath => !cjsFilePath.includes('dist/index.cjs.js'))
    .forEach(cjsFilePath => {
      const mainFile = path.basename(cjsFilePath);
      const packageJsonSubPackageName = cjsFilePath
        .replace(outDir, '')
        .replace(mainFile, '')
        .replace(/(\\|\/)$/, '');
      const pJsonTemplate = {
        main: mainFile,
        module: mainFile.replace('.cjs', ''),
        name: `${packageName}/${packageJsonSubPackageName.replace(/^(\/|\\)/, '')}`,
        types: 'index.d.ts',
      };
      fs.writeFileSync(
        path.join(outDir, `.${packageJsonSubPackageName}`, 'package.json'),
        JSON.stringify(pJsonTemplate, null, 2),
        'utf8',
      );
    });
}
