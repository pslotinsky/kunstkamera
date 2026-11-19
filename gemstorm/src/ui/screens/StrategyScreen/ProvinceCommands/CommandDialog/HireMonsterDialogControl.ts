import type {
  HireMode,
  HireMonsterCommand,
} from '@/core/commands/province/HireMonsterCommand';
import { HiredUnit } from '@/core/domain/HiredUnit';
import type { World } from '@/core/domain/World';
import { capitalize } from '@/lib/string/capitalize';

import { CommandDialogControl } from './CommandDialogControl';
import { HireModeSelectedEvent } from './HireModeSelectedEvent';
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
  private mode: HireMode = 'hire';
  private focused: string | undefined = undefined;

  public constructor(name: string, world: World) {
    super(HireMonsterDialogView, { name });
    this.world = world;
  }

  public override open(command: HireMonsterCommand): void {
    super.open(command);
    this.setMode('hire');
  }

  protected override onMount(): void {
    this.subscribe(UnitFocusedEvent, (event) => this.focus(event.name));
    this.subscribe(HireModeSelectedEvent, (event) => this.setMode(event.mode));
  }

  protected override setupCommand(command: HireMonsterCommand): void {
    if (this.focused) {
      if (this.mode === 'dismiss') {
        command.dismiss(this.focused);
      } else {
        command.hire(this.focused);
      }
    }
  }

  private setMode(mode: HireMode): void {
    this.mode = mode;
    this.view.showMode(mode);

    const units = this.units();

    this.view.showUnits(units, mode);
    this.focus(units[0]?.name);
  }

  private focus(name: string | undefined): void {
    this.focused = name;

    if (name) {
      this.view.focusUnit(name);
    }

    this.view.showDetail(name ? this.buildDetail(name) : undefined);
  }

  private units(): readonly HiredUnit[] {
    return this.mode === 'dismiss'
      ? (this.command?.stationedUnits ?? [])
      : (this.command?.hireableNames ?? [])
          .map((name) => HiredUnit.ofName(name))
          .filter((unit) => unit !== undefined);
  }

  private buildDetail(name: string): UnitDetail | undefined {
    const province = this.world.turnQueue.current;
    const unit = HiredUnit.ofName(name);

    return province && unit
      ? {
          unit,
          actionLabel: capitalize(this.mode),
          enabled:
            this.mode === 'dismiss' || province.resources.gold >= unit.cost,
        }
      : undefined;
  }
}
