import { SCENARIO_1 } from './scenario-1';

export interface GeneralDefinition {
  readonly name: string;
  readonly birth: number;
  readonly intelligence: number;
  readonly war: number;
  readonly charisma: number;
}

export interface FamilyDefinition {
  readonly name: string;
  readonly ruler: string;
  readonly members: readonly string[];
  readonly fame: number;
}

export interface ProvinceDefinition {
  readonly number: number;
  readonly family?: string;
  readonly governor?: string;
  readonly gold: number;
  readonly food: number;
  readonly troops: number;
  readonly loyalty: number;
  readonly cultivation: number;
  readonly protection: number;
  readonly hirePool: readonly string[];
}

export interface Scenario {
  readonly number: number;
  readonly name: string;
  readonly year: number;
  readonly generals: readonly GeneralDefinition[];
  readonly families: readonly FamilyDefinition[];
  readonly provinces: readonly ProvinceDefinition[];
}

export const SCENARIOS: readonly Scenario[] = [SCENARIO_1];
