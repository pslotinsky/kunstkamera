import {
  DevelopCommand,
  type DevelopTarget,
} from '@/core/commands/province/DevelopCommand';

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
    return new CommandStep(
      `Invest ${DevelopCommand.COST} gold in what?`,
      TARGETS,
      this.target,
    );
  }

  public override open(command: DevelopCommand): void {
    this.target = undefined;
    super.open(command);
  }

  protected override selectChoice(value: string): void {
    this.target = value as DevelopTarget;
    this.submit();
  }

  protected override setupCommand(command: DevelopCommand): void {
    if (this.target) {
      command.target = this.target;
    }
  }
}
