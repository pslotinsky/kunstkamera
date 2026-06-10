import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';

export interface ProvinceCommandsContext {
  readonly player: Family;
  selection?: Province | undefined;
}
