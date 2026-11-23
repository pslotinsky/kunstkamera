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
    this.target = undefined;
    this.resetSelection();
    this.update();
    this.requestTarget();
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
    const { target, choice } = this;

    if (isDefined(target) && isDefined(choice)) {
      switch (this.mode) {
        case 'you':
          command.ruleDirectly(target);
          break;
        case 'vassals':
          this.chooseVassal(command, target, choice);
          break;
        case 'lords':
          this.chooseSwapProvince(command, target, choice);
          break;
      }
    }
  }

  private chooseVassal(
    command: ChangeLordCommand,
    target: Province,
    name: string,
  ): void {
    const vassal = this.findVassals().find((general) => general.name === name);

    if (isDefined(vassal)) {
      command.assignLord(target, vassal);
    }
  }

  private chooseSwapProvince(
    command: ChangeLordCommand,
    target: Province,
    provinceNumber: string,
  ): void {
    const source = this.findSwapProvinces(target).find(
      (province) => String(province.number) === provinceNumber,
    );

    if (isDefined(source)) {
      command.swapGovernors(target, source);
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
    this.view.askAboutMovingRuler(this.isMovingRuler());
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

    return target.hasLord
      ? { name: ruler.name, selected: this.isSelected(ruler.name) }
      : undefined;
  }

  private buildVassals(): LordItem[] {
    return this.findVassals().map((vassal) => ({
      name: vassal.name,
      selected: this.isSelected(vassal.name),
    }));
  }

  private findVassals() {
    return this.world
      .getVassals(this.world.player)
      .filter((general) => !this.world.isHeld(general));
  }

  private buildLords(target: Province): MovableLord[] {
    return this.findSwapProvinces(target).map((province) => ({
      provinceNumber: province.number,
      name:
        province.isHome || province.hasLord
          ? (province.governor?.name ?? 'No lord')
          : 'No lord',
      from: province.name,
      selected: this.isSelected(String(province.number)),
    }));
  }

  private findSwapProvinces(target: Province): readonly Province[] {
    return this.world
      .getFamilyProvinces(this.world.player)
      .filter((province) => !province.isEqual(target));
  }

  private isMovingRuler(): boolean {
    const home = this.world.player.homeProvince;

    return this.mode === 'lords' && this.isSelected(String(home.number));
  }

  private isSelected(name: string): boolean {
    return this.choice === name;
  }
}
