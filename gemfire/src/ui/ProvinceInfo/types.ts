import type { Province } from '@/core/domain/Province';

export interface ProvinceSelection {
  readonly province: Province;
  readonly neighbors: readonly Province[];
  readonly crestUrl?: string | undefined;
}

export interface ProvinceInfoContext {
  selection?: ProvinceSelection | undefined;
}
