import { html, type TemplateResult } from 'lit-html';

import type { World } from '@/core/domain/World';
import type {
  DesertionReason,
  UnitDesertedEvent,
} from '@/core/events/UnitDesertedEvent';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';

import { AnnouncementDismissedEvent } from './AnnouncementDismissedEvent';

import styles from './Announcements.module.scss';

const DESERTION_REASONS: Record<DesertionReason, string> = {
  unpaid: 'went unpaid',
  faithless: 'lost faith in your house',
};

interface Announcement {
  readonly text: string;
  readonly icon?: string | undefined;
}

export interface AnnouncementsContext {
  readonly world: World;
  readonly events: EventBus;
}

export class AnnouncementsView extends View<AnnouncementsContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class="${styles.root} ${styles.hidden}">
        <figure class=${styles.scroll}>
          <img class=${styles.icon} data-icon alt="" />
          <figcaption class=${styles.text} data-text></figcaption>
        </figure>
        <footer class=${styles.footer}>
          <span class=${styles.pending} data-pending></span>
          <button
            class=${styles.dismiss}
            type="button"
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
        text: `The ${unit.type} of ${province.name} ${DESERTION_REASONS[reason]} and deserted.`,
        icon: unit.portrait,
      },
      pending,
    );
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private showAnnouncement(announcement: Announcement, pending: number): void {
    this.text.textContent = announcement.text;
    this.showIcon(announcement.icon);
    this.pending.textContent = pending > 0 ? `${pending} more to come` : '';
    this.element.classList.remove(styles.hidden!);
    this.dismissButton.focus();
  }

  private showIcon(icon: string | undefined): void {
    this.icon.classList.toggle(styles.hidden!, icon === undefined);

    if (icon !== undefined) {
      this.icon.src = icon;
    }
  }

  private get icon(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('[data-icon]')!;
  }

  private get text(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-text]')!;
  }

  private get pending(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-pending]')!;
  }

  private get dismissButton(): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>('button')!;
  }
}
