import type {
  NegotiateCommand,
  NegotiationMission,
} from '@/core/commands/province/NegotiateCommand';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { isDefined } from '@/lib/value/isDefined';

import { CandidateSelectedEvent } from './CandidateSelectedEvent';
import { CommandDialogControl } from './CommandDialogControl';
import { MissionSelectedEvent } from './MissionSelectedEvent';
import { type Candidate, NegotiateDialogView } from './NegotiateDialogView';

export class NegotiateDialogControl extends CommandDialogControl<
  NegotiateDialogView,
  NegotiateCommand
> {
  private readonly world: World;
  private target: Province | undefined = undefined;
  private mission: NegotiationMission = 'defection';
  private choice: string | undefined = undefined;

  public constructor(name: string, world: World) {
    super(NegotiateDialogView, { name });
    this.world = world;
  }

  public override open(command: NegotiateCommand): void {
    this.target = undefined;
    this.mission = 'defection';
    this.choice = undefined;
    super.open(command);
    this.update();
  }

  public override pickTarget(province: Province): void {
    if (this.command?.selectableTargets.includes(province.number)) {
      this.target = province;
      this.choice = undefined;
      this.update();
    }
  }

  protected override onMount(): void {
    this.subscribe(MissionSelectedEvent, (event) => {
      this.mission = event.mission;
      this.update();
    });

    this.subscribe(CandidateSelectedEvent, (event) => {
      this.choice = event.name;
      this.update();
    });
  }

  protected override setupCommand(command: NegotiateCommand): void {
    const family = this.target?.family;

    if (this.mission === 'surrender' && family) {
      command.demandSurrender(family);
    } else if (isDefined(this.choice)) {
      command.persuade(this.world.generals.getOrFail(this.choice));
    }
  }

  private update(): void {
    const target = this.target;
    const family = target?.family;

    this.view.showTarget(target);
    this.view.showMission(target ? this.mission : undefined);

    if (target && family && this.mission === 'surrender') {
      this.view.showDemand(family, this.world.player);
      this.view.enableConfirm(true);
    } else if (target) {
      this.view.showCandidates(this.buildCandidates(target));
      this.view.enableConfirm(isDefined(this.choice));
    } else {
      this.view.enableConfirm(false);
    }
  }

  private buildCandidates(target: Province): readonly Candidate[] {
    return (this.command?.getCandidates(target) ?? []).map((general) => ({
      general,
      posting: this.describePosting(general),
      selected: this.choice === general.name,
    }));
  }

  private describePosting(general: General): string {
    const governed = this.world.getRuledProvince(general);

    return governed ? `lord of ${governed.name}` : 'no province';
  }
}
