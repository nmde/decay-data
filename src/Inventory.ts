import { Nuclide } from './Nuclide';

/**
 * Represents the inventory of a nuclide.
 */
export class Inventory {
  private number = 0;

  /**
   * Constructs Inventory.
   * @param nuclide - The corresponding nuclide.
   * @param activity - The activity, in Bq.
   */
  public constructor(
    private nuclide: Nuclide,
    activity: number,
  ) {
    this.setNumberFromBq(activity);
  }

  /**
   * Sets the number density from Bq.
   * @param activity - The activity to set.
   */
  private setNumberFromBq(activity: number) {
    // A = lambda N
    // N = A / lambda
    this.number = activity / this.nuclide.lambda;
  }
}
