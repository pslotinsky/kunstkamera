import type { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { CommandDialogControl } from '@/ui/ProvinceCommands/CommandDialog/CommandDialogControl';

import { FamilyOverviewTabSelectedEvent } from './FamilyOverviewTabSelectedEvent';
import {
  type FamilyOverviewMode,
  FamilyOverviewView,
  type FifthUnitRow,
  type GeneralRow,
} from './FamilyOverviewView';

export class FamilyOverviewControl extends CommandDialogControl<
  FamilyOverviewView,
  ViewCommand
> {
  private readonly world: World;

  public constructor(name: string, world: World) {
    super(FamilyOverviewView, { name });
    this.world = world;
  }

  public override open(command: ViewCommand): void {
    super.open(command);
    this.showMode('general');
  }

  protected override onMount(): void {
    this.subscribe(FamilyOverviewTabSelectedEvent, (event) =>
      this.showMode(event.mode),
    );
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
      case 'units':
        this.view.showFifthUnits(this.buildFifthUnits());
        break;
    }
  }

  private buildGeneral(): GeneralRow[] {
    const { world } = this;
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
    return this.world.getFamilyProvinces(this.world.player);
  }

  private buildFifthUnits(): FifthUnitRow[] {
    return this.world
      .getFamilyProvinces(this.world.player)
      .flatMap((province) =>
        province.hiredUnits.map((unit) => ({ unit, province })),
      );
  }
}
