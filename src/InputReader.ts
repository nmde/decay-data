import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { finished } from 'stream/promises';
import { Nuclide } from './Nuclide';
import { InputValidator } from './InputValidator';
import { OutputWriter } from './OutputWriter';
import { Inventory } from './Inventory';

/**
 * Utilities for reading input files.
 */
export class InputReader {
  private inventory: Inventory[] = [];

  private nuclides: Record<string, Nuclide> = {};

  private validator: InputValidator;

  /**
   * Constructs InputReader.
   * @param writer - The output writer.
   */
  public constructor(private writer: OutputWriter) {
    this.validator = new InputValidator(writer);
  }

  /**
   * Adds a link between a parent and daughter nuclide.
   * @param parent - The parent nuclide.
   * @param daughter - The daughter nuclide.
   * @param frequency - The branching frequency.
   */
  private addDaughter(parent: string, daughter: string, frequency: string) {
    const p = this.normalizeName(parent);
    const d = this.normalizeName(daughter);
    let f = 1;
    if (frequency.length > 0) {
      f = Number(frequency);
    }
    this.writer.writeInfo(`Adding daughter: ${p} -> ${d} (${f})`, 1);
    this.nuclides[p].daughters[d] = f;
    this.validator.validateDaughters(p, this.nuclides[p].daughters);
  }

  /**
   * Registers an isotope in the record if it doesn't already exist.
   * @param name - The name of the isotope.
   * @param half_life - The isotope's half life.
   * @param gamma_energies - The significant gamma energies.
   * @param gamma_frequency - The significant gamma frequencies.
   * @param stable - If the nuclide has been marked as stable.
   */
  private addNuclide(
    name: string,
    half_life: string,
    gamma_energies: string,
    gamma_frequency: string,
    stable: boolean,
  ) {
    const nname = this.normalizeName(name);
    let nuclide = new Nuclide(nname, Infinity, {}, stable, {});
    if (!stable) {
      nuclide = new Nuclide(
        nname,
        this.normalizeHalfLife(half_life),
        this.parseGammas(gamma_energies, gamma_frequency),
        stable,
        {},
      );
    }
    if (!this.nuclides[nname]) {
      this.writer.writeInfo(`Adding new nuclide: ${nname}`, 1);
      this.nuclides[nname] = nuclide;
      this.validator.validateGammas(nuclide);
    } else {
      this.validator.compareNuclideData(this.nuclides[nname], nuclide);
    }
  }

  /**
   * Returns if a nuclide has been marked as stable.
   * @param nuclide - The nuclide to check.
   * @returns If the nuclide has been marked as stable.
   */
  private isStable(nuclide: string) {
    return nuclide.indexOf('(stable)') >= 0;
  }

  /**
   * Normalizes a half-life string to seconds.
   * @param half_life - The half-life string.
   * @returns The half life, in seconds.
   */
  private normalizeHalfLife(half_life: string) {
    const t = half_life.replace(/([0-9\.]+).*/g, '$1');
    const u = half_life.replace(t, '').replace(/\s/g, '');
    let t12 = 0;
    switch (u) {
      case 'y':
        t12 = Number(t) * 3.154e7;
        break;
      case 'd':
        t12 = Number(t) * 86400;
        break;
      case 'hr':
      case 'h':
        t12 = Number(t) * 3600;
        break;
      case 'm':
        t12 = Number(t) * 60;
        break;
      case 's':
        t12 = Number(t);
        break;
      default:
        this.writer.writeError(`Error reading half-life: ${half_life}`);
    }
    return t12;
  }

  /**
   * Normalizes nuclide names.
   * @param name - The name to normalize.
   * @returns The normalized name.
   */
  private normalizeName(name: string) {
    return name.replace('(stable)', '').trim();
  }

  /**
   * Parses gamma energies & frequencies.
   * @param energies - The most significant gamma energy, or a list of gamma energies and frequencies.
   * @param frequency - The most significant gamma frequency.
   */
  private parseGammas(energies: string, frequency: string) {
    const gammas: Record<string, number> = {};
    if (energies.length > 0) {
      if (energies.indexOf(',') < 0) {
        gammas[energies] = Number(frequency);
      } else {
        energies.split(',').forEach((g) => {
          const s = g.split('*');
          gammas[s[0].trim()] = Number(s[1].trim());
        });
      }
    }
    return gammas;
  }

  /**
   * Processes an individual record.
   * @param record - The record to process.
   * @param index - The index to start reading at.
   * @param parent - The parent nuclide, if any.
   */
  private processRecord(record: string[], index: number, parent?: string) {
    if (typeof parent === 'string') {
      this.addDaughter(parent, record[index], record[index + 1]);
    }
    if (this.isStable(record[index])) {
      this.addNuclide(record[index], '', '', '', true);
    } else {
      this.addNuclide(
        record[index],
        record[index + 2],
        record[index + 4],
        record[index + 5],
        false,
      );
      const daughter = record[index + 6];
      if (daughter.length > 0) {
        this.processRecord(record, index + 6, record[index]);
      }
    }
  }

  /**
   * Reads input from the given CSV file.
   * @param path - The path to the file to read.
   */
  public async readInventoryCSV(path: string) {
    this.writer.writeInfo(`Reading inventory from ${path}`, 0);
    const records: string[][] = [];
    const parser = createReadStream(path).pipe(parse());
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    await finished(parser);
    for (let i = 1; i < records.length; i += 1) {
      if (this.nuclides[records[i][0]]) {
        this.inventory.push(
          new Inventory(this.nuclides[records[i][0]], Number(records[i][1])),
        );
      } else {
        this.writer.writeError(`Nuclide not found in data: ${records[i][0]}`);
      }
    }
    this.writer.writeInventory(this.inventory);
    return this.inventory;
  }

  /**
   * Reads input from the given CSV file.
   * @param path - The path to the file to read.
   */
  public async readNuclideCSV(path: string) {
    this.writer.writeInfo(`Reading nuclides from ${path}`, 0);
    const records: string[][] = [];
    const parser = createReadStream(path).pipe(parse());
    parser.on('readable', () => {
      let record;
      while ((record = parser.read()) !== null) {
        records.push(record);
      }
    });
    await finished(parser);
    for (let i = 1; i < records.length; i += 1) {
      if (records[i][0].length > 0) {
        this.processRecord(records[i], 0);
      } else {
        // Join with line above
        let start = 0;
        let firstEntry = '';
        while (start < records[i].length && firstEntry.length === 0) {
          if (records[i][start].length > 0) {
            firstEntry = records[i][start];
          } else {
            start += 1;
          }
        }
        let parentLine = i - 1;
        while (records[parentLine][start - 6].length === 0) {
          parentLine -= 1;
        }
        this.processRecord(records[i], start, records[parentLine][start - 6]);
      }
    }
    this.writer.writeNuclides(this.nuclides);
    return this.nuclides;
  }
}
