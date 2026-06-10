import { SCENARIO_1 } from './scenario-1';

export interface GeneralDefinition {
  readonly name: string;
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
  readonly owner?: string;
  readonly governor?: string;
  readonly gold: number;
  readonly food: number;
  readonly troops: number;
  readonly loyalty: number;
  readonly cultivation: number;
  readonly protection: number;
}

export interface Scenario {
  readonly number: number;
  readonly name: string;
  readonly generals: readonly GeneralDefinition[];
  readonly families: readonly FamilyDefinition[];
  readonly provinces: readonly ProvinceDefinition[];
}

export interface FamilyColor {
  readonly name: string;
  readonly color: string;
}

export const FAMILIES: readonly FamilyColor[] = [
  { name: 'Lankshire', color: 'rgba(162, 89, 224, 0.4)' },
  { name: 'Blanche', color: 'rgba(116, 185, 255, 0.4)' },
  { name: 'Lyle', color: 'rgba(214, 48, 49, 0.4)' },
  { name: 'Coryll', color: 'rgba(253, 203, 110, 0.4)' },
  { name: 'Chrysalis', color: 'rgba(0, 184, 148, 0.4)' },
  { name: 'Flax', color: 'rgba(85, 239, 196, 0.4)' },
  { name: 'Molbrew', color: 'rgba(230, 126, 34, 0.4)' },
  { name: 'Tate', color: 'rgba(225, 112, 85, 0.4)' },
  { name: 'Tordin', color: 'rgba(99, 110, 114, 0.4)' },
  { name: 'Tudoria', color: 'rgba(232, 67, 147, 0.4)' },
  { name: 'Divas', color: 'rgba(0, 206, 201, 0.4)' },
];

export const SCENARIOS: readonly Scenario[] = [SCENARIO_1];
