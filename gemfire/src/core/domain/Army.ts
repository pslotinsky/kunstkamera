import type { FifthUnit } from './FifthUnit';
import type { General } from './General';

const DEPLOYMENT_TROOPS_PER_GOLD = 8;
const DEPLOYMENT_BASE_GOLD = 10;

const DAILY_FOOD_PER_STRENGTH = 10;
const DAILY_FOOD_BASE = 1;

export interface ArmyParams {
  readonly commander: General;
  readonly troops: number;
  readonly food: number;
  readonly unit?: FifthUnit | undefined;
}

export class Army {
  public static measureDailyFood(troops: number, unit?: FifthUnit): number {
    const fed = troops + (unit?.consumesFood ? unit.strength : 0);

    return Math.floor(fed / DAILY_FOOD_PER_STRENGTH) + DAILY_FOOD_BASE;
  }

  public readonly commander: General;
  public readonly unit: FifthUnit | undefined;
  public readonly committedTroops: number;
  public troops: number;
  public food: number;

  public constructor(params: ArmyParams) {
    this.commander = params.commander;
    this.committedTroops = params.troops;
    this.troops = params.troops;
    this.food = params.food;
    this.unit = params.unit;
  }

  public clone(): Army {
    const copy = new Army({
      commander: this.commander,
      troops: this.committedTroops,
      food: this.food,
      unit: this.unit,
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
    return (
      Math.floor(this.troops / DEPLOYMENT_TROOPS_PER_GOLD) +
      DEPLOYMENT_BASE_GOLD
    );
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
