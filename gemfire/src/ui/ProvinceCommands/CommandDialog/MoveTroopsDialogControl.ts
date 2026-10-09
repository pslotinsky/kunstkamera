import type { MoveTroopsCommand } from '@/core/commands/province/MoveTroopsCommand';
import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import type { DropdownOption } from '@/ui/Dropdown/DropdownView';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { CommandDialogControl } from './CommandDialogControl';
import { MoveTroopsDialogView } from './MoveTroopsDialogView';

const RESOURCE_CEILING = 999;

type Resource = 'gold' | 'food' | 'troops';

const RESOURCES: readonly Resource[] = ['troops', 'food', 'gold'];

type MoveTroopsControls = {
  readonly troops: AmountFieldControl;
  readonly food: AmountFieldControl;
  readonly gold: AmountFieldControl;
  readonly carry: DropdownControl;
};

export class MoveTroopsDialogControl extends CommandDialogControl<
  MoveTroopsDialogView,
  MoveTroopsCommand,
  MoveTroopsControls
> {
  private readonly world: World;
  private target: Province | undefined = undefined;

  public constructor(name: string, world: World) {
    super(
      MoveTroopsDialogView,
      { name },
      {
        troops: new AmountFieldControl({ name: 'troops' }),
        food: new AmountFieldControl({ name: 'food' }),
        gold: new AmountFieldControl({ name: 'gold' }),
        carry: new DropdownControl({ name: 'carry' }),
      },
    );
    this.world = world;
  }

  public override open(command: MoveTroopsCommand): void {
    this.target = undefined;

    for (const resource of RESOURCES) {
      this.controls[resource].reset();
    }

    this.controls.carry.reset();
    this.update();
    super.open(command);
  }

  public override get targetPrompt(): string {
    return 'Move troops where?';
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override onMount(): void {
    for (const resource of RESOURCES) {
      this.controls[resource].onChange(() => this.update());
    }

    this.controls.carry.onChange(() => this.update());
  }

  protected override setupCommand(command: MoveTroopsCommand): void {
    if (this.target) {
      command.moveTo(this.target, {
        gold: this.controls.gold.value,
        food: this.controls.food.value,
        troops: this.controls.troops.value,
      });
      command.carry(this.carriedUnit());
    }
  }

  private update(): void {
    const units = this.carriableUnits();

    this.view.showTarget(this.target);
    this.view.showAmounts(isDefined(this.target));
    this.view.showCarry(units.length > 0);
    this.controls.carry.setOptions(this.carryOptions(units));

    for (const resource of RESOURCES) {
      const max = this.getMax(resource);

      this.controls[resource].setMax(max);
      this.view.setRange(resource, max);
    }

    this.view.enableConfirm(isDefined(this.target) && this.movesSomething());
  }

  private movesSomething(): boolean {
    return this.committed() > 0 || isDefined(this.carriedUnit());
  }

  private carriableUnits(): readonly HiredUnit[] {
    return this.target ? this.stationedUnits() : [];
  }

  private carryOptions(units: readonly HiredUnit[]): DropdownOption[] {
    return [
      { value: '', label: 'None' },
      ...units.map((unit) => ({
        value: unit.name,
        label: unit.name,
        icon: unit.portrait,
        note: String(unit.strength),
      })),
    ];
  }

  private stationedUnits(): readonly HiredUnit[] {
    return this.world.turnQueue.current?.hiredUnits ?? [];
  }

  private carriedUnit(): HiredUnit | undefined {
    return this.stationedUnits().find(
      (unit) => unit.name === this.controls.carry.value,
    );
  }

  private committed(): number {
    return RESOURCES.reduce(
      (total, resource) => total + this.controls[resource].value,
      0,
    );
  }

  private getMax(resource: Resource): number {
    const source = this.world.turnQueue.current;

    let max = 0;

    if (this.target && source) {
      max = Math.min(
        source.resources[resource],
        RESOURCE_CEILING - this.target.resources[resource],
      );
    }

    return max;
  }
}
