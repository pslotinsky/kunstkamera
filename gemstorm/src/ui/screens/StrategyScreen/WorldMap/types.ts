import type { WorldMap } from '@/core/domain/WorldMap';
import type { SoundBoard } from '@/ui/common/sound/SoundBoard';

export interface WorldMapContext {
  readonly map: WorldMap;
  readonly sounds: SoundBoard;
}
