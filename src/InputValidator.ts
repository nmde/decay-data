import { Nuclide } from './Nuclide';
import { OutputWriter } from './OutputWriter';

/**
 * Searches for mistakes in the input.
 */
export class InputValidator {
  /**
   * Constructs InputValidator.
   * @param writer - The output writer.
   */
  public constructor(private writer: OutputWriter) {}

  /**
   * Checks for consistency between nuclide data.
   * @param a - Nuclide instance a
   * @param b - Nuclide instance b
   */
  public compareNuclideData(a: Nuclide, b: Nuclide) {
    if (a.half_life !== b.half_life) {
      this.writer.writeError(
        `Inconsistent half-lives found for ${a.name} (${a.half_life} !== ${b.half_life})`,
      );
    }
    const aGammas = Object.keys(a.gammas);
    const bGammas = Object.keys(b.gammas);
    if (aGammas.length !== bGammas.length) {
      this.writer.writeError(
        `Inconsistent number of gammas listed for ${a.name} (${aGammas.length} !== ${bGammas.length})`,
      );
    }
    aGammas.forEach((key) => {
      if (a.gammas[key] !== b.gammas[key]) {
        this.writer.writeError(
          `Inconsistent gamma frequency for ${a.name} ${key} (${a.gammas[key]} !== ${b.gammas[key]})`,
        );
      }
      bGammas.splice(bGammas.indexOf(key), 1);
    });
    if (bGammas.length > 0) {
      this.writer.writeError(
        `Inconsistent gammas listed for ${a.name} (mismatched: ${bGammas.join(
          ',',
        )})`,
      );
    }
  }

  /**
   * Checks if any data is undefined, NaN, or null.
   * @param data - The data to check.
   * @returns If the data is invalid.
   */
  private isInvalid(data: any) {
    return data === undefined || data === null || isNaN(data);
  }

  /**
   * Validates nuclide daughters.
   * @param nuclide - The parent nuclide name.
   * @param daughters - The daughters to validate.
   */
  public validateDaughters(nuclide: string, daughters: Record<string, number>) {
    let fracSum = 0;
    Object.entries(daughters).forEach(([daughter, fraction]) => {
      if (this.isInvalid(fraction)) {
        this.writer.writeError(
          `Invalid branching fraction for ${nuclide} -> ${daughter}: ${fraction}`,
        );
      }
      fracSum += fraction;
    });
    if (fracSum > 1) {
      this.writer.writeError(`Daughter fractions for ${nuclide} sum above 1: ${fracSum}`);
    }
  }

  /**
   * Checks for reasonable values in the gamma energies.
   * @param gammas - The gamma energies.
   */
  public validateGammas(nuclide: Nuclide) {
    Object.entries(nuclide.gammas).forEach(([energy, frequency]) => {
      if (this.isInvalid(energy)) {
        this.writer.writeError(
          `Invalid gamma energy listed for ${nuclide.name}: ${energy}`,
        );
      }
      if (frequency === 0) {
        this.writer.writeError(
          `Zero-frequency gamma listed for ${nuclide.name} ${energy}`,
        );
      }
      if (this.isInvalid(frequency)) {
        this.writer.writeError(
          `Invalid gamma frequency listed for ${nuclide.name} ${energy}: ${frequency}`,
        );
      }
    });
  }
}
