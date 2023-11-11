import fs from 'fs/promises';
import path from 'path';
import * as prettier from 'prettier';
import { Nuclide } from './Nuclide';

/**
 * Utility methods for writing output files.
 */
export class OutputWriter {
  private errors: string[] = [];

  private info: string[][] = [];

  private nuclides: Record<string, Nuclide> = {};

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
    const outputDir = path.resolve('.', 'output');
    const errorFile = path.join(outputDir, 'error.log');
    const infoFile = path.join(outputDir, 'info.log');
    const nuclidesFile = path.join(outputDir, 'nuclides.json');
    try {
      await fs.access(outputDir);
    } catch (err) {
      await fs.mkdir(outputDir);
    }
    await fs.writeFile(errorFile, this.errors.join('\n'));
    let info: string[] = [];
    for (let i = 0; i < level; i += 1) {
      info = info.concat(this.info[i]);
    }
    await fs.writeFile(infoFile, info.join('\n'));
    await fs.writeFile(
      nuclidesFile,
      await prettier.format(JSON.stringify(this.nuclides), { parser: 'json' }),
    );
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
   * Writes the processed nuclides to a JSON file.
   * @param nuclides - The nuclides.
   */
  public writeNuclides(nuclides: Record<string, Nuclide>) {
    this.nuclides = nuclides;
  }
}
