import * as math from 'mathjs';
import { Inventory } from './Inventory';
import { Nuclide } from './Nuclide';
import { OutputWriter } from './OutputWriter';
import { Graph } from './Graph';
import { GraphNode } from './GraphNode';

// TODO: ouput number density, activity, activity * energies

/**
 * Performs the decay calculations.
 */
export class Decay {
  private nuclideList: Nuclide[] = [];

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
  ) {
    this.nuclideList = this.sortNuclides();
  }

  /**
   * Decays x seconds.
   * @param time - The time to decay.
   */
  public decay(time: number) {
    this.writer?.writeInfo(`Decaying ${time} seconds`, 0);
    this.writer?.writeInfo(`Constructing Lambda matrix`, 2);
    const lambda: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      if (!lambda[i]) {
        lambda[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        if (i < j) {
          lambda[i][j] = 0;
        } else if (i === j) {
          lambda[i][j] = -this.nuclideList[j].lambda;
        } else {
          if (this.nuclideList[j].decaysTo(this.nuclideList[i].name)) {
            lambda[i][j] = this.nuclideList[j].daughters[this.nuclideList[i].name] * this.nuclideList[j].lambda;
          } else {
            lambda[i][j] = 0;
          }
        }
      }
    }
    this.writer?.writeMatrix('lambda', lambda);
    this.writer?.writeInfo('\nConstructing C matrix', 2);
    const C: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      if (!C[i]) {
        C[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        if (i < j) {
          C[i][j] = 0;
        } else if (i === j) {
          C[i][j] = 1;
        } else {
          let sum = 0;
          for (let k = j; k <= i - 1; k += 1) {
            sum += lambda[i][k] * C[k][j];
          }
          C[i][j] = sum / (lambda[j][j] - lambda[i][i]);
          if (isNaN(C[i][j])) {
            C[i][j] = 0;
          }
        }
      }
    }
    this.writer?.writeMatrix('C', C);
    this.writer?.writeInfo('\nConstructing inverse C matrix', 2);
    const invC: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      if (!invC[i]) {
        invC[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        if (i < j) {
          invC[i][j] = 0;
        } else if (i === j) {
          invC[i][j] = 1;
        } else {
          let sum = 0;
          for (let k = j; k <= i - 1; k += 1) {
            sum -= C[i][k] * invC[k][j];
          }
          invC[i][j] = sum;
        }
      }
    }
    this.writer?.writeMatrix('invC', invC);
    this.writer?.writeInfo('\nCalculating matrix exponential', 2);
    const exp: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      if (!exp[i]) {
        exp[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        if (i < j) {
          exp[i][j] = 0;
        } else if (i === j) {
          exp[i][j] = Math.exp(-this.nuclideList[i].lambda * time);
        } else {
          exp[i][j] = 0;
        }
      }
    }
    this.writer?.writeMatrix('exp', exp);
    this.writer?.writeInfo('\nCalculating number matrix', 2);
    const N: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      N[i] = [this.getInventory(this.nuclideList[i].name).number];
    }
    this.writer?.writeMatrix('N', N);
    const decay = math
      .multiply(
        math.matrix(C),
        math.multiply(
          math.matrix(exp),
          math.multiply(math.matrix(invC), math.matrix(N)),
        ),
      )
      .toArray();
    // Create decayed inventory
    const decInv: Inventory[] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      const inv = new Inventory(this.nuclideList[i].name);
      inv.number = (decay[i].valueOf() as number[])[0];
      if (inv.number !== 0) {
        decInv.push(inv);
      }
    }
    return decInv;
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

  /**
   * Sorts the nuclides to ensure daughters always appear after their parents.
   */
  public sortNuclides() {
    const tree: Record<string, GraphNode> = {};
    Object.values(this.nuclides).forEach((v) => {
      if (!tree[v.name]) {
        tree[v.name] = new GraphNode(v.name);
      }
      Object.keys(v.daughters).forEach((d) => {
        if (!tree[d]) {
          tree[d] = new GraphNode(d);
        }
        tree[v.name].links.push(d);
      });
    });
    const graph = new Graph();
    graph.nodes = Object.values(tree);
    const sorted = graph.sort();
    return sorted.map((n) => this.nuclides[n]);
  }
}
