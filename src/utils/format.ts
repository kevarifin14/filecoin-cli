import chalk from 'chalk';

export function jsonError(message: string, code: string, exitCode: number): void {
  process.stderr.write(JSON.stringify({ error: message, code, exitCode }) + '\n');
  process.exitCode = exitCode;
}

export function header(text: string): void {
  console.log();
  console.log(chalk.bold.cyan(text));
  console.log(chalk.cyan('-'.repeat(text.length)));
}

export function row(label: string, value: string): void {
  console.log(`  ${chalk.gray(label.padEnd(22))} ${value}`);
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

export function formatFil(attoFil: string): string {
  if (!attoFil || attoFil === '0') return '0 FIL';
  const len = attoFil.length;
  if (len <= 18) return `0.${attoFil.padStart(18, '0').replace(/0+$/, '')} FIL`;
  const whole = attoFil.slice(0, len - 18);
  const frac = attoFil.slice(len - 18).replace(/0+$/, '');
  return frac ? `${whole}.${frac} FIL` : `${whole} FIL`;
}
