import type { ChangeLordCommand } from '@/core/commands/province/ChangeLordCommand';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import {
  ChangeLordDialogView,
  type LordItem,
  type MovableLord,
} from './ChangeLordDialogView';
import { CommandDialogControl } from './CommandDialogControl';
import { type LordMode, LordModeEvent } from './LordModeEvent';
import { LordSelectedEvent } from './LordSelectedEvent';

export class ChangeLordDialogControl extends CommandDialogControl<
  ChangeLordDialogView,
  ChangeLordCommand
> {
  private readonly world: World;
  private target: Province | undefined = undefined;
  private choice: string | undefined = undefined;
  private mode: LordMode = 'you';

  public constructor(name: string, world: World) {
    super(ChangeLordDialogView, { name });
    this.world = world;
  }

  public override open(command: ChangeLordCommand): void {
    this.target = undefined;
    this.resetSelection();
    this.update();
    super.open(command);
  }

  public override get targetPrompt(): string {
    return 'Which territory?';
  }

  public override pickTarget(province: Province): void {
    this.target = province;
    this.resetSelection();
    this.update();
  }

  public override get inspectsTarget(): boolean {
    return true;
  }

  public override refresh(): void {
    this.resetSelection();
    this.update();
  }

  protected override onMount(): void {
    this.subscribe(LordSelectedEvent, (event) => {
      this.choice = event.choice;
      this.update();
    });

    this.subscribe(LordModeEvent, (event) => {
      this.mode = event.mode;
      this.choice = undefined;
      this.update();
    });
  }

  protected override setupCommand(command: ChangeLordCommand): void {
    if (this.target && isDefined(this.choice)) {
      const general = this.world.generals.getOrFail(this.choice);

      if (this.world.player.isRuler(general)) {
        command.ruleDirectly(this.target);
      } else {
        command.assignLord(this.target, general);
      }
    }
  }

  private resetSelection(): void {
    this.choice = undefined;
    this.mode = 'you';
  }

  private update(): void {
    this.view.showTarget(this.target);

    if (this.target) {
      this.showMode(this.target);
    } else {
      this.view.clearOptions();
    }

    this.view.enableConfirm(isDefined(this.choice));
  }

  private showMode(target: Province): void {
    switch (this.mode) {
      case 'you':
        this.view.showMenu(this.buildRuler(target));
        break;
      case 'vassals':
        this.view.showVassals(this.buildVassals());
        break;
      case 'lords':
        this.view.showLords(this.buildLords(target));
        break;
    }
  }

  private buildRuler(target: Province): LordItem | undefined {
    const { ruler } = this.world.player;

    return target.ruledBy(ruler)
      ? undefined
      : { name: ruler.name, selected: this.isSelected(ruler.name) };
  }

  private buildVassals(): LordItem[] {
    return this.world.getVassals(this.world.player).map((vassal) => ({
      name: vassal.name,
      selected: this.isSelected(vassal.name),
    }));
  }

  private buildLords(target: Province): MovableLord[] {
    return this.world
      .getFamilyProvinces(this.world.player)
      .filter((province) => province.hasLord && !province.isEqual(target))
      .map((province) => ({
        name: province.governor!.name,
        from: province.name,
        selected: this.isSelected(province.governor!.name),
      }));
  }

  private isSelected(name: string): boolean {
    return this.choice === name;
  }
}
