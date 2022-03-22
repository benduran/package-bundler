# package-bundler

A CLI for compiling and bundling your TypeScript with ESM/CJS and deep exports support, `package-bundler` builds and bundles TypeScript packages in a style similar to `@apollo/client` and `@mui/material`, with support for deep exports to allow consumers to pick and choose imports they want. Not all imports are essential to a library, and some may carry expensive third party dependencies.

`package-bundler` will read your directory structure and produce a CJS bundle export for each subdirectory, and an ESM export for each
sub-directory and file.

`package-bundler` uses [esbuild](https://github.com/evanw/esbuild) to transpile TypeScript to JavaScript in both CommonJS and ESM formats. `package-bundler` also produces `*.d.ts` files so you can ship proper typings with your package, all with zero-to-minimal configuration.

## installation

**npm**

`npm install package-bundler -D`

**yarn**

`yarn add package-bundler -D`

**pnpm**

`pnpm add package-bundler -D`

## usage

`package-bundler` is meant to be used *exclusively* from within a TypeScript codebase. It also makes some assumptions about your codebase, namely, that each folder in your source code contains a proper `index.ts` or `index.tsx` file that imports and / or exports anything that is needed. Without this `index.ts` or `index.tsx` file, Package Bundler will only be able to emit a valid ESM module. CommonJS compilation and bundling will not work without these index files!

### cli

```bash
package-bundler --help

/src/cli.ts --help
Options:
      --version             Show version number                        [boolean]
  -c, --copyPackageJson     If true, copies the package json for the package to
                            the outDir. Useful if you are using yarn, pnpm,
                            lerna, or some other non vanilla NPM way of
                            publishing your packages. [boolean] [default: false]
  -i, --ignorePaths         Array of file glob paths to exclude in the source(s)
                            being compiled.
  [array] [default: ["**/*__doc**/**","**/*__test**/**","**/*__stori**/**","**/*
                       .spec*","**/*.test*","**/*.stories*","**/*__snipp**/**"]]
  -r, --rewritePackageJson  If true, and used in conjunction with
                            ---copyPackageJson option, will attempt to inject
                            and / or rewrite the "main," "module," "typings,"
                            etc fields to where their paths exist in the
                            --outDir folder           [boolean] [default: false]
  -o, --outDir              Path to targeted publish directory relative to your
                            package working directory.
                                                    [string] [default: "./dist"]
  -p, --packageJsonFiles    An array of all of the package.json file locations
                            that contain dependencies for your package. The
                            dependencies listed in these package.json files will
                            be excluded from the CommonJS build (they are
                            automatically excluded from the ESM build).
                                                               [array] [default:
          ["/home/bduran/Documents/dev/netflix/hawkins-community/package.json"]]
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
