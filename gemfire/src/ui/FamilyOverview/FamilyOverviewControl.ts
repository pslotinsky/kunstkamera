import type { ViewCommand } from '@/core/commands/province/ViewCommand';
import type { Family } from '@/core/domain/Family';
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
  private viewed: Family;

  public constructor(name: string, world: World) {
    super(FamilyOverviewView, { name });
    this.world = world;
    this.viewed = world.player;
  }

  public override open(command: ViewCommand): void {
    this.viewed = this.world.player;
    super.open(command);
  }

  public override chooseTarget(province: Province): void {
    this.pickTarget(province);
  }

  public override get targetPrompt(): string {
    return 'View whose family?';
  }

  public override get inspectsTarget(): boolean {
    return true;
  }

  public override pickTarget(province: Province): void {
    if (province.family) {
      this.showFamily(province.family);
    } else {
      this.view.hide();
    }
  }

  protected override onMount(): void {
    this.subscribe(FamilyOverviewTabSelectedEvent, (event) =>
      this.showMode(event.mode),
    );
  }

  private showFamily(family: Family): void {
    this.viewed = family;
    this.view.show();
    this.view.showFamily(family);
    this.showMode('general');
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
        this.view.showFifthUnits(this.buildFifthUnits(), this.viewsOwnHouse());
        break;
      case 'gems':
        this.view.showGems(this.viewed.gems);
        break;
    }
  }

  private viewsOwnHouse(): boolean {
    return this.viewed.isEqual(this.world.player);
  }

  private buildGeneral(): GeneralRow[] {
    const { world, viewed } = this;

    return viewed.members.map((member) => ({
      general: member,
      province: world.getResidence(viewed, member),
      rank: world.getGeneralRank(viewed, member),
      fame: viewed.isRuler(member) ? viewed.fame : undefined,
      age: member.getAgeAt(world.date),
    }));
  }

  private buildLand(): readonly Province[] {
    return this.world.getFamilyProvinces(this.viewed);
  }

  private buildFifthUnits(): FifthUnitRow[] {
    return this.viewsOwnHouse()
      ? this.world
          .getFamilyProvinces(this.viewed)
          .flatMap((province) =>
            province.hiredUnits.map((unit) => ({ unit, province })),
          )
      : [];
  }
}
