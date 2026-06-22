import type { HireMonsterCommand } from '@/core/commands/province/HireMonsterCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { World } from '@/core/domain/World';

import { CommandDialogControl } from './CommandDialogControl';
import {
  HireMonsterDialogView,
  type UnitDetail,
} from './HireMonsterDialogView';
import { UnitFocusedEvent } from './UnitFocusedEvent';

export class HireMonsterDialogControl extends CommandDialogControl<
  HireMonsterDialogView,
  HireMonsterCommand
> {
  private readonly world: World;
  private focused: string | undefined = undefined;

  public constructor(name: string, world: World) {
    super(HireMonsterDialogView, { name });
    this.world = world;
  }

  public override open(command: HireMonsterCommand): void {
    super.open(command);
    this.populate();
  }

  protected override onMount(): void {
    this.subscribe(UnitFocusedEvent, (event) => this.focus(event.type));
  }

  protected override setupCommand(command: HireMonsterCommand): void {
    if (this.focused) {
      command.hire(this.focused);
    }
  }

  private populate(): void {
    const hireable = this.buildHireable();

    this.view.showUnits(hireable);
    this.focus(hireable[0]?.type);
  }

  private focus(type: string | undefined): void {
    this.focused = type;

    if (type) {
      this.view.focusUnit(type);
    }

    this.view.showDetail(type ? this.buildDetail(type) : undefined);
  }

  private buildHireable(): HiredUnit[] {
    const types = this.command?.hireableTypes ?? [];

    return types
      .map((type) => HiredUnit.ofType(type))
      .filter((unit) => unit !== undefined);
  }

  private buildDetail(type: string): UnitDetail | undefined {
    const province = this.world.turnQueue.current;
    const unit = HiredUnit.ofType(type);

    return province && unit
      ? {
          unit,
          affordable: province.resources.gold >= unit.cost,
        }
      : undefined;
  }
}
