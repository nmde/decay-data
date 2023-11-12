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
