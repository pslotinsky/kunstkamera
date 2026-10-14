import { AllianceAnswerCommand } from '@/core/commands/AllianceAnswerCommand';
import { CrownCommand } from '@/core/commands/CrownCommand';
import { GrantArtifactCommand } from '@/core/commands/GrantArtifactCommand';
import { Coronation } from '@/core/domain/Coronation';
import type { General } from '@/core/domain/General';
import { AllianceOfferedEvent } from '@/core/events/AllianceOfferedEvent';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import { GeneralDiedEvent } from '@/core/events/GeneralDiedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';
import { SuccessionReportedEvent } from '@/core/events/SuccessionReportedEvent';
import { TurnEndedEvent } from '@/core/events/TurnEndedEvent';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import { Control } from '@/lib/Control';
import type { EventClass } from '@/lib/EventBus';
import { getGeneralPortraitUrl } from '@/ui/art/getGeneralPortraitUrl';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import type { DropdownOption } from '@/ui/Dropdown/DropdownView';
import { SearchReportClosedEvent } from '@/ui/SearchReport/SearchReportClosedEvent';
import { TurnHold } from '@/ui/TurnHold';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';
import {
  type AnnouncementsContext,
  type AnnouncementsControls,
  AnnouncementsView,
} from './AnnouncementsView';
import { ChoiceConfirmedEvent } from './ChoiceConfirmedEvent';
import { ChoiceDeclinedEvent } from './ChoiceDeclinedEvent';

type Announced =
  | UnitDesertedEvent
  | ArtifactFoundEvent
  | MissionReportedEvent
  | GeneralDiedEvent
  | SuccessionReportedEvent
  | CaptiveJudgedEvent
  | AllianceOfferedEvent;

export class AnnouncementsControl extends Control<
  AnnouncementsView,
  AnnouncementsControls
> {
  private readonly grantArtifact: GrantArtifactCommand;
  private readonly crown: CrownCommand;
  private readonly answerAlliance: AllianceAnswerCommand;
  private readonly turnHold: TurnHold;
  private readonly queue: Announced[] = [];
  private reporting = false;

  public constructor(context: AnnouncementsContext) {
    super(AnnouncementsView, context, {
      recipient: new DropdownControl({ name: 'recipient' }),
    });
    this.grantArtifact = new GrantArtifactCommand(context);
    this.crown = new CrownCommand(context);
    this.answerAlliance = new AllianceAnswerCommand(context);
    this.turnHold = new TurnHold(context.events);
  }

  protected override onMount(): void {
    this.onWorldEvent(UnitDesertedEvent, (event) => this.announce(event));
    this.onWorldEvent(ArtifactFoundEvent, (event) => this.announce(event));
    this.onWorldEvent(MissionReportedEvent, (event) => this.announce(event));
    this.onWorldEvent(GeneralDiedEvent, (event) => this.announce(event));
    this.onWorldEvent(SuccessionReportedEvent, (event) => this.announce(event));
    this.onWorldEvent(CaptiveJudgedEvent, (event) => this.announce(event));
    this.onWorldEvent(AllianceOfferedEvent, (event) => this.announce(event));
    this.onWorldEvent(SearchReportedEvent, () => this.holdForReport(true));
    this.onWorldEvent(SearchReportClosedEvent, () => this.holdForReport(false));
    this.onWorldEvent(BattleReportedEvent, () => this.holdForReport(true));
    this.onWorldEvent(BattleReportClosedEvent, () => this.holdForReport(false));
    this.subscribe(AnnouncementDismissedEvent, () => this.dismiss());
    this.subscribe(ChoiceConfirmedEvent, () => this.confirmChoice());
    this.subscribe(ChoiceDeclinedEvent, () => this.answerOffer(false));
  }

  private onWorldEvent<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.context.events.subscribe(eventClass, handler, this.signal);
  }

  private announce(event: Announced): void {
    if (this.isNews(event)) {
      this.queue.push(event);
      this.refresh();
    }
  }

  private isNews(event: Announced): boolean {
    const { player } = this.context.world;

    if (
      event instanceof SuccessionReportedEvent ||
      event instanceof AllianceOfferedEvent
    ) {
      return true;
    }

    if (event instanceof GeneralDiedEvent) {
      return event.family?.isEqual(player) ?? false;
    }

    if (event instanceof CaptiveJudgedEvent) {
      const { house, captor } = event.captive;

      return house.isEqual(player) && !captor.isEqual(player);
    }

    return (
      event.province.belongsTo(player) ||
      (event instanceof MissionReportedEvent && this.isAimedAtPlayer(event))
    );
  }

  private isAimedAtPlayer(event: MissionReportedEvent): boolean {
    const { outcome } = event;
    const { player } = this.context.world;

    switch (outcome.kind) {
      case 'sabotage':
      case 'plunder':
        return outcome.target.belongsTo(player);
      case 'defection':
      case 'break':
        return outcome.family.isEqual(player);
      default:
        return false;
    }
  }

  private confirmChoice(): void {
    const head = this.queue[0];

    if (head instanceof ArtifactFoundEvent) {
      this.takeArtifact(head);
    } else if (head instanceof SuccessionReportedEvent) {
      this.crownHeir(head);
    } else if (head instanceof AllianceOfferedEvent) {
      this.answerOffer(true);
    }
  }

  private answerOffer(accepted: boolean): void {
    const head = this.queue[0];
    const { world, events } = this.context;

    if (head instanceof AllianceOfferedEvent) {
      this.answerAlliance.answer(head.proposer, accepted);
      this.answerAlliance.execute();
      this.dismiss();
      events.publish(new TurnEndedEvent(world.turnQueue.turnNumber));
    }
  }

  private holdForReport(reporting: boolean): void {
    this.reporting = reporting;
    this.refresh();
  }

  private takeArtifact(found: ArtifactFoundEvent): void {
    const recipient = this.findChosen(this.members);

    if (recipient) {
      this.grantArtifact.grant(found.artifact, recipient);
      this.grantArtifact.execute();
      this.dismiss();
    }
  }

  private crownHeir(succession: SuccessionReportedEvent): void {
    const { outcome } = succession;

    if (outcome instanceof Coronation) {
      const heir = this.findChosen(outcome.heirs);

      if (heir) {
        this.crown.crown(outcome, heir);
        this.crown.execute();
        this.dismiss();
      }
    }
  }

  private dismiss(): void {
    this.queue.shift();
    this.refresh();
  }

  private refresh(): void {
    const [head, ...waiting] = this.queue;

    if (head && !this.reporting) {
      this.turnHold.hold();
      this.show(head, waiting.length);
    } else {
      this.view.hide();
      this.turnHold.release();
    }
  }

  private show(announced: Announced, pending: number): void {
    if (announced instanceof ArtifactFoundEvent) {
      this.offerRecipients(announced);
      this.view.showFind(announced, pending);
    } else if (announced instanceof MissionReportedEvent) {
      this.view.showMission(announced, pending);
    } else if (announced instanceof GeneralDiedEvent) {
      this.view.showDeath(announced, pending);
    } else if (announced instanceof SuccessionReportedEvent) {
      this.showSuccession(announced, pending);
    } else if (announced instanceof CaptiveJudgedEvent) {
      this.view.showVerdict(announced, pending);
    } else if (announced instanceof AllianceOfferedEvent) {
      this.view.askForAlliance(announced, pending);
    } else {
      this.view.showDesertion(announced, pending);
    }
  }

  private showSuccession(
    succession: SuccessionReportedEvent,
    pending: number,
  ): void {
    const { outcome } = succession;

    if (
      outcome instanceof Coronation &&
      outcome.isChoiceFor(this.context.world.player)
    ) {
      this.offerHeirs(outcome);
      this.view.askForHeir(succession, pending);
    } else {
      this.view.showSuccession(succession, pending);
    }
  }

  private offerHeirs(coronation: Coronation): void {
    const { date } = this.context.world;

    this.controls.recipient.setOptions(
      coronation.heirs.map((heir) =>
        this.buildOption(heir, `age ${heir.getAgeAt(date)}`),
      ),
    );
    this.controls.recipient.setValue(coronation.heir?.name ?? '');
  }

  private offerRecipients(found: ArtifactFoundEvent): void {
    const { characteristic } = found.artifact;

    this.controls.recipient.setOptions(
      this.members.map((member) =>
        this.buildOption(member, String(member.stats.get(characteristic))),
      ),
    );
    this.controls.recipient.setValue(this.defaultRecipient(found).name);
  }

  private buildOption(general: General, note: string): DropdownOption {
    return {
      value: general.name,
      label: general.name,
      icon: getGeneralPortraitUrl(general),
      note,
    };
  }

  private defaultRecipient(found: ArtifactFoundEvent): General {
    const { governor } = found.province;
    const seated =
      governor && this.members.find((member) => member.isEqual(governor));

    return seated ?? this.context.world.player.ruler;
  }

  private findChosen(candidates: readonly General[]): General | undefined {
    const chosen = this.controls.recipient.value;

    return candidates.find((candidate) => candidate.name === chosen);
  }

  private get members(): readonly General[] {
    return this.context.world.player.members;
  }
}
