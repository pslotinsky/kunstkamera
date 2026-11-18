import type { ChildrenViews } from '@/lib/Control';
import type { MapPreviewControl } from '@/ui/MapPreview/MapPreviewControl';
import type { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';

import type { RulerPreviewControl } from './RulerPreview/RulerPreviewControl';

export type FamilySelectControls = {
  readonly houses: TileGridControl;
  readonly ruler: RulerPreviewControl;
  readonly mapPreview: MapPreviewControl;
};

export type FamilySelectViews = ChildrenViews<FamilySelectControls>;
