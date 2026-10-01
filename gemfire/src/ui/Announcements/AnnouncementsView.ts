import { html, type TemplateResult } from 'lit-html';

import type { SabotageDamage } from '@/core/domain/Infiltration';
import type { World } from '@/core/domain/World';
import type { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
import type {
  MissionOutcome,
  MissionReportedEvent,
} from '@/core/events/MissionReportedEvent';
import type {
  DesertionReason,
  UnitDesertedEvent,
} from '@/core/events/UnitDesertedEvent';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import type { DropdownControl } from '@/ui/Dropdown/DropdownControl';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';
import { ArtifactTakenEvent } from './ArtifactTakenEvent';

import styles from './Announcements.module.scss';

const DESERTION_REASONS: Record<DesertionReason, string> = {
  unpaid: 'went unpaid',
  faithless: 'lost faith in your family',
};

const SABOTAGE_DAMAGES: Record<SabotageDamage, string> = {
  troops: 'cut down the troops of',
  loyalty: 'turned the people against the lord of',
  protection: 'burned the walls of',
};

interface Announcement {
  readonly text: string;
  readonly icon?: string | undefined;
  readonly detail?: string | undefined;
}

export interface AnnouncementsContext {
  readonly world: World;
  readonly events: EventBus;
}

export type AnnouncementsControls = {
  readonly recipient: DropdownControl;
};

export type AnnouncementsViews = ChildrenViews<AnnouncementsControls>;

export class AnnouncementsView extends View<
  AnnouncementsContext,
  AnnouncementsViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class="${styles.root} ${styles.hidden}">
        <figure class=${styles.scroll}>
          <img class=${styles.icon} data-icon alt="" />
          <div>
            <figcaption class=${styles.text} data-text></figcaption>
            <p class=${styles.detail} data-detail></p>
          </div>
        </figure>
        <div class="${styles.ask} ${styles.hidden}" data-ask>
          <span class=${styles.askLabel}>It goes to</span>
          <div class=${styles.recipient}>${this.views.recipient.template}</div>
          <button
            class="${styles.action} ${styles.take}"
            type="button"
            data-take
            @click=${() => this.publish(new ArtifactTakenEvent())}
          >
            Take
          </button>
        </div>
        <footer class=${styles.footer}>
          <span class=${styles.pending} data-pending></span>
          <button
            class=${styles.action}
            type="button"
            data-continue
            @click=${() => this.publish(new AnnouncementDismissedEvent())}
          >
            Continue
          </button>
        </footer>
      </div>
    `;
  }

  public showDesertion(event: UnitDesertedEvent, pending: number): void {
    const { unit, province, reason } = event;

    this.showAnnouncement(
      {
        text: `The ${unit.name} of ${province.name} ${DESERTION_REASONS[reason]} and deserted.`,
        icon: unit.portrait,
      },
      pending,
    );
    this.askForRecipient(false);
    this.continueButton.focus();
  }

  public showFind(event: ArtifactFoundEvent, pending: number): void {
    const { foundIn, artifact } = event;

    this.showAnnouncement(
      {
        text: `Your spy came back from ${foundIn.name} with the ${artifact.name}.`,
        detail: artifact.effect,
      },
      pending,
    );
    this.askForRecipient(true);
    this.takeButton.focus();
  }

  public showMission(event: MissionReportedEvent, pending: number): void {
    const you = event.province.family?.name ?? '';

    this.showAnnouncement(this.describeMission(event.outcome, you), pending);
    this.askForRecipient(false);
    this.continueButton.focus();
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private describeMission(outcome: MissionOutcome, you: string): Announcement {
    switch (outcome.kind) {
      case 'alliance':
        return {
          text: outcome.accepted
            ? `${outcome.family.name} accepts. Peace holds between ${you} and ${outcome.family.name}.`
            : `${outcome.family.name} will not ally with you.`,
          icon: outcome.family.crest,
        };
      case 'break':
        return {
          text: `The alliance with ${outcome.family.name} is broken.`,
          icon: outcome.family.crest,
        };
      case 'defection':
        return {
          text: this.describeDefection(outcome, you),
          icon: outcome.general.portrait,
        };
      case 'surrender':
        return {
          text: this.describeSurrender(outcome, you),
          icon: outcome.family.crest,
        };
      case 'sabotage':
        return {
          text: outcome.damage
            ? `Your agents ${SABOTAGE_DAMAGES[outcome.damage]} ${outcome.target.name}.`
            : `Your agents were caught in ${outcome.target.name} and wrecked nothing.`,
        };
      case 'plunder':
        return {
          text: outcome.loot
            ? `Your agents plundered ${outcome.target.name}: ${outcome.loot.gold} gold, ${outcome.loot.food} food.`
            : `Your agents were caught in ${outcome.target.name} and came back empty-handed.`,
        };
    }
  }

  private describeDefection(
    outcome: Extract<MissionOutcome, { kind: 'defection' }>,
    you: string,
  ): string {
    const { general, family, province, persuaded } = outcome;

    if (!persuaded) {
      return `${general.name} stays loyal to ${family.name}.`;
    }

    return province
      ? `${general.name} has left ${family.name} for ${you}, and ${province.name} passes to ${you}.`
      : `${general.name} has left ${family.name} for ${you}.`;
  }

  private describeSurrender(
    outcome: Extract<MissionOutcome, { kind: 'surrender' }>,
    you: string,
  ): string {
    const { family, gems, yielded } = outcome;

    if (!yielded) {
      return `${family.name} will not surrender.`;
    }

    return gems.length
      ? `${family.name} yields. ${gems.map((gem) => gem.name).join(' and ')} ${gems.length > 1 ? 'pass' : 'passes'} to ${you}.`
      : `${family.name} yields to ${you}.`;
  }

  private showAnnouncement(announcement: Announcement, pending: number): void {
    this.text.textContent = announcement.text;
    this.detail.textContent = announcement.detail ?? '';
    this.showIcon(announcement.icon);
    this.pending.textContent = pending > 0 ? `${pending} more to come` : '';
    this.element.classList.remove(styles.hidden!);
  }

  private showIcon(icon: string | undefined): void {
    this.icon.classList.toggle(styles.hidden!, icon === undefined);

    if (icon !== undefined) {
      this.icon.src = icon;
    }
  }

  private askForRecipient(asks: boolean): void {
    this.ask.classList.toggle(styles.hidden!, !asks);
    this.continueButton.classList.toggle(styles.hidden!, asks);
  }

  private get icon(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('[data-icon]')!;
  }

  private get text(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-text]')!;
  }

  private get detail(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-detail]')!;
  }

  private get pending(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-pending]')!;
  }

  private get ask(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-ask]')!;
  }

  private get takeButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-take]')!;
  }

  private get continueButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('[data-continue]')!;
  }
}
