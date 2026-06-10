import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';

export interface ProvinceInfoContext {
  readonly map: WorldMap;
  readonly player: Family;
  selection?: Province | undefined;
}
