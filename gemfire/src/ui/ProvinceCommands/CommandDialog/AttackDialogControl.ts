import type { AttackCommand } from '@/core/commands/province/AttackCommand';
import { Army } from '@/core/domain/Army';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import type { DropdownOption } from '@/ui/Dropdown/DropdownView';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { AttackDialogView } from './AttackDialogView';
import { CommandDialogControl } from './CommandDialogControl';

type AttackControls = {
  readonly commander: DropdownControl;
  readonly troops: AmountFieldControl;
  readonly food: AmountFieldControl;
  readonly unit: DropdownControl;
};

export class AttackDialogControl extends CommandDialogControl<
  AttackDialogView,
  AttackCommand,
  AttackControls
> {
  private readonly world: World;
  private target: Province | undefined = undefined;

  public constructor(name: string, world: World) {
    super(
      AttackDialogView,
      { name },
      {
        commander: new DropdownControl({ name: 'commander' }),
        troops: new AmountFieldControl({ name: 'troops' }),
        food: new AmountFieldControl({ name: 'food' }),
        unit: new DropdownControl({ name: 'unit' }),
      },
    );
    this.world = world;
  }

  public override open(command: AttackCommand): void {
    this.target = undefined;
    this.controls.troops.reset();
    this.controls.food.reset();
    this.controls.unit.reset();
    this.controls.commander.setValue(this.defaultCommander()?.name ?? '');
    this.update();
    super.open(command);
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override onMount(): void {
    this.controls.commander.onChange(() => this.update());
    this.controls.troops.onChange(() => this.update());
    this.controls.food.onChange(() => this.update());
    this.controls.unit.onChange(() => this.update());
  }

  protected override setupCommand(command: AttackCommand): void {
    const army = this.buildArmy();

    if (this.target && army) {
      command.attackAt(this.target, army);
    }
  }

  private update(): void {
    const province = this.world.turnQueue.current;

    this.controls.commander.setOptions(this.commanderOptions());
    this.controls.unit.setOptions(this.unitOptions());
    this.controls.troops.setMax(province?.resources.troops ?? 0);
    this.controls.food.setMax(province?.resources.food ?? 0);

    this.view.showTarget(this.target);
    this.view.showForm(isDefined(this.target));
    this.showCommitment(province);
  }

  private showCommitment(province: Province | undefined): void {
    const army = this.buildArmy();

    this.view.setTroopsRange(province?.resources.troops ?? 0);
    this.view.setFoodRange(army?.dailyFood ?? 0, province?.resources.food ?? 0);
    this.view.showFigures(army?.deploymentCost ?? 0, army?.supplyDays ?? 0);
    this.view.enableConfirm(this.canLaunch(province, army));
  }

  private canLaunch(
    province: Province | undefined,
    army: Army | undefined,
  ): boolean {
    return (
      isDefined(this.target) &&
      isDefined(province) &&
      isDefined(army) &&
      army.hasTroops &&
      army.supplyDays > 0 &&
      province.resources.gold >= army.deploymentCost
    );
  }

  private buildArmy(): Army | undefined {
    const commander = this.chosenCommander();

    return commander
      ? new Army({
          commander,
          troops: this.controls.troops.value,
          food: this.controls.food.value,
          unit: this.chosenUnit(),
        })
      : undefined;
  }

  private commanderOptions(): DropdownOption[] {
    return this.candidates().map((candidate) => ({
      value: candidate.name,
      label: candidate.name,
      icon: candidate.portrait,
      note: `WAR ${candidate.stats.war}`,
    }));
  }

  private unitOptions(): DropdownOption[] {
    return [
      { value: '', label: 'None' },
      ...this.availableUnits().map((unit) => ({
        value: unit.name,
        label: unit.name,
        icon: unit.portrait,
        note: String(unit.strength),
      })),
    ];
  }

  private chosenCommander(): General | undefined {
    const chosen = this.controls.commander.value;
    const candidates = this.candidates();

    return (
      candidates.find((candidate) => candidate.name === chosen) ?? candidates[0]
    );
  }

  private chosenUnit(): FifthUnit | undefined {
    return this.availableUnits().find(
      (unit) => unit.name === this.controls.unit.value,
    );
  }

  private candidates(): readonly General[] {
    const province = this.world.turnQueue.current;
    const family = province?.family;
    const governor = province?.governor;
    const seated = governor ? [governor] : [];
    const idle =
      family && province?.isHome ? this.world.getVassals(family) : [];

    return [...seated, ...idle];
  }

  private defaultCommander(): General | undefined {
    return this.world.turnQueue.current?.governor ?? this.candidates()[0];
  }

  private availableUnits(): readonly FifthUnit[] {
    const province = this.world.turnQueue.current;

    return [
      ...(province?.hiredUnits ?? []),
      ...(province?.family?.getReadyGuardians(this.world.date) ?? []),
    ];
  }
}
