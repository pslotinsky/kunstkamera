import type { RecruitCommand } from '@/core/commands/province/RecruitCommand';
import type { World } from '@/core/domain/World';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { RecruitDialogView } from './RecruitDialogView';

const GOLD_PER_TROOP = 2;
const TROOP_CEILING = 999;

export class RecruitDialogControl extends CommandDialogControl<
  RecruitDialogView,
  RecruitCommand,
  { troops: AmountFieldControl }
> {
  private readonly world: World;

  public constructor(name: string, world: World) {
    super(
      RecruitDialogView,
      { name },
      { troops: new AmountFieldControl({ name: 'troops' }) },
    );
    this.world = world;
  }

  public override open(command: RecruitCommand): void {
    this.controls.troops.reset();
    this.update();
    super.open(command);
  }

  protected override onMount(): void {
    this.controls.troops.onChange(() => this.update());
  }

  protected override setupCommand(command: RecruitCommand): void {
    command.recruit(this.controls.troops.value);
  }

  private update(): void {
    const max = this.getTroopsMax();

    this.controls.troops.setMax(max);
    this.view.setRange(max);
    this.view.enableConfirm(this.controls.troops.value > 0);
  }

  private getTroopsMax(): number {
    const province = this.world.turnQueue.current;

    let max = 0;

    if (province) {
      const affordable = Math.floor(province.resources.gold / GOLD_PER_TROOP);
      const headroom = TROOP_CEILING - province.resources.troops;

      max = Math.min(affordable, headroom);
    }

    return max;
  }
}
