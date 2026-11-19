import type { ChildrenViews } from '@/lib/Control';
import type { PlaqueControl } from '@/ui/common/Plaque/PlaqueControl';
import type { MapPreviewControl } from '@/ui/screens/NewGameScreen/MapPreview/MapPreviewControl';

export type ScenarioMapControls = {
  readonly map: MapPreviewControl;
  readonly date: PlaqueControl;
};

export type ScenarioMapViews = ChildrenViews<ScenarioMapControls>;
