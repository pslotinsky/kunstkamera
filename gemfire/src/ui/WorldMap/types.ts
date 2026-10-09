import type { WorldMap } from '@/core/domain/WorldMap';
import type { SoundBoard } from '@/ui/sound/SoundBoard';

export interface WorldMapContext {
  readonly map: WorldMap;
  readonly sounds: SoundBoard;
}
