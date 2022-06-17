import * as esbuild from 'esbuild';
import { nodeExternalsPlugin } from 'esbuild-node-externals';
import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';

import { executeCmd } from './executeCmd';

const DEFAULT_PLATFORM: esbuild.Platform = 'browser' as const;

interface ReadUserPluginsReturnType {
  cjs: esbuild.Plugin[];
  esm: esbuild.Plugin[];
}

/**
 * Attempts to read a package-bundler.plugins.js
 * file from the path.cwd(). Tries to read the default export and, if found,
 * merges
 */
async function readUserPlugins(): Promise<Partial<ReadUserPluginsReturnType>> {
  const defaultOut: ReadUserPluginsReturnType = { cjs: [], esm: [] };
  const pluginFilePath = path.join(process.cwd(), 'package-bundler.plugins.js');
  try {
    const stat = await fs.stat(pluginFilePath);
    if (stat.isFile()) {
      const { default: plugins }: { default: Partial<ReadUserPluginsReturnType> | undefined } = await import(
        pluginFilePath
      );
      if (!plugins || (!plugins.cjs && !plugins.esm)) {
        console.warn(
          `User plugins for package-bundler found at ${pluginFilePath} are an invalid format. Expected default export object in the following shape:\n { cjs: [], esm: [] }`,
        );
        return defaultOut;
      }
      return plugins;
    }
  } catch (error) {
    console.warn(`Warning: Could not read user plugins to use for package-bundler from ${pluginFilePath}`);
  }
  return defaultOut;
}

export interface BuildBaseArgs {
  external: string[];
  outDir: string;
  platform?: esbuild.Platform;
  sourcemap: boolean;
  srcFilesToCompile: string[];
  target: string[];
}

export async function buildESM({
  external,
  outDir,
  sourcemap,
  srcFilesToCompile,
  target,
  platform = DEFAULT_PLATFORM,
}: BuildBaseArgs) {
  await esbuild.build({
    bundle: false,
    entryPoints: srcFilesToCompile,
    external,
    format: 'esm',
    outdir: outDir,
    platform,
    plugins: (await readUserPlugins()).esm,
    sourcemap,
    target,
  });
}

export interface BuildCJSArgs extends BuildBaseArgs {
  packageName: string;
  packageJsonFiles: string[];
}

export async function buildCJS({
  external,
  outDir,
  packageJsonFiles,
  packageName,
  platform = DEFAULT_PLATFORM,
  sourcemap,
  srcFilesToCompile,
  target,
}: BuildCJSArgs) {
  const userPlugins = await readUserPlugins();
  await esbuild.build({
    bundle: true,
    entryPoints: srcFilesToCompile,
    external,
    format: 'cjs',
    outdir: path.join(outDir, 'cjs'),
    platform,
    plugins: [
      nodeExternalsPlugin({
        packagePath: packageJsonFiles,
      }),
      ...(userPlugins.cjs ?? []),
    ],
    sourcemap,
    target,
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
      if (packageJsonSubPackageName) {
        // Don't write a package.json file for the root of the outDir if there isn't a sub name.
        // This ensures we don't accidentally clobber the package.json file if the --copyPackageJson and / or --rewritePackageJson
        // options are set
        fs.writeFileSync(
          path.join(outDir, `.${packageJsonSubPackageName}`, 'package.json'),
          JSON.stringify(pJsonTemplate, null, 2),
          'utf8',
        );
      }
    });
}
