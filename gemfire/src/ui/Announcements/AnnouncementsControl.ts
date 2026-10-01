import { GrantArtifactCommand } from '@/core/commands/GrantArtifactCommand';
import type { CharacteristicsKey } from '@/core/domain/Characteristics';
import type { General } from '@/core/domain/General';
import { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import { BattleReportedEvent } from '@/core/events/BattleReportedEvent';
import { MissionReportedEvent } from '@/core/events/MissionReportedEvent';
import { SearchReportedEvent } from '@/core/events/SearchReportedEvent';
import { UnitDesertedEvent } from '@/core/events/UnitDesertedEvent';
import { Control } from '@/lib/Control';
import type { EventClass } from '@/lib/EventBus';
import { BattleReportClosedEvent } from '@/ui/BattleReport/BattleReportClosedEvent';
import { DropdownControl } from '@/ui/Dropdown/DropdownControl';
import type { DropdownOption } from '@/ui/Dropdown/DropdownView';
import { SearchReportClosedEvent } from '@/ui/SearchReport/SearchReportClosedEvent';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';
import {
  type AnnouncementsContext,
  type AnnouncementsControls,
  AnnouncementsView,
} from './AnnouncementsView';
import { ArtifactTakenEvent } from './ArtifactTakenEvent';

type Announced = UnitDesertedEvent | ArtifactFoundEvent | MissionReportedEvent;

export class AnnouncementsControl extends Control<
  AnnouncementsView,
  AnnouncementsControls
> {
  private readonly grantArtifact: GrantArtifactCommand;
  private readonly queue: Announced[] = [];
  private reporting = false;

  public constructor(context: AnnouncementsContext) {
    super(AnnouncementsView, context, {
      recipient: new DropdownControl({ name: 'recipient' }),
    });
    this.grantArtifact = new GrantArtifactCommand(context);
  }

  protected override onMount(): void {
    this.onWorldEvent(UnitDesertedEvent, (event) => this.announce(event));
    this.onWorldEvent(ArtifactFoundEvent, (event) => this.announce(event));
    this.onWorldEvent(MissionReportedEvent, (event) => this.announce(event));
    this.onWorldEvent(SearchReportedEvent, () => this.holdForReport(true));
    this.onWorldEvent(SearchReportClosedEvent, () => this.holdForReport(false));
    this.onWorldEvent(BattleReportedEvent, () => this.holdForReport(true));
    this.onWorldEvent(BattleReportClosedEvent, () => this.holdForReport(false));
    this.subscribe(AnnouncementDismissedEvent, () => this.dismiss());
    this.subscribe(ArtifactTakenEvent, () => this.takeArtifact());
  }

  private onWorldEvent<EventType extends object>(
    eventClass: EventClass<EventType>,
    handler: (event: EventType) => void,
  ): void {
    this.context.events.subscribe(eventClass, handler, this.signal);
  }

  private announce(event: Announced): void {
    if (event.province.belongsTo(this.context.world.player)) {
      this.queue.push(event);
      this.refresh();
    }
  }

  private holdForReport(reporting: boolean): void {
    this.reporting = reporting;
    this.refresh();
  }

  private takeArtifact(): void {
    const found = this.queue[0];
    const recipient = this.findRecipient();

    if (found instanceof ArtifactFoundEvent && recipient) {
      this.grantArtifact.grant(found.artifact, recipient);
      this.grantArtifact.execute();
      this.dismiss();
    }
  }

  private dismiss(): void {
    this.queue.shift();
    this.refresh();
  }

  private refresh(): void {
    const [head, ...waiting] = this.queue;

    if (head && !this.reporting) {
      this.show(head, waiting.length);
    } else {
      this.view.hide();
    }
  }

  private show(announced: Announced, pending: number): void {
    if (announced instanceof ArtifactFoundEvent) {
      this.offerRecipients(announced);
      this.view.showFind(announced, pending);
    } else if (announced instanceof MissionReportedEvent) {
      this.view.showMission(announced, pending);
    } else {
      this.view.showDesertion(announced, pending);
    }
  }

  private offerRecipients(found: ArtifactFoundEvent): void {
    const { characteristic } = found.artifact;

    this.controls.recipient.setOptions(
      this.members.map((member) => this.buildOption(member, characteristic)),
    );
    this.controls.recipient.setValue(this.defaultRecipient(found).name);
  }

  private buildOption(
    member: General,
    characteristic: CharacteristicsKey,
  ): DropdownOption {
    return {
      value: member.name,
      label: member.name,
      icon: member.portrait,
      note: String(member.stats.get(characteristic)),
    };
  }

  private defaultRecipient(found: ArtifactFoundEvent): General {
    const { governor } = found.province;
    const seated =
      governor && this.members.find((member) => member.isEqual(governor));

    return seated ?? this.context.world.player.ruler;
  }

  private findRecipient(): General | undefined {
    const chosen = this.controls.recipient.value;

    return this.members.find((member) => member.name === chosen);
  }

  private get members(): readonly General[] {
    return this.context.world.player.members;
  }
}
