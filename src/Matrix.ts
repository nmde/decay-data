export class Matrix {
  public matrix: number[][] = [];

  public get(row: number, col: number) {
    if (!this.matrix[row] || !this.matrix[row][col]) {
      return 0;
    }
    const v = this.matrix[row][col];
    if (isNaN(v)) {
      return 0;
    }
    return v;
  }

  public set(row: number, col: number, value: number) {
    if (!this.matrix[row]) {
        this.matrix[row] = [];
    }
    this.matrix[row][col] = value;
  }

  public get length() {
    return this.matrix.length;
  }
}
