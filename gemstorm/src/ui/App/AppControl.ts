import { SCENARIOS } from '@/config/scenarios';
import { Control } from '@/lib/Control';
import { CampaignControl } from '@/ui/Campaign/CampaignControl';
import { FamilySelectControl } from '@/ui/FamilySelect/FamilySelectControl';
import { ScenarioSelectControl } from '@/ui/ScenarioSelect/ScenarioSelectControl';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { NextChosenEvent } from '@/ui/Setup/events/NextChosenEvent';
import { NewGameChosenEvent } from '@/ui/TitleScreen/events/NewGameChosenEvent';
import { TitleScreenControl } from '@/ui/TitleScreen/TitleScreenControl';

import { AppView } from './AppView';
import type { AppContext, AppControls } from './types';

export class AppControl extends Control<AppView, AppControls> {
  private campaign?: CampaignControl;

  public constructor(context: AppContext) {
    super(AppView, context, {
      title: new TitleScreenControl({ sounds: context.sounds }),
      scenarioSelect: new ScenarioSelectControl({ scenarios: SCENARIOS }),
      familySelect: new FamilySelectControl(),
    });
  }

  protected override onMount(): void {
    const { title, scenarioSelect, familySelect } = this.controls;

    title.view.subscribe(NewGameChosenEvent, () => this.chooseScenario());
    scenarioSelect.view.subscribe(BackChosenEvent, () => this.returnToTitle());
    scenarioSelect.view.subscribe(NextChosenEvent, () => this.chooseFamily());
    familySelect.view.subscribe(BackChosenEvent, () => this.chooseScenario());
    familySelect.view.subscribe(NextChosenEvent, () => this.startCampaign());
  }

  protected override onUnmount(): void {
    this.campaign?.unmount();
  }

  private chooseScenario(): void {
    this.controls.title.hide();
    this.controls.familySelect.hide();
    this.controls.scenarioSelect.show();
  }

  private returnToTitle(): void {
    this.controls.scenarioSelect.hide();
    this.controls.title.show();
  }

  private chooseFamily(): void {
    const { scenarioSelect, familySelect } = this.controls;

    scenarioSelect.hide();
    familySelect.show(scenarioSelect.scenario);
  }

  private startCampaign(): void {
    const { scenarioSelect, familySelect } = this.controls;
    const campaign = CampaignControl.create(
      { scenario: scenarioSelect.scenario, family: familySelect.family.name },
      this.context.sounds,
    );

    familySelect.hide();
    campaign.mount(this.view.stage);
    this.campaign = campaign;
  }
}
