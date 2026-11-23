import {
  DevelopCommand,
  type DevelopTarget,
} from '@/core/commands/province/DevelopCommand';
import { isDefined } from '@/lib/value/isDefined';

import { CommandDialogControl } from './CommandDialogControl';
import { CommandStep } from './CommandStep';
import { DevelopDialogView } from './DevelopDialogView';

const TARGETS: readonly { value: DevelopTarget; label: string }[] = [
  { value: 'cultivation', label: 'Cultivation' },
  { value: 'protection', label: 'Protection' },
];

export class DevelopDialogControl extends CommandDialogControl<
  DevelopDialogView,
  DevelopCommand
> {
  private target: DevelopTarget | undefined = undefined;

  public constructor(name: string) {
    super(DevelopDialogView, { name });
  }

  public override get step(): CommandStep {
    const prompt = `Invest ${DevelopCommand.COST} gold in what?`;
    const availableTargets = TARGETS.filter(({ value }) =>
      this.command?.canDevelop(value),
    );

    return new CommandStep(prompt, availableTargets, this.target);
  }

  public override open(command: DevelopCommand): void {
    this.target = undefined;
    super.open(command);
  }

  protected override selectChoice(value: string): void {
    const target = TARGETS.find((choice) => choice.value === value)?.value;

    if (isDefined(target) && this.command?.canDevelop(target)) {
      this.target = target;
      this.submit();
    }
  }

  protected override setupCommand(command: DevelopCommand): void {
    if (this.target) {
      command.target = this.target;
    }
  }
}
