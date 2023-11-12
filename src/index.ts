import { Command } from 'commander';
import path from 'path';
import { InputReader } from './InputReader';
import { OutputWriter } from './OutputWriter';
import { Decay } from './Decay';

const program = new Command();
program
  .name('Decay calculator')
  .description('Calculates decays of radionuclides')
  .version('1.0.0');

program.argument('<nuclides file>', 'Path to nuclide data CSV file');
program.argument('<inventory file>', 'Path to inventory data CSV file');

program.requiredOption('-t, --decay-time <time>', 'The number of seconds to decay');
program.option('-l, --level <level>', 'Info message importance level', '1');
program.option('-o, --output <directory>', 'Path to output directory', 'output');

async function main() {
  const p = program.parse();
  const { level, decayTime, output } = p.opts();
  const writer = new OutputWriter(output);
  const reader = new InputReader(writer);
  const nuclides = await reader.readNuclideCSV(path.resolve(p.args[0]));
  const inventory = await reader.readInventoryCSV(path.resolve(p.args[1]));
  const decInventory = new Decay(nuclides, inventory, writer).decay(Number(decayTime));
  writer.writeOutput(decInventory);
  await writer.writeFiles(Number(level));
}

main();
