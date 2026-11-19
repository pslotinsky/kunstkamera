import { SCENARIOS } from '@/config/scenarios';
import { Control } from '@/lib/Control';
import { AdvisorSelectControl } from '@/ui/AdvisorSelect/AdvisorSelectControl';
import { CampaignControl } from '@/ui/Campaign/CampaignControl';
import { FamilySelectControl } from '@/ui/FamilySelect/FamilySelectControl';
import { ScenarioSelectControl } from '@/ui/ScenarioSelect/ScenarioSelectControl';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { BeginChosenEvent } from '@/ui/Setup/events/BeginChosenEvent';
import { NextChosenEvent } from '@/ui/Setup/events/NextChosenEvent';
import { NewGameChosenEvent } from '@/ui/TitleScreen/events/NewGameChosenEvent';
import { TitleScreenControl } from '@/ui/TitleScreen/TitleScreenControl';

import { AppView } from './AppView';
import type { AppContext, AppControls } from './types';

export class AppControl extends Control<AppView, AppControls> {
  private campaign?: CampaignControl | undefined;

  public constructor(context: AppContext) {
    super(AppView, context, {
      title: new TitleScreenControl({ sounds: context.sounds }),
      scenarioSelect: new ScenarioSelectControl({ scenarios: SCENARIOS }),
      familySelect: new FamilySelectControl(),
      advisorSelect: new AdvisorSelectControl(),
    });
  }

  protected override onMount(): void {
    const { title, scenarioSelect, familySelect, advisorSelect } =
      this.controls;

    title.view.subscribe(NewGameChosenEvent, () => this.chooseScenario());
    scenarioSelect.view.subscribe(BackChosenEvent, () => this.returnToTitle());
    scenarioSelect.view.subscribe(NextChosenEvent, () => this.chooseFamily());
    familySelect.view.subscribe(BackChosenEvent, () => this.chooseScenario());
    familySelect.view.subscribe(NextChosenEvent, () => this.chooseAdvisor());
    advisorSelect.view.subscribe(BackChosenEvent, () => this.chooseFamily());
    advisorSelect.view.subscribe(BeginChosenEvent, () => this.startCampaign());
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
    const { scenarioSelect, familySelect, advisorSelect } = this.controls;

    scenarioSelect.hide();
    advisorSelect.hide();
    familySelect.show(scenarioSelect.scenario);
  }

  private chooseAdvisor(): void {
    const { scenarioSelect, familySelect, advisorSelect } = this.controls;

    familySelect.hide();
    advisorSelect.show(scenarioSelect.scenario, familySelect.family.name);
  }

  private startCampaign(): void {
    const { scenarioSelect, familySelect, advisorSelect } = this.controls;
    const campaign = CampaignControl.create(
      {
        scenario: scenarioSelect.scenario,
        family: familySelect.family.name,
        advisor: advisorSelect.advisor,
      },
      this.context.sounds,
    );

    campaign.onQuit(() => this.quitCampaign());
    advisorSelect.hide();
    campaign.mount(this.view.openStage());
    this.campaign = campaign;
  }

  private quitCampaign(): void {
    this.campaign?.unmount();
    this.campaign = undefined;
    this.view.clearStage();
    this.context.sounds.playMusic('title');
    this.controls.title.show();
  }
}
