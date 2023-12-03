/**
 * Represents information about a specific nuclide.
 */
export class Nuclide {
  private _lambda = 0;

  /**
   * Constructs Nuclide.
   * @param name - The name of the nuclide.
   * @param half_life - The half-life of the nuclide.
   * @param gammas - Gamma energies and frequencies.
   * @param stable - If the nuclide is stable.
   * @param daughters - Daughter nuclides.
   */
  public constructor(
    public name: string,
    public half_life: number,
    public gammas: Record<string, number>,
    public stable: boolean,
    public daughters: Record<string, number>,
  ) {}

  /**
   * Returns if this nuclide decays to the given nuclide.
   * @param daughter - The daughter nuclide.
   * @returns If this nuclide decays to the daughter nuclide.
   */
  public decaysTo(daughter: string) {
    return !!this.daughters[daughter];
  }

  /**
   * The decay constant in /s
   */
  public get lambda() {
    if (this.stable) {
      return 0;
    }
    this._lambda = Math.LN2 / this.half_life;
    return Math.LN2 / this.half_life;
  }
}
