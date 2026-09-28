export class Stat {
  public readonly value: number;
  public readonly max: number;

  public constructor(value: number, max: number) {
    this.max = max;
    this.value = Math.min(Math.max(Math.floor(value), 0), max);
  }

  public increase(amount: number): Stat {
    return new Stat(this.value + amount, this.max);
  }

  public decrease(amount: number): Stat {
    return new Stat(this.value - amount, this.max);
  }

  public multiply(coefficient: number): Stat {
    return new Stat(this.value * coefficient, this.max);
  }
}
