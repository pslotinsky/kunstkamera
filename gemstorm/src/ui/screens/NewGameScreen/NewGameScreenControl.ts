import { SCENARIOS } from '@/config/scenarios';
import type { CampaignStart } from '@/core/WorldFactory';
import { Control } from '@/lib/Control';
import { AdvisorSelectControl } from '@/ui/screens/NewGameScreen/AdvisorSelect/AdvisorSelectControl';
import { BackChosenEvent } from '@/ui/screens/NewGameScreen/events/BackChosenEvent';
import { BeginChosenEvent } from '@/ui/screens/NewGameScreen/events/BeginChosenEvent';
import { NextChosenEvent } from '@/ui/screens/NewGameScreen/events/NextChosenEvent';
import { FamilySelectControl } from '@/ui/screens/NewGameScreen/FamilySelect/FamilySelectControl';
import { ScenarioSelectControl } from '@/ui/screens/NewGameScreen/ScenarioSelect/ScenarioSelectControl';

import { NewGameScreenView } from './NewGameScreenView';
import type { NewGameControls } from './types';

export class NewGameScreenControl extends Control<
  NewGameScreenView,
  NewGameControls
> {
  private onBackHandler: () => void = () => {};
  private onBeginHandler: (start: CampaignStart) => void = () => {};

  public constructor() {
    super(
      NewGameScreenView,
      {},
      {
        scenarioSelect: new ScenarioSelectControl({ scenarios: SCENARIOS }),
        familySelect: new FamilySelectControl(),
        advisorSelect: new AdvisorSelectControl(),
      },
    );
  }

  public onBack(handler: () => void): void {
    this.onBackHandler = handler;
  }
  public onBegin(handler: (start: CampaignStart) => void): void {
    this.onBeginHandler = handler;
  }
  public show(): void {
    this.controls.scenarioSelect.show();
  }

  protected override onMount(): void {
    const { scenarioSelect, familySelect, advisorSelect } = this.controls;
    scenarioSelect.view.subscribe(BackChosenEvent, () => {
      scenarioSelect.hide();
      this.onBackHandler();
    });
    scenarioSelect.view.subscribe(NextChosenEvent, () => {
      scenarioSelect.hide();
      familySelect.show(scenarioSelect.scenario);
    });
    familySelect.view.subscribe(BackChosenEvent, () => {
      familySelect.hide();
      scenarioSelect.show();
    });
    familySelect.view.subscribe(NextChosenEvent, () => {
      familySelect.hide();
      advisorSelect.show(scenarioSelect.scenario, familySelect.family.name);
    });
    advisorSelect.view.subscribe(BackChosenEvent, () => {
      advisorSelect.hide();
      familySelect.show(scenarioSelect.scenario);
    });
    advisorSelect.view.subscribe(BeginChosenEvent, () => {
      advisorSelect.hide();
      this.onBeginHandler({
        scenario: scenarioSelect.scenario,
        family: familySelect.family.name,
        advisor: advisorSelect.advisor,
      });
    });
  }
}
