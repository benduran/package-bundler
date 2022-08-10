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
import { BuildBaseArgs, buildCJS, buildESM } from './esbuild';
import { copyPackageJsonFile, rewritePackageJsonFile } from './packageJson';
import { buildTypes } from './typescript';

const DEFAULT_IGNORE_PATHS = [
  '**/*__doc**/**',
  '**/*__test**/**',
  '**/*__stori**/**',
  '**/*.spec.*',
  '**/*.test.*',
  '**/*.stories.*',
  '**/*.story.*',
  '**/*__snipp**/**',
];

async function packageBundlerCli() {
  const {
    copyPackageJson,
    noCJS,
    external,
    ignorePaths,
    mergeIgnorePaths,
    packageJsonFiles,
    platform,
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
    .option('external', {
      alias: 'e',
      default: [],
      description:
        "Marks one or more packages or file paths as external, and that these packages or paths should not be included in the build. For more information, see ESBuild's official documentation: https://esbuild.github.io/api/#external",
      type: 'array',
    })
    .option('ignorePaths', {
      alias: 'i',
      default: DEFAULT_IGNORE_PATHS,
      description:
        'Array of file glob paths to exclude in the source(s) being compiled. If you like these defaults, want to keep them, but also provide your own, you can set the --mergeIgnorePaths to have your paths merged with these.',
      type: 'array',
    })
    .option('mergeIgnorePaths', {
      description:
        "If true, merges any provided paths you've set via --ignorePaths with package-bundler's default ones.",
      default: false,
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
    .option('platform', {
      choices: ['browser', 'node', 'neutral'],
      default: 'browser',
      description: 'Which ESBuild platform to target for the build.',
      type: 'string',
    })
    .option('rewritePackageJson', {
      alias: 'r',
      default: false,
      description:
        'If true, and used in conjunction with ---copyPackageJson option, will attempt to inject and / or rewrite the "main," "module," "typings," etc fields to where their paths exist in the --outDir folder',
      type: 'boolean',
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
    .option('noCJS', {
      default: false,
      description: 'If true, disables generating CJS files.',
      type: 'boolean',
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

  const mergedIgnorePaths = mergeIgnorePaths ? [...DEFAULT_IGNORE_PATHS, ...ignorePaths] : ignorePaths;

  const srcFilesToCompile = glob.sync(path.join(cwd, srcDir, '**', '*.{tsx,ts}'), {
    absolute: true,
    ignore: mergedIgnorePaths,
    onlyFiles: true,
  });

  const cjsFilesToCompile = glob.sync(path.join(cwd, srcDir, '**', 'index.{tsx,ts}'), {
    absolute: true,
    ignore: mergedIgnorePaths,
    onlyFiles: true,
  });

  const builds = [
    buildTypes(cwd, justTheName, outDir, tsconfigPath),
    buildESM({
      external,
      outDir,
      platform: platform as BuildBaseArgs['platform'],
      sourcemap,
      srcFilesToCompile,
      target,
    }),
  ];

  if (noCJS) {
    console.info(chalk.yellow(`Skipping CJS build due to noCJS flag`));
  } else {
    builds.push(
      buildCJS({
        external,
        outDir,
        packageJsonFiles,
        packageName,
        platform: platform as BuildBaseArgs['platform'],
        sourcemap,
        srcFilesToCompile: cjsFilesToCompile,
        target,
      }),
    );
  }

  await Promise.all(builds);

  if (copyPackageJson) {
    await copyPackageJsonFile(cwd, outDir);
    if (rewritePackageJson) await rewritePackageJsonFile(cwd, outDir, noCJS);
  }
}

packageBundlerCli();
