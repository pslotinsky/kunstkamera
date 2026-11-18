import type { ChildrenViews } from '@/lib/Control';
import type { ScenarioMapControl } from '@/ui/Setup/ScenarioMap/ScenarioMapControl';
import type { TileGridControl } from '@/ui/Setup/TileGrid/TileGridControl';

import type { RulerPreviewControl } from './RulerPreview/RulerPreviewControl';

export type FamilySelectControls = {
  readonly houses: TileGridControl;
  readonly ruler: RulerPreviewControl;
  readonly map: ScenarioMapControl;
};

export type FamilySelectViews = ChildrenViews<FamilySelectControls>;
