import {
  DAILY_FOOD_BASE,
  DAILY_FOOD_PER_STRENGTH,
  DEPLOYMENT_BASE_GOLD,
  DEPLOYMENT_TROOPS_PER_GOLD,
} from '@/config/battle';

import type { FifthUnit } from './FifthUnit';
import type { General } from './General';

export interface ArmyParams {
  readonly commander: General;
  readonly troops: number;
  readonly food: number;
  readonly unit?: FifthUnit | undefined;
}

export class Army {
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

  public get strength(): number {
    return this.troops + (this.unit?.strength ?? 0);
  }

  public get dailyFood(): number {
    const fed =
      this.troops + (this.unit?.consumesFood ? this.unit.strength : 0);

    return Math.floor(fed / DAILY_FOOD_PER_STRENGTH) + DAILY_FOOD_BASE;
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
