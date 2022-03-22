#!/usr/bin/env node

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

const tsconfigPath = path.join(__dirname, '../tsconfig.json');
const distDir = path.join(__dirname, '../dist');

// 1. Remove old build
execSync(`rm -rf ${distDir}`);

// 2. Compile src via TSC
execSync(`tsc --project ${tsconfigPath}`, { stdio: 'inherit' });

// 3. Read the package.json
const pjsonPath = path.join(__dirname, '../package.json');
const pjson = JSON.parse(fs.readFileSync(pjsonPath, 'utf-8'));

// 4. Cleanup package.json items that aren't needed
delete pjson.scripts;

// 5. Write package.json to the dist folder because we publish from *inside* the distDir
fs.writeFileSync(path.join(distDir, 'package.json'), JSON.stringify(pjson, null, 2), 'utf-8');
