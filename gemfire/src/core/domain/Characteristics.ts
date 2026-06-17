import { Stats, type StatsParams } from './Stats';

const CHARACTERISTICS_MAXES = {
  intelligence: 100,
  war: 100,
  charisma: 100,
};

type CharacteristicsKey = keyof typeof CHARACTERISTICS_MAXES;

export type CharacteristicsValues = StatsParams<CharacteristicsKey>;

export class Characteristics extends Stats<CharacteristicsKey> {
  public static from(definition: {
    readonly intelligence: number;
    readonly war: number;
    readonly charisma: number;
  }): Characteristics {
    return new Characteristics(definition);
  }

  declare readonly intelligence: number;
  declare readonly war: number;
  declare readonly charisma: number;

  protected constructor(values: CharacteristicsValues) {
    super(values, CHARACTERISTICS_MAXES);
  }
}
