import type { ChildrenViews } from '@/lib/Control';
import type { ScenarioMapControl } from '@/ui/screens/NewGameScreen/ScenarioMap/ScenarioMapControl';
import type { TileGridControl } from '@/ui/screens/NewGameScreen/TileGrid/TileGridControl';

import type { AdvisorPreviewControl } from './AdvisorPreview/AdvisorPreviewControl';

export type AdvisorSelectControls = {
  readonly advisors: TileGridControl;
  readonly preview: AdvisorPreviewControl;
  readonly map: ScenarioMapControl;
};

export type AdvisorSelectViews = ChildrenViews<AdvisorSelectControls>;
