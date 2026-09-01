import { ARTIFACTS } from '@/config/artifacts';
import { sample } from '@/lib/array/sample';

import type { CharacteristicsKey } from './Characteristics';

export interface ArtifactParams {
  readonly name: string;
  readonly characteristic: CharacteristicsKey;
  readonly bonus: number;
}

const CHARACTERISTIC_LABELS: Record<CharacteristicsKey, string> = {
  intelligence: 'Intelligence',
  war: 'War',
  charisma: 'Charisma',
};

export class Artifact {
  public static createRandom(): Artifact {
    return new Artifact(sample(ARTIFACTS));
  }

  public readonly name: string;
  public readonly characteristic: CharacteristicsKey;
  public readonly bonus: number;

  public constructor(params: ArtifactParams) {
    this.name = params.name;
    this.characteristic = params.characteristic;
    this.bonus = params.bonus;
  }

  public get effect(): string {
    return `${CHARACTERISTIC_LABELS[this.characteristic]} +${this.bonus}`;
  }
}
