/**
 * Creates a publishable folder, "dist", which has esm targets by default
 * and a "esm" target for node or other consumers which need that output.
 */

import chalk from 'chalk';
import glob from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import yargs from 'yargs';

import { cleanDist } from './cleanDist';
import { buildCJS, buildESM } from './esbuild';
import { copyPackageJsonFile, rewritePackageJsonFile } from './packageJson';
import { buildTypes } from './typescript';

async function packageBundlerCli() {
  const {
    copyPackageJson,
    ignorePaths,
    packageJsonFiles,
    rewritePackageJson,
    sourcemap,
    srcDir,
    target,
    tsconfigPath,
    outDir: outDirArg,
  } = await yargs
    .scriptName('package-bundler')
    .option('copyPackageJson', {
      alias: 'c',
      default: false,
      description:
        'If true, copies the package json for the package to the outDir. Useful if you are using yarn, pnpm, lerna, or some other non vanilla NPM way of publishing your packages.',
      type: 'boolean',
    })
    .option('ignorePaths', {
      alias: 'i',
      default: [
        '**/*__doc**/**',
        '**/*__test**/**',
        '**/*__stori**/**',
        '**/*.spec*',
        '**/*.test*',
        '**/*.stories*',
        '**/*__snipp**/**',
      ],
      description: 'Array of file glob paths to exclude in the source(s) being compiled.',
      type: 'array',
    })
    .option('rewritePackageJson', {
      alias: 'r',
      default: false,
      description:
        'If true, and used in conjunction with ---copyPackageJson option, will attempt to inject and / or rewrite the "main," "module," "typings," etc fields to where their paths exist in the --outDir folder',
      type: 'boolean',
    })
    .option('outDir', {
      alias: 'o',
      default: './dist',
      description: 'Path to targeted publish directory relative to your package working directory.',
      type: 'string',
    })
    .option('packageJsonFiles', {
      alias: 'p',
      default: [path.join(process.cwd(), 'package.json')],
      description:
        'An array of all of the package.json file locations that contain dependencies for your package. The dependencies listed in these package.json files will be excluded from the CommonJS build (they are automatically excluded from the ESM build).',
      type: 'array',
    })
    .option('sourcemap', {
      default: true,
      description: 'If true, builds sourcemap files alongside your compiled files',
      type: 'boolean',
    })
    .option('srcDir', {
      alias: 's',
      default: './src',
      description: 'Path to src directory relative to your package working directory.',
      type: 'string',
    })
    .option('target', {
      default: ['es2018'],
      description: 'Compilation target for the outputted JavaScript',
      type: 'array',
    })
    .option('tsconfigPath', {
      alias: 't',
      default: './tsconfig.json',
      description: 'Path to your tsconfig project file relative to your package working directory.',
      type: 'string',
    })
    .help().argv;

  const cwd = process.cwd();
  const packageJSONPath = path.join(cwd, 'package.json');

  if (ignorePaths.length) {
    console.info(chalk.yellow(`Ignoring files that match ${ignorePaths.join(', ')}`));
  }

  console.info(chalk.yellow(`CWD for buildPackage script is:\n  ${cwd}\n`));

  try {
    if (!fs.statSync(packageJSONPath).isFile()) {
      throw new Error('No package.json file');
    }
  } catch (error) {
    console.error(chalk.red(`Unable to build package because no package.json folder was found in ${cwd}`));
    process.exit(1);
  }

  const packageJSON = JSON.parse(fs.readFileSync(packageJSONPath, 'utf8'));
  const outDir = path.join(cwd, outDirArg);
  cleanDist(outDir);
  fs.ensureDirSync(outDir);
  const { name: packageName } = packageJSON;
  const justTheName = packageName.includes('/') ? packageName.substring(packageName.lastIndexOf('/') + 1) : packageName;
  const srcFilesToCompile = glob.sync(path.join(cwd, srcDir, '**', '*.{tsx,ts}'), {
    absolute: true,
    ignore: ignorePaths,
    onlyFiles: true,
  });

  const cjsFilesToCompile = glob.sync(path.join(cwd, srcDir, '**', 'index.{tsx,ts}'), {
    absolute: true,
    onlyFiles: true,
  });

  await Promise.all([
    buildTypes(cwd, justTheName, outDir, tsconfigPath),
    buildESM(srcFilesToCompile, outDir, sourcemap, target),
    buildCJS(packageName, cjsFilesToCompile, outDir, sourcemap, packageJsonFiles, target),
  ]);
  if (copyPackageJson) {
    await copyPackageJsonFile(cwd, outDir);
    if (rewritePackageJson) await rewritePackageJsonFile(cwd, outDir);
  }
}

packageBundlerCli();
