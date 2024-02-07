import fs from 'fs/promises';
import path from 'path';
import * as prettier from 'prettier';
import { Nuclide } from './Nuclide';
import { Inventory } from './Inventory';

/**
 * Utility methods for writing output files.
 */
export class OutputWriter {
  private delta: string[][] = [];

  private errors: string[] = [];

  private info: string[][] = [];

  private inventory: Inventory[] = [];

  private matrices: { label: string; contents: number[][] }[] = [];

  private nuclides: Record<string, Nuclide> = {};

  private output: Inventory[] = [];

  /**
   * Constructs OutputWriter.
   * @param outputDir - The directory to write output files to.
   */
  public constructor(private outputDir: string) {}

  /**
   * Writes an error message.
   * @param message - The message to write.
   */
  public writeError(message: string) {
    this.errors.push(message);
  }

  /**
   * Writes the output files.
   * @param level - The minimum info level to print.
   */
  public async writeFiles(level: number) {
    const outputDir = path.resolve(this.outputDir);
    const errorFile = path.join(outputDir, 'error.log');
    const infoFile = path.join(outputDir, 'info.log');
    const nuclidesFile = path.join(outputDir, 'nuclides.json');
    const inventoryFile = path.join(outputDir, 'inventory.json');
    const outputFile = path.join(outputDir, 'output.json');
    const matrixFile = path.join(outputDir, 'matrices.json');
    try {
      await fs.access(outputDir);
    } catch (err) {
      await fs.mkdir(outputDir);
    }
    await fs.writeFile(errorFile, this.errors.join('\n'));
    let info: string[] = [];
    for (let i = 0; i <= level; i += 1) {
      info = info.concat(this.info[i]);
    }
    await fs.writeFile(infoFile, info.join('\n'));
    await this.writeJSON(nuclidesFile, this.nuclides);
    await this.writeJSON(inventoryFile, this.inventory);
    await this.writeJSON(outputFile, this.output);
    await this.writeJSON(matrixFile, this.matrices);
    let table = '\\begin{longtable}{|l|l|l|l|}\n\t\\caption{Isotope Decay Data}\n\t\\\\\\hline\n\t\t\\bf Nuclide & \\bf Half-Life (s) & \\bf Gamma Energies & \\bf Decay Products \\\\\\hline\n\t\t';
    Object.values(this.nuclides).forEach((nuclide) => {
      let gamma_energies = '';
      const gammas = Object.entries(nuclide.gammas);
      if (gammas.length > 0) {
        gamma_energies = '\\begin{tabular}{c|c}';
        gammas.forEach(([energy, percent]) => {
          gamma_energies += `\n\t\t\t${energy} & ${percent} \\\\`;
        });
        gamma_energies += '\n\t\t\\end{tabular}';
      }
      let decay_products = '';
      const products = Object.entries(nuclide.daughters);
      if (products.length > 0) {
        decay_products = '\\begin{tabular}{c|c}';
        products.forEach(([daughter, bf]) => {
          decay_products += `\n\t\t\t${daughter} & ${(bf * 100).toFixed(2)}\\% \\\\`;
        });
        decay_products += '\n\t\t\\end{tabular}';
      }
      let half_life = `${nuclide.half_life.toPrecision(4)}`;
      if (nuclide.stable) {
        half_life = 'Stable';
      }
      table += `${nuclide.name} & ${half_life} & ${gamma_energies} & ${decay_products} \\\\\\hline\n\t\t`;
    });
    table += `\\label{tab:isotope-decay-data}\n\\end{longtable}`;
    await fs.writeFile(path.join(outputDir, 'nuclides.tex'), table);
    console.log(`Output written to ${outputDir}`);
  }

  /**
   * Writes an info message.
   * @param message - The message to write.
   * @param level - The message importance level.
   */
  public writeInfo(message: string, level: number) {
    if (!this.info[level]) {
      this.info[level] = [];
    }
    this.info[level].push(message);
  }

  /**
   * Writes the inventory to a JSON file.
   * @param inventory - The inventory.
   */
  public writeInventory(inventory: Inventory[]) {
    this.inventory = inventory;
  }

  /**
   * Helper method to write prettified JSON to a file.
   * @param file - The file to write to.
   * @param obj - The object to write.
   */
  private async writeJSON(file: string, obj: Object) {
    await fs.writeFile(
      file,
      await prettier.format(JSON.stringify(obj), { parser: 'json' }),
    );
  }

  /**
   * Writes a matrix.
   * @param label - The name/label of the matrix.
   * @param contents - The matrix contents.
   */
  public writeMatrix(label: string, contents: number[][]) {
    this.matrices.push({ label, contents });
  }

  /**
   * Writes the processed nuclides to a JSON file.
   * @param nuclides - The nuclides.
   */
  public writeNuclides(nuclides: Record<string, Nuclide>) {
    this.nuclides = nuclides;
  }

  /**
   * Writes the main output file.
   * @param inventory - The inventory.
   */
  public writeOutput(inventory: Inventory[]) {
    this.output = inventory;
  }
}
