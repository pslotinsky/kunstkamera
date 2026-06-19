import type { Province } from '@/core/domain/Province';
import { Control } from '@/lib/Control';

import { FamilyOverviewClosedEvent } from './FamilyOverviewClosedEvent';
import { FamilyOverviewTabSelectedEvent } from './FamilyOverviewTabSelectedEvent';
import {
  type FamilyOverviewMode,
  FamilyOverviewView,
  type GeneralRow,
} from './FamilyOverviewView';
import type { FamilyOverviewContext } from './types';

export class FamilyOverviewControl extends Control<FamilyOverviewView> {
  public constructor(context: FamilyOverviewContext) {
    super(FamilyOverviewView, context);
  }

  public open(): void {
    this.showMode('general');
    this.view.show();
  }

  protected override onMount(): void {
    this.subscribe(FamilyOverviewTabSelectedEvent, (event) =>
      this.showMode(event.mode),
    );
    this.subscribe(FamilyOverviewClosedEvent, () => this.view.hide());
  }

  private showMode(mode: FamilyOverviewMode): void {
    this.view.selectTab(mode);

    switch (mode) {
      case 'general':
        this.view.showGeneral(this.buildGeneral());
        break;
      case 'land':
        this.view.showLand(this.buildLand());
        break;
    }
  }

  private buildGeneral(): GeneralRow[] {
    const { world } = this.context;
    const family = world.player;

    return family.members.map((member) => ({
      general: member,
      province: world.getResidence(family, member),
      rank: world.getGeneralRank(family, member),
      fame: family.isRuler(member) ? family.fame : undefined,
      age: member.getAgeAt(world.date),
    }));
  }

  private buildLand(): readonly Province[] {
    const { world } = this.context;

    return world.getFamilyProvinces(world.player);
  }
}
