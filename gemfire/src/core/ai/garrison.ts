import type { Province } from '@/core/domain/Province';

const GARRISON_SHARE = 1 / 3;

export function countSendable(province: Province): number {
  const { troops } = province.resources;

  return troops - Math.ceil(troops * GARRISON_SHARE);
}
