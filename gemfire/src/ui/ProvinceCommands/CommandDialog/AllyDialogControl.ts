import type { AllyCommand } from '@/core/commands/province/AllyCommand';
import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';

import { AllyDialogView } from './AllyDialogView';
import { CommandDialogControl } from './CommandDialogControl';

export class AllyDialogControl extends CommandDialogControl<
  AllyDialogView,
  AllyCommand
> {
  private readonly world: World;
  private family: Family | undefined = undefined;

  public constructor(name: string, world: World) {
    super(AllyDialogView, { name });
    this.world = world;
  }

  public override open(command: AllyCommand): void {
    this.family = undefined;
    super.open(command);
    this.update();
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.family = province.family;
      this.update();
    }
  }

  protected override setupCommand(command: AllyCommand): void {
    if (this.family) {
      command.proposeTo(this.family);
    }
  }

  private update(): void {
    const ally = this.command?.ally;
    const { player } = this.world;

    if (ally) {
      this.view.showPact(player, ally);
    } else if (this.family) {
      const provinces = this.world.getFamilyProvinces(this.family);

      this.view.showProposal(this.family, provinces.length, player);
    } else {
      this.view.askForFamily();
    }
  }
}
