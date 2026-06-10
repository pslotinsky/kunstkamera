import type { Province } from '@/core/domain/Province';
import type { WorldMap } from '@/core/domain/WorldMap';

export interface ProvinceInfoContext {
  readonly map: WorldMap;
  selection?: Province | undefined;
}
