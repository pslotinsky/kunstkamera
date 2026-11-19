import type { ChildrenViews } from '@/lib/Control';
import type { AdvisorSelectControl } from '@/ui/screens/NewGameScreen/AdvisorSelect/AdvisorSelectControl';
import type { FamilySelectControl } from '@/ui/screens/NewGameScreen/FamilySelect/FamilySelectControl';
import type { ScenarioSelectControl } from '@/ui/screens/NewGameScreen/ScenarioSelect/ScenarioSelectControl';

export type NewGameControls = {
  readonly scenarioSelect: ScenarioSelectControl;
  readonly familySelect: FamilySelectControl;
  readonly advisorSelect: AdvisorSelectControl;
};
export type NewGameViews = ChildrenViews<NewGameControls>;
