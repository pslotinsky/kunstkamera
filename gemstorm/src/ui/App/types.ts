import type { ChildrenViews } from '@/lib/Control';
import type { ScenarioSelectControl } from '@/ui/ScenarioSelect/ScenarioSelectControl';
import type { SoundBoard } from '@/ui/sound/SoundBoard';
import type { TitleScreenControl } from '@/ui/TitleScreen/TitleScreenControl';

export interface AppContext {
  readonly sounds: SoundBoard;
}

export type AppControls = {
  readonly title: TitleScreenControl;
  readonly scenarioSelect: ScenarioSelectControl;
};

export type AppViews = ChildrenViews<AppControls>;
