import { Stats, type StatsParams } from './Stats';

const CHARACTERISTICS_MAXES = {
  intelligence: 100,
  war: 100,
  charisma: 100,
};

export type CharacteristicsKey = keyof typeof CHARACTERISTICS_MAXES;

export type CharacteristicsValues = StatsParams<CharacteristicsKey>;

export class Characteristics extends Stats<CharacteristicsKey> {
  public static empty(): Characteristics {
    return new Characteristics({});
  }

  public static from(definition: CharacteristicsValues): Characteristics {
    const { charisma = 0, intelligence = 0, war = 0 } = definition;

    return new Characteristics({ charisma, intelligence, war });
  }

  declare readonly intelligence: number;
  declare readonly war: number;
  declare readonly charisma: number;

  public get total(): number {
    return this.intelligence + this.war + this.charisma;
  }

  protected constructor(values: CharacteristicsValues) {
    super(values, CHARACTERISTICS_MAXES);
  }
}
