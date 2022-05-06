# Copy Package JSON Example

An example where the package.json file specifies a built file, but from in the context of the dist/ dir post build. This example also has deep-imports, which are paths not included in the default index.js export, but can be imported by the consumers of this pacakge.

## Setup
1. `npm install`
2. `npm run build`
3. `cd dist/`
4. `npm pack`
5. Observe context of the resulting `tarball` to verify built package contents
