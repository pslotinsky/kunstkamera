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

  public plus(months: number): CalendarDate {
    const counted = this.year * 12 + (this.month - 1) + months;

    return new CalendarDate(Math.floor(counted / 12), (counted % 12) + 1);
  }

  public isBefore(other: CalendarDate): boolean {
    return this.year !== other.year
      ? this.year < other.year
      : this.month < other.month;
  }

  public countMonthsUntil(other: CalendarDate): number {
    const months = (other.year - this.year) * 12 + (other.month - this.month);

    return Math.max(months, 0);
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
