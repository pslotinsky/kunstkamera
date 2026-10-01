import { sample } from '@/lib/array/sample';

import type { Province } from './Province';
import { Resources } from './Resources';

const SABOTAGE_MARGIN = 10;
const PLUNDER_MARGIN = 5;
const SHARE = 1 / 5;
const PLUNDER_FAME_LOSS = 1;

const DAMAGES = ['troops', 'loyalty', 'protection'] as const;

export type SabotageDamage = (typeof DAMAGES)[number];

export interface InfiltrationParams {
  readonly source: Province;
  readonly target: Province;
}

export class Infiltration {
  private readonly source: Province;
  private readonly target: Province;

  public constructor(params: InfiltrationParams) {
    this.source = params.source;
    this.target = params.target;
  }

  public sabotage(): SabotageDamage | undefined {
    if (!this.canSlipPast(SABOTAGE_MARGIN)) {
      return undefined;
    }

    const damage = sample(DAMAGES);

    if (damage === 'troops') {
      this.target.addResources({ troops: -this.getFifthOf(damage) });
    } else {
      this.target.addDevelopment({ [damage]: -this.getFifthOf(damage) });
    }

    return damage;
  }

  public plunder(): Resources | undefined {
    if (!this.canSlipPast(PLUNDER_MARGIN)) {
      return undefined;
    }

    const { gold, food } = this.target.resources;
    const loot = {
      gold: Math.floor(gold * SHARE),
      food: Math.floor(food * SHARE),
    };

    this.target.addResources({ gold: -loot.gold, food: -loot.food });
    this.source.addResources(loot);
    this.target.family?.loseFame(PLUNDER_FAME_LOSS);

    return Resources.from(loot);
  }

  private canSlipPast(margin: number): boolean {
    return (
      this.source.effectiveStats.intelligence >=
      this.target.effectiveStats.intelligence - margin
    );
  }

  private getFifthOf(damage: SabotageDamage): number {
    const value =
      damage === 'troops'
        ? this.target.resources.troops
        : this.target.development.get(damage);

    return Math.floor(value * SHARE);
  }
}
