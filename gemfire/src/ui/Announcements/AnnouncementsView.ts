import { html, type TemplateResult } from 'lit-html';

import type { World } from '@/core/domain/World';
import type { ArtifactFoundEvent } from '@/core/events/ArtifactFoundEvent';
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
  faithless: 'lost faith in your house',
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

  public hide(): void {
    this.element.classList.add(styles.hidden!);
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
