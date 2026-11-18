import type { ChildrenViews } from '@/lib/Control';
import type { MapPreviewControl } from '@/ui/MapPreview/MapPreviewControl';
import type { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';

import type { AdvisorPreviewControl } from './AdvisorPreview/AdvisorPreviewControl';

export type AdvisorSelectControls = {
  readonly advisors: TileGridControl;
  readonly preview: AdvisorPreviewControl;
  readonly mapPreview: MapPreviewControl;
};

export type AdvisorSelectViews = ChildrenViews<AdvisorSelectControls>;
