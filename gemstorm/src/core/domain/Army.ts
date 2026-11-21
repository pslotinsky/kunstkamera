import type { FifthUnit } from './FifthUnit';
import type { General } from './General';

const DEPLOYMENT_TROOPS_PER_GOLD = 8;
const DEPLOYMENT_BASE_GOLD = 10;

const DAILY_FOOD_PER_STRENGTH = 10;
const DAILY_FOOD_BASE = 1;
const REMOTE_WAR_DIVISOR = 2;

export interface ArmyParams {
  readonly commander: General;
  readonly troops: number;
  readonly food: number;
  readonly unit?: FifthUnit | undefined;
  readonly remotelyCommanded?: boolean;
}

export class Army {
  public static measureDailyFood(troops: number, unit?: FifthUnit): number {
    const troopFood = Math.floor(troops / DAILY_FOOD_PER_STRENGTH);
    const unitFood = unit?.consumesFood
      ? Math.floor(unit.strength / DAILY_FOOD_PER_STRENGTH)
      : 0;

    return troopFood + unitFood + DAILY_FOOD_BASE;
  }

  public static measureDeploymentCost(troops: number): number {
    return (
      Math.floor(troops / DEPLOYMENT_TROOPS_PER_GOLD) + DEPLOYMENT_BASE_GOLD
    );
  }

  public readonly commander: General;
  public readonly unit: FifthUnit | undefined;
  public readonly committedTroops: number;
  public readonly remotelyCommanded: boolean;
  public troops: number;
  public food: number;

  public constructor(params: ArmyParams) {
    this.commander = params.commander;
    this.committedTroops = params.troops;
    this.troops = params.troops;
    this.food = params.food;
    this.unit = params.unit;
    this.remotelyCommanded = params.remotelyCommanded ?? false;
  }

  public clone(): Army {
    const copy = new Army({
      commander: this.commander,
      troops: this.committedTroops,
      food: this.food,
      unit: this.unit,
      remotelyCommanded: this.remotelyCommanded,
    });

    copy.troops = this.troops;

    return copy;
  }

  public get strength(): number {
    return this.troops + (this.unit?.strength ?? 0);
  }

  public get dailyFood(): number {
    return Army.measureDailyFood(this.troops, this.unit);
  }

  public get supplyDays(): number {
    return Math.floor(this.food / this.dailyFood);
  }

  public get deploymentCost(): number {
    return Army.measureDeploymentCost(this.troops);
  }

  public get commanderWar(): number {
    const { war } = this.commander.stats;

    return this.remotelyCommanded ? Math.floor(war / REMOTE_WAR_DIVISOR) : war;
  }

  public canFight(): boolean {
    return this.hasTroops || (this.unit?.standsAlone ?? false);
  }

  public get hasTroops(): boolean {
    return this.troops > 0;
  }

  public get isStarving(): boolean {
    return this.food < this.dailyFood;
  }

  public eat(): void {
    this.food = Math.max(this.food - this.dailyFood, 0);
  }

  public takeCasualties(losses: number): void {
    this.troops = Math.max(this.troops - losses, 0);
  }
}
