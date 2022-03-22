import chalk from 'chalk';
import { execSync } from 'child_process';

export function executeCmd(cmd: string, ...opts: string[]) {
  console.info(chalk.blue(`Executing ${cmd}`));
  return execSync(cmd, { ...opts, stdio: 'inherit' });
}
