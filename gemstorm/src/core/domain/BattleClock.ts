export const BATTLE_DAY_LIMIT = 5;

export type Phase = 'sunrise' | 'noon' | 'sunset' | 'midnight';

const PHASES: readonly Phase[] = ['sunrise', 'noon', 'sunset', 'midnight'];

export class BattleClock {
  public constructor(
    public readonly day = 1,
    public readonly phase: Phase = 'sunrise',
  ) {}

  public get isDayEnd(): boolean {
    return this.phase === PHASES.at(-1);
  }

  public get isSpent(): boolean {
    return this.day > BATTLE_DAY_LIMIT;
  }

  public get daysFought(): number {
    return Math.min(this.day, BATTLE_DAY_LIMIT);
  }

  public next(): BattleClock {
    const index = PHASES.indexOf(this.phase);
    const nextPhase = PHASES[(index + 1) % PHASES.length]!;

    return this.isDayEnd
      ? new BattleClock(this.day + 1, nextPhase)
      : new BattleClock(this.day, nextPhase);
  }

  public toString(): string {
    return `day ${this.day}, ${this.phase}`;
  }
}
