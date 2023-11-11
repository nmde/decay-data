import { Command } from 'commander';
import path from 'path';
import { InputReader } from './InputReader';
import { OutputWriter } from './OutputWriter';

const program = new Command();
program
  .name('Decay calculator')
  .description('Calculates decays of radionuclides')
  .version('1.0.0');

program.argument('<nuclides files>', 'Path to nuclide data CSV file');

program.option('-l, --level <level>', 'Info message importance level', '1');

async function main() {
  const p = program.parse();
  const { level } = p.opts();
  const writer = new OutputWriter();
  const reader = new InputReader(writer);
  await reader.readCSV(path.resolve(p.args[0]));
  await writer.writeFiles(Number(level));
}

main();
