import * as math from 'mathjs';
import { Inventory } from './Inventory';
import { Nuclide } from './Nuclide';
import { OutputWriter } from './OutputWriter';
import { Graph } from './Graph';
import { GraphNode } from './GraphNode';
import { Matrix } from './Matrix';

const parser = math.parser();

// TODO: ouput number density, activity, activity * energies

/**
 * Performs the decay calculations.
 */
export class Decay {
  /**
   * Constructs Decay.
   * @param nuclides - The nuclide data.
   * @param inventory - The nuclide inventory.
   * @param writer - The output writer.
   */
  public constructor(
    private nuclides: Record<string, Nuclide>,
    private inventory: Inventory[],
    private writer?: OutputWriter,
  ) {}

  /**
   * Decays x seconds.
   * @param time - The time to decay.
   */
  public decay(time: number) {
    this.writer?.writeInfo(`Decaying ${time} seconds`, 0);
    this.writer?.writeInfo(`Constructing Lambda matrix`, 2);
    // Build progeny chain, ensuring daughter are always sorted lower than their parents
    let nuclide_list = [...this.inventory];
    const d: number[] = [];
    let i = nuclide_list.length - 1;
    while (i < nuclide_list.length) {
      Object.keys(this.nuclides[nuclide_list[i].nuclide].daughters).forEach(
        (daughter) => {
          let number = 0;
          const idx = nuclide_list.findIndex((v) => v.nuclide === daughter);
          if (idx >= 0) {
            d.push(idx);
            number = nuclide_list[idx].number;
          }
          nuclide_list.push(new Inventory(daughter, number));
        },
      );
      i += 1;
    }
    d.forEach((idx) => {
      nuclide_list.splice(idx, 1);
    });
    // Create the Λ matrix
    const rows: number[] = [];
    const cols: number[] = [];
    const data: number[] = [];
    for (const parent of nuclide_list) {
      const j = nuclide_list.findIndex((n) => n.nuclide === parent.nuclide);
      rows.push(j);
      cols.push(j);
      const lambd = this.nuclides[parent.nuclide].lambda;
      data.push(-lambd);
      for (const [daughter, bf] of Object.entries(
        this.nuclides[parent.nuclide].daughters,
      )) {
        if (this.nuclides[daughter].stable) {
          continue;
        }
        if (nuclide_list.find((p) => p.nuclide === daughter) === undefined) {
          continue;
        }
        const i = nuclide_list.findIndex((n) => n.nuclide === daughter);
        rows.push(i);
        cols.push(j);
        data.push(lambd * bf);
      }
    }
    const lambda_mat = new Matrix();
    for (let x = 0; x < data.length; x += 1) {
      lambda_mat.set(rows[x], cols[x], data[x]);
    }
    // Calculate the C and C_inv matrices
    const rows_dict: Record<number, number[]> = {};
    for (let i = nuclide_list.length - 1; i > -1; i -= 1) {
      const a: number[] = [];
      for (let row = 0; row < lambda_mat.length; row += 1) {
        const v = lambda_mat.get(row, i);
        if (v !== 0) {
          a.push(row);
        }
      }
      let b = a; // !
      for (const j of a) {
        if (j > i) {
          rows_dict[j].forEach((r) => {
            if (b.indexOf(r) < 0) {
              b.push(r);
            }
          });
        }
      }
      rows_dict[i] = b;
    }
    let rows_c: number[] = [];
    let cols_c: number[] = [];
    for (let i = 0; i < nuclide_list.length; i += 1) {
      rows_c = rows_c.concat(rows_dict[i]);
      const x: number[] = [];
      for (let y = 0; y < rows_dict[i].length; y += 1) {
        x.push(i);
      }
      cols_c = cols_c.concat(x);
    }
    const c = new Matrix();
    const c_inv = new Matrix();
    for (let index = 0; index < rows_c.length; index += 1) {
      const i = rows_c[index];
      const j = cols_c[index];
      if (i === j) {
        continue;
      }
      let sigma = 0.0;
      for (const k of rows_dict[j]) {
        if (k === i) {
          break;
        }
        sigma += lambda_mat.get(i, k) * c.get(k, j);
      }
      c.set(i, j, sigma / (lambda_mat.get(j, j) - lambda_mat.get(i, i)));
    }
    for (let index = 0; index < rows_c.length; index += 1) {
      const i = rows_c[index];
      const j = cols_c[index];
      if (i === j) {
        continue;
      }
      let sigma = 0.0;
      for (const k of rows_dict[j]) {
        if (k === i) {
          break;
        }
        sigma -= c.get(i, k) * c_inv.get(k, j);
      }
      c_inv.set(i, j, sigma);
    }
    console.log(c.matrix);
    return [];
  }

  /**
   * Gets a nuclide from the inventory by name.
   * @param nuclide - The nuclide to get.
   * @returns The inventory, if any.
   */
  private getInventory(nuclide: string) {
    const i = this.inventory.find((x) => x.nuclide === nuclide);
    if (i) {
      return i;
    }
    return new Inventory(nuclide);
  }
}
