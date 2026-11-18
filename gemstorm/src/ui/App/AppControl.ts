import { SCENARIOS } from '@/config/scenarios';
import { Control } from '@/lib/Control';
import { CampaignControl } from '@/ui/Campaign/CampaignControl';
import { BackChosenEvent } from '@/ui/ScenarioSelect/events/BackChosenEvent';
import { NextChosenEvent } from '@/ui/ScenarioSelect/events/NextChosenEvent';
import { ScenarioSelectControl } from '@/ui/ScenarioSelect/ScenarioSelectControl';
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
    });
  }

  protected override onMount(): void {
    const { title, scenarioSelect } = this.controls;

    title.view.subscribe(NewGameChosenEvent, () => this.chooseScenario());
    scenarioSelect.view.subscribe(BackChosenEvent, () => this.returnToTitle());
    scenarioSelect.view.subscribe(NextChosenEvent, () => this.startCampaign());
  }

  protected override onUnmount(): void {
    this.campaign?.unmount();
  }

  private chooseScenario(): void {
    this.controls.title.hide();
    this.controls.scenarioSelect.show();
  }

  private returnToTitle(): void {
    this.controls.scenarioSelect.hide();
    this.controls.title.show();
  }

  private startCampaign(): void {
    const { scenarioSelect } = this.controls;
    const campaign = CampaignControl.create(
      { scenario: scenarioSelect.scenario },
      this.context.sounds,
    );

    scenarioSelect.hide();
    campaign.mount(this.view.stage);
    this.campaign = campaign;
  }
}
