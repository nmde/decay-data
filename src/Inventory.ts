import { Nuclide } from './Nuclide';

/**
 * Represents the inventory of a nuclide.
 */
export class Inventory {
  /**
   * Constructs Inventory.
   * @param nuclide - The corresponding nuclide.
   */
  public constructor(public nuclide: string, public number = 0) {}

  /**
   * Sets the number density from Bq.
   * @param activity - The activity to set.
   * @param lambda - The nuclide decay constant.
   */
  public setNumberFromBq(activity: number, lambda: number) {
    // A = lambda N
    // N = A / lambda
    this.number = activity / lambda;
  }
}
