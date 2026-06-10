export class CalendarDate {
  public constructor(
    public readonly year: number,
    public readonly month: number,
  ) {}

  public equals(other: CalendarDate): boolean {
    return this.year === other.year && this.month === other.month;
  }

  public toString(): string {
    return `Month ${this.month}, ${this.year}`;
  }
}
