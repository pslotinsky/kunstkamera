import { isDefined } from '@/lib/value/isDefined';

import { Army } from './Army';
import type { FifthUnit } from './FifthUnit';
import type { General } from './General';
import type { Province } from './Province';

export interface AttackForce {
  readonly troops: number;
  readonly food: number;
  readonly unit?: FifthUnit | undefined;
}

export class AttackDeployment {
  public static readonly COMPUTER_SUPPLY_DAYS = 5;
  public static readonly MIN_TROOPS = 1;

  public static foodForDays(
    troops: number,
    days: number,
    unit?: FifthUnit,
  ): number {
    return Army.measureDailyFood(troops, unit) * days;
  }

  public constructor(
    public readonly source: Province,
    public readonly commander: General,
    public readonly force: AttackForce,
  ) {}

  public get gold(): number {
    return Army.measureDeploymentCost(this.force.troops);
  }

  public get food(): number {
    return this.force.food;
  }

  public get dailyFood(): number {
    const { troops, unit } = this.force;

    return Army.measureDailyFood(troops, unit);
  }

  public get supplyDays(): number {
    return Math.floor(this.food / this.dailyFood);
  }

  public get strength(): number {
    const { troops, unit } = this.force;

    return troops + (unit?.strength ?? 0);
  }

  public get isAffordable(): boolean {
    const { troops, food } = this.force;
    const resources = this.source.resources;

    return (
      Number.isInteger(troops) &&
      troops >= AttackDeployment.MIN_TROOPS &&
      Number.isInteger(food) &&
      food >= this.dailyFood &&
      resources.troops >= troops &&
      resources.gold >= this.gold &&
      resources.food >= food
    );
  }

  public muster(): Army {
    const { troops, unit } = this.force;
    const food = this.food;
    const remotelyCommanded = !isDefined(this.source.residentGovernor);

    return new Army({
      commander: this.commander,
      troops,
      food,
      unit,
      remotelyCommanded,
    });
  }
}
