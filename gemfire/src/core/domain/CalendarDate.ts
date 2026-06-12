export class CalendarDate {
  public constructor(
    public readonly year: number,
    public readonly month: number,
  ) {}

  public next(): CalendarDate {
    return this.month === 12
      ? new CalendarDate(this.year + 1, 1)
      : new CalendarDate(this.year, this.month + 1);
  }

  public isMonth(month: number): boolean {
    return this.month === month;
  }

  public equals(other: CalendarDate): boolean {
    return this.year === other.year && this.month === other.month;
  }

  public toString(): string {
    return `Month ${this.month}, ${this.year}`;
  }
}
