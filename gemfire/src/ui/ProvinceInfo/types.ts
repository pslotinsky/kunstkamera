import type { Province } from '@/core/domain/Province';

export interface ProvinceSelection {
  readonly province: Province;
  readonly neighbors: readonly Province[];
}

export interface ProvinceInfoContext {
  selection?: ProvinceSelection | undefined;
}
