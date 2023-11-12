import * as math from 'mathjs';
import { Inventory } from './Inventory';
import { Nuclide } from './Nuclide';
import { OutputWriter } from './OutputWriter';

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
    this.nuclideList = Object.values(nuclides);
  }

  /**
   * Decays x seconds.
   * @param time - The time to decay.
   */
  public decay(time: number) {
    this.writer?.writeInfo(`Decaying ${time} seconds`, 0);
    this.writer?.writeInfo(`Constructing delta matrix`, 2);
    const delta: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      let infoLine = '';
      if (!delta[i]) {
        delta[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        const a = this.nuclideList[i];
        const b = this.nuclideList[j];
        if (i < j) {
          delta[i][j] = 0;
          infoLine += ',';
        } else if (i === j) {
          delta[i][j] = -b.lambda;
          infoLine += `-${b.lambda},`;
        } else {
          if (b.decaysTo(a.name)) {
            delta[i][j] = b.daughters[a.name] * b.lambda;
            infoLine += `${b.daughters[a.name]} * ${b.lambda} = ${
              delta[i][j]
            },`;
          } else {
            delta[i][j] = 0;
            infoLine += ',';
          }
        }
      }
      this.writer?.writeInfo(infoLine, 2);
    }
    this.writer?.writeInfo('\nConstructing C matrix', 2);
    const C: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      let infoLine = '';
      if (!C[i]) {
        C[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        const a = this.nuclideList[i];
        const b = this.nuclideList[j];
        if (i < j) {
          C[i][j] = 0;
          infoLine += ',';
        } else if (i === j) {
          C[i][j] = 1;
          infoLine += `1,`;
        } else {
          if (b.decaysTo(a.name)) {
            let sum = 0;
            for (let k = j; k <= i - 1; k += 1) {
              sum += delta[i][k] * C[k][j];
            }
            C[i][j] = sum / (delta[j][j] - delta[i][i]);
            infoLine += `${sum} / (${delta[j][j]} - ${delta[i][i]}) = ${C[i][j]},`;
          } else {
            C[i][j] = 0;
            infoLine += ',';
          }
        }
      }
      this.writer?.writeInfo(infoLine, 2);
    }
    this.writer?.writeInfo('\nConstructing inverse C matrix', 2);
    const invC: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      let infoLine = '';
      if (!invC[i]) {
        invC[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        const a = this.nuclideList[i];
        const b = this.nuclideList[j];
        if (i < j) {
          invC[i][j] = 0;
          infoLine += ',';
        } else if (i === j) {
          invC[i][j] = 1;
          infoLine += `1,`;
        } else {
          let sum = 0;
          for (let k = j; k <= i - 1; k += 1) {
            sum += C[i][k] * invC[k][j];
          }
          invC[i][j] = -sum;
          infoLine += `-${sum} = ${invC[i][j]},`;
        }
      }
      this.writer?.writeInfo(infoLine, 2);
    }
    this.writer?.writeInfo('\nCalculating matrix exponential', 2);
    const exp: number[][] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      let infoLine = '';
      if (!exp[i]) {
        exp[i] = [];
      }
      for (let j = 0; j < this.nuclideList.length; j += 1) {
        const a = this.nuclideList[i];
        const b = this.nuclideList[j];
        if (i < j) {
          exp[i][j] = 0;
          infoLine += ',';
        } else if (i === j) {
          exp[i][j] = Math.exp(-b.lambda * time);
          infoLine += `exp(-${b.lambda} * ${time}) = ${exp[i][j]},`;
        } else {
          exp[i][j] = 0;
          infoLine += ',';
        }
      }
      this.writer?.writeInfo(infoLine, 2);
    }
    this.writer?.writeInfo('\nCalculating number matrix', 2);
    const N: number[] = [];
    let infoLine = '';
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      N[i] = this.getInventory(this.nuclideList[i].name).number;
      infoLine += `${N[i]},`;
    }
    this.writer?.writeInfo(infoLine, 2);
    const decay = math.multiply(
      math.matrix(C),
      math.multiply(
        math.matrix(exp),
        math.multiply(math.matrix(invC), math.matrix(N)),
      ),
    ).toArray();
    // Create decayed inventory
    const decInv: Inventory[] = [];
    for (let i = 0; i < this.nuclideList.length; i += 1) {
      const inv = new Inventory(this.nuclideList[i].name);
      inv.number = decay[i].valueOf() as number;
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
}
