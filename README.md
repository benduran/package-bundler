# @better-builds/package-bundler

A CLI for compiling and bundling your TypeScript with ESM/CJS and deep exports support, `package-bundler` builds and bundles TypeScript packages in a style similar to `@apollo/client` and `@mui/material`, with support for deep exports to allow consumers to pick and choose imports they want. Not all imports are essential to a library, and some may carry expensive third party dependencies.

`package-bundler` will read your directory structure and produce a CJS bundle export for each subdirectory, and an ESM export for each
sub-directory and file.

`package-bundler` uses [esbuild](https://github.com/evanw/esbuild) to transpile TypeScript to JavaScript in both CommonJS and ESM formats. `package-bundler` also produces `*.d.ts` files so you can ship proper typings with your package, all with zero-to-minimal configuration.

## used by

![Netflix](./docs/assets/logos/netflix.png)

## installation

**npm**

`npm install @better-builds/package-bundler -D`

**yarn**

`yarn add @better-builds/package-bundler -D`

**pnpm**

`pnpm add @better-builds/package-bundler -D`

## usage

`package-bundler` is meant to be used *exclusively* from within a TypeScript codebase. It also makes some assumptions about your codebase, namely, that each folder in your source code contains a proper `index.ts` or `index.tsx` file that imports and / or exports anything that is needed. Without this `index.ts` or `index.tsx` file, Package Bundler will only be able to emit a valid ESM module. CommonJS compilation and bundling will not work without these index files!

## examples

Checkout the three examples in the [examples](./examples/) folder

### cli

```bash
package-bundler --help

Options:
      --version             Show version number                        [boolean]
  -c, --copyPackageJson     If true, copies the package json for the package to
                            the outDir. Useful if you are using yarn, pnpm,
                            lerna, or some other non vanilla NPM way of
                            publishing your packages. [boolean] [default: false]
  -e, --external            Marks one or more packages or file paths as
                            external, and that these packages or paths should
                            not be included in the build. For more information,
                            see ESBuild's official documentation:
                            https://esbuild.github.io/api/#external
                                                           [array] [default: []]
  -i, --ignorePaths         Array of file glob paths to exclude in the source(s)
                            being compiled. If you like these defaults, want to
                            keep them, but also provide your own, you can set
                            the --mergeIgnorePaths to have your paths merged
                            with these.
  [array] [default: ["**/*__doc**/**","**/*__test**/**","**/*__stori**/**","**/*
     .spec.*","**/*.test.*","**/*.stories.*","**/*.story.*","**/*__snipp**/**"]]
      --mergeIgnorePaths    If true, merges any provided paths you've set via
                            --ignorePaths with package-bundler's default ones.
                                                      [boolean] [default: false]
  -o, --outDir              Path to targeted publish directory relative to your
                            package working directory.
                                                    [string] [default: "./dist"]
  -p, --packageJsonFiles    An array of all of the package.json file locations
                            that contain dependencies for your package. The
                            dependencies listed in these package.json files will
                            be excluded from the CommonJS build (they are
                            automatically excluded from the ESM build).
                                                               [array] [default:
         ["/home/bduran/Documents/dev/opensource/package-bundler/package.json"]]
      --platform            Which ESBuild platform to target for the build.
           [string] [choices: "browser", "node", "neutral"] [default: "browser"]
  -r, --rewritePackageJson  If true, and used in conjunction with
                            ---copyPackageJson option, will attempt to inject
                            and / or rewrite the "main," "module," "typings,"
                            etc fields to where their paths exist in the
                            --outDir folder           [boolean] [default: false]
      --sourcemap           If true, builds sourcemap files alongside your
                            compiled files             [boolean] [default: true]
  -s, --srcDir              Path to src directory relative to your package
                            working directory.       [string] [default: "./src"]
      --target              Compilation target for the outputted JavaScript
                                                   [array] [default: ["es2018"]]
  -t, --tsconfigPath        Path to your tsconfig project file relative to your
                            package working directory.
                                           [string] [default: "./tsconfig.json"]
      --help                Show help                                  [boolean]
```

### plugins
[esbuild](https://esbuild.github.io/plugins/) supports plugins for adapting builds to your needs. `package-bundler` allows you to provide your own plugins to enrich the sensible defaults provided by `package-bundler`. To do this, you can create a file named `package-bundler.plugins.js` in your repository (or whenever your CWD will be when building with `package-bundler`). This file should have the following format:

```javascript
module.exports = {
  /**
   * (Optional) Place all CommonJS-specific plugins here. These will *only*
   * apply to the CommonJS-compiled code
   */
  cjs: [],
  /**
   * (Optional) Place all ESM-specific plugins here. These will *only*
   * apply to the ESM-compiled code
   */
  esm: [],
};
```

#### Here's a real-world example that adds support for PostCSS, AutoPrefixer and also inlines images into both CJS and ESM builds

```javascript
const autoprefixer = require('autoprefixer');
const postCssPlugin = require('@deanc/esbuild-plugin-postcss');
const inlineImage = require('esbuild-plugin-inline-image');

module.exports = {
  cjs: [postCssPlugin({ plugins: [autoprefixer] }), inlineImage()],
  esm: [postCssPlugin({ plugins: [autoprefixer] }), inlineImage()],
};
```

## contributing

This repository was built using Node `18.13.0` and `npm 9.3.0`. Please be sure you have those installed before contributing and issuing a PR. Thanks!

### Similar projects
* [tsup](https://www.npmjs.com/package/tsup)
