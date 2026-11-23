import type { AttackCommand } from '@/core/commands/province/AttackCommand';
import type { AttackForce } from '@/core/domain/AttackDeployment';
import type { FifthUnit } from '@/core/domain/FifthUnit';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';
import { DropdownControl } from '@/ui/common/Dropdown/DropdownControl';
import { toUnitOptions } from '@/ui/common/Dropdown/dropdown-options';

import { AmountFieldControl } from '../AmountField/AmountFieldControl';
import { AttackDialogView } from './AttackDialogView';
import { CommandDialogControl } from './CommandDialogControl';

type AttackControls = {
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
  private target: Province | undefined;

  public constructor(name: string, world: World) {
    super(
      AttackDialogView,
      { name },
      {
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
    this.controls.unit.reset();
    this.controls.food.reset();
    super.open(command);
    this.update();
  }

  public override get targetPrompt(): string {
    return 'Attack where?';
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override onMount(): void {
    this.controls.troops.onChange(() => this.update());
    this.controls.food.onChange(() => this.update());
    this.controls.unit.onChange(() => this.update());
  }

  protected override setupCommand(command: AttackCommand): void {
    if (isDefined(this.target)) {
      command.attackAt(this.target, this.buildForce());
    }
  }

  private update(): void {
    const { current } = this.world.turnQueue;
    const maxTroops = current?.resources.troops ?? 0;
    const maxFood = current?.resources.food ?? 0;

    this.controls.unit.setOptions(toUnitOptions(this.availableUnits()));
    this.controls.troops.setMax(maxTroops);
    this.controls.food.setMax(maxFood);
    this.view.setTroopsRange(maxTroops);
    this.view.showTarget(this.target);
    this.view.showForm(isDefined(this.target));
    this.showCommitment();
  }

  private showCommitment(): void {
    const { command, target } = this;
    const deployment = command?.prepare(this.buildForce());
    const canLaunch =
      isDefined(target) &&
      isDefined(deployment) &&
      command?.canLaunch(target, deployment) === true;
    const commander = deployment?.commander.name ?? '';
    const remote =
      isDefined(deployment) && !isDefined(deployment.source.residentGovernor);

    this.view.showCommander(commander, remote);
    this.view.setFoodRange(
      deployment?.dailyFood ?? 0,
      deployment?.source.resources.food ?? 0,
    );
    this.view.showFigures(deployment?.gold ?? 0, deployment?.supplyDays ?? 0);
    this.view.enableConfirm(canLaunch);
  }

  private buildForce(): AttackForce {
    const troops = this.controls.troops.value;
    const food = this.controls.food.value;
    const selected = this.controls.unit.value;
    const unit = this.availableUnits().find(
      (candidate) => candidate.name === selected,
    );

    return { troops, food, unit };
  }

  private availableUnits(): readonly FifthUnit[] {
    const { current } = this.world.turnQueue;

    return isDefined(current) ? this.world.getFifthUnits(current) : [];
  }
}
