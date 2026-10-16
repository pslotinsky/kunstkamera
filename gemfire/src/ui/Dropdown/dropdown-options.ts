import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { Province } from '@/core/domain/Province';
import { getFifthUnitPortraitUrl } from '@/ui/art/getFifthUnitPortraitUrl';

import type { DropdownOption } from './DropdownView';

const NO_UNIT: DropdownOption = { value: '', label: 'None' };

export function toUnitOptions(units: readonly FifthUnit[]): DropdownOption[] {
  return [
    NO_UNIT,
    ...units.map((unit) => ({
      value: unit.name,
      label: unit.name,
      icon: getFifthUnitPortraitUrl(unit),
      note: String(unit.strength),
    })),
  ];
}

export function findOptionProvince(
  provinces: readonly Province[],
  value: string,
): Province | undefined {
  return provinces.find((province) => province.isEqual(Number(value)));
}

export function toProvinceOptions(
  provinces: readonly Province[],
): DropdownOption[] {
  return provinces.map((province) => ({
    value: String(province.number),
    label: String(province),
    note: `${province.resources.troops} troops`,
  }));
}
