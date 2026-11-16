import type { SearchCommand } from '@/core/commands/province/SearchCommand';
import type { Province } from '@/core/domain/Province';
import { isDefined } from '@/lib/value/isDefined';

import { CommandDialogControl } from './CommandDialogControl';
import { SearchDialogView } from './SearchDialogView';

export class SearchDialogControl extends CommandDialogControl<
  SearchDialogView,
  SearchCommand
> {
  private target: Province | undefined = undefined;

  public constructor(name: string) {
    super(SearchDialogView, { name });
  }

  public override open(command: SearchCommand): void {
    this.target = undefined;
    this.update();
    super.open(command);
  }

  public override get targetPrompt(): string {
    return 'Spy on whose land?';
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.update();
    }
  }

  protected override setupCommand(command: SearchCommand): void {
    if (this.target) {
      command.searchAt(this.target);
    }
  }

  private update(): void {
    this.view.showTarget(this.target);
    this.view.enableConfirm(isDefined(this.target));
  }
}
