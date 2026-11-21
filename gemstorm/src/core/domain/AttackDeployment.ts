import { isDefined } from '@/lib/value/isDefined';

import { Army } from './Army';
import type { FifthUnit } from './FifthUnit';
import type { General } from './General';
import type { Province } from './Province';

export interface AttackForce {
  readonly troops: number;
  readonly days: number;
  readonly unit?: FifthUnit | undefined;
}

export class AttackDeployment {
  public static readonly MIN_SUPPLY_DAYS = 3;
  public static readonly COMPUTER_SUPPLY_DAYS = 5;
  public static readonly SUPPLY_DAYS: readonly number[] = [
    AttackDeployment.MIN_SUPPLY_DAYS,
    AttackDeployment.COMPUTER_SUPPLY_DAYS,
    8,
    10,
  ];
  public static readonly MIN_TROOPS = 1;

  public constructor(
    public readonly source: Province,
    public readonly commander: General,
    public readonly force: AttackForce,
  ) {}

  public get gold(): number {
    return Army.measureDeploymentCost(this.force.troops);
  }

  public get food(): number {
    const { troops, unit, days } = this.force;

    return Army.measureDailyFood(troops, unit) * days;
  }

  public get strength(): number {
    const { troops, unit } = this.force;

    return troops + (unit?.strength ?? 0);
  }

  public get isAffordable(): boolean {
    const { troops, days } = this.force;
    const resources = this.source.resources;

    return (
      Number.isInteger(troops) &&
      troops >= AttackDeployment.MIN_TROOPS &&
      AttackDeployment.SUPPLY_DAYS.includes(days) &&
      resources.troops >= troops &&
      resources.gold >= this.gold &&
      resources.food >= this.food
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
