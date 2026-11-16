import type { Approach, BattleUnit } from './BattleUnit';

export interface ClashParams {
  readonly striker: BattleUnit;
  readonly target: BattleUnit;
  readonly approach: Approach;
  readonly losses: number;
  readonly backlash: number;
}

export class Clash {
  public readonly striker: BattleUnit;
  public readonly target: BattleUnit;
  public readonly approach: Approach;
  public readonly losses: number;
  public readonly backlash: number;
  public readonly strikerLeft: number;
  public readonly targetLeft: number;

  public constructor(params: ClashParams) {
    this.striker = params.striker;
    this.target = params.target;
    this.approach = params.approach;
    this.losses = params.losses;
    this.backlash = params.backlash;
    this.strikerLeft = params.striker.strength;
    this.targetLeft = params.target.strength;
  }

  public get isFatal(): boolean {
    return this.targetLeft === 0;
  }

  public get isReturned(): boolean {
    return this.backlash > 0;
  }
}
