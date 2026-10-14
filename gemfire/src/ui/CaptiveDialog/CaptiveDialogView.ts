import { html, type TemplateResult } from 'lit-html';

import type { Captive } from '@/core/domain/Captive';
import type { Disposal, DisposalOutcome } from '@/core/domain/Captivity';
import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getGeneralPortraitUrl } from '@/ui/art/getGeneralPortraitUrl';

import { CaptiveDismissedEvent } from './CaptiveDismissedEvent';
import { DisposalChosenEvent } from './DisposalChosenEvent';

import styles from './CaptiveDialog.module.scss';

const OUTCOMES: Record<DisposalOutcome, (name: string) => string> = {
  joined: (name) => `${name} joins your house`,
  refused: (name) => `${name} refuses to join you`,
  released: (name) => `${name} is sent home`,
  banished: (name) => `${name} is banished from Ishmeria`,
};

const DISPOSALS: readonly { kind: Disposal; label: string }[] = [
  { kind: 'recruit', label: 'Recruit — take him into your house' },
  { kind: 'release', label: 'Release — send him home the weaker for it' },
  { kind: 'banish', label: 'Banish — out of Ishmeria, for good' },
];

export interface CaptiveDialogContext {
  readonly world: World;
  readonly events: EventBus;
}

export class CaptiveDialogView extends View<CaptiveDialogContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}" data-overlay>
        <h2 class=${styles.title} data-title></h2>
        <img class=${styles.portrait} data-portrait alt="" />
        <p class=${styles.captive} data-captive></p>
        <div class=${styles.choices} data-choices></div>
      </section>
    `;
  }

  public showDisposals(captive: Captive): void {
    this.show(captive, `${captive.general.name} is your prisoner`);
    this.choices.replaceChildren(
      ...DISPOSALS.map(({ kind, label }) =>
        this.renderChoice(label, () =>
          this.publish(new DisposalChosenEvent(kind)),
        ),
      ),
    );
  }

  public showOutcome(captive: Captive, outcome: DisposalOutcome): void {
    this.show(captive, OUTCOMES[outcome](captive.general.name));
    this.choices.replaceChildren(
      this.renderChoice('Close', () =>
        this.publish(new CaptiveDismissedEvent()),
      ),
    );
  }

  private show(captive: Captive, title: string): void {
    const { war, charisma } = captive.general.stats;

    this.title.textContent = title;
    this.captive.textContent = `${captive.general.name} of ${captive.house.name} — WAR ${war}, CHA ${charisma}`;
    this.portrait.src = getGeneralPortraitUrl(captive.general);
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private get portrait(): HTMLImageElement {
    return this.element.querySelector<HTMLImageElement>('[data-portrait]')!;
  }

  private renderChoice(label: string, chosen: () => void): HTMLButtonElement {
    const button = document.createElement('button');

    button.type = 'button';
    button.className = styles.choice!;
    button.dataset.choice = label;
    button.textContent = label;
    button.addEventListener('click', chosen);

    return button;
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get captive(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-captive]')!;
  }

  private get choices(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-choices]')!;
  }
}
