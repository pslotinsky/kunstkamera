export interface FamilyDefinition {
  readonly name: string;
  readonly color: string;
}

export interface ScenarioDefinition {
  readonly id: string;
  readonly name: string;
  readonly ownership: Readonly<Record<string, readonly number[]>>;
}

export const FAMILIES: readonly FamilyDefinition[] = [
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

const erinAndAnder: ScenarioDefinition = {
  id: 'erin-and-ander',
  name: 'Erin & Ander',
  ownership: {
    Lyle: [2, 6, 7],
    Blanche: [3, 4, 5],
    Chrysalis: [8],
    Lankshire: [11, 12, 15, 16, 17, 18, 19, 20, 21, 22, 23, 28, 29, 30],
    Molbrew: [13, 14],
    Flax: [24, 27],
    Coryll: [25, 26],
  },
};

export const SCENARIOS: readonly ScenarioDefinition[] = [erinAndAnder];
