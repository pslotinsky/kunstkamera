import { html, type TemplateResult } from 'lit-html';

import type { Captive } from '@/core/domain/Captive';
import type { Disposal } from '@/core/domain/Captivity';
import type { Ransom, RansomCurrency } from '@/core/domain/Ransom';
import type { World } from '@/core/domain/World';
import type { CaptiveJudgedEvent } from '@/core/events/CaptiveJudgedEvent';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getGeneralPortraitUrl } from '@/ui/common/art/getGeneralPortraitUrl';

import { CaptiveDismissedEvent } from './CaptiveDismissedEvent';
import { DisposalChosenEvent } from './DisposalChosenEvent';
import { RansomAnsweredEvent } from './RansomAnsweredEvent';
import { RansomCurrencyChosenEvent } from './RansomCurrencyChosenEvent';

import styles from './CaptiveDialog.module.scss';

type CaptiveOutcome = CaptiveJudgedEvent['outcome'];

const OUTCOMES: Record<CaptiveOutcome, (name: string) => string> = {
  joined: (name) => `${name} joins your house`,
  released: (name) => `${name} is sent home`,
  banished: (name) => `${name} is banished from Aureth`,
  ransomed: (name) => `${name} returns to court after payment`,
};

const DISPOSALS: readonly { kind: Disposal; label: string }[] = [
  { kind: 'recruit', label: 'Recruit — take him into your house' },
  { kind: 'release', label: 'Release — send him home' },
  { kind: 'banish', label: 'Banish — out of Aureth, for good' },
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

  public showDisposals(
    captive: Captive,
    canRecruit: boolean,
    title = `${captive.general.name} is your prisoner`,
  ): void {
    this.show(captive, title);
    this.choices.replaceChildren(
      ...DISPOSALS.map(({ kind, label }) => {
        const choice = this.renderChoice(label, () =>
          this.publish(new DisposalChosenEvent(kind)),
        );

        choice.disabled = kind === 'recruit' && !canRecruit;

        return choice;
      }),
    );
  }

  public showRansomDemand(captive: Captive, ransom: Ransom): void {
    this.show(captive, `Choose a ransom for ${captive.general.name}`);
    const gold = this.renderChoice(`Demand ${ransom.gold} Gold`, () =>
      this.publish(new RansomCurrencyChosenEvent('gold')),
    );
    const food = this.renderChoice(`Demand ${ransom.food} Food`, () =>
      this.publish(new RansomCurrencyChosenEvent('food')),
    );

    this.choices.replaceChildren(gold, food);
  }

  public showRansomAnswer(
    captive: Captive,
    currency: RansomCurrency,
    amount: number,
    canPay: boolean,
  ): void {
    const resource = currency === 'gold' ? 'Gold' : 'Food';
    this.show(captive, `${captive.captor.name} demands ${amount} ${resource}`);
    const pay = this.renderChoice(`Pay ${amount} ${resource}`, () =>
      this.publish(new RansomAnsweredEvent(true)),
    );
    const decline = this.renderChoice('Refuse', () =>
      this.publish(new RansomAnsweredEvent(false)),
    );

    pay.disabled = !canPay;
    this.choices.replaceChildren(pay, decline);
  }

  public showOutcome(captive: Captive, outcome: CaptiveOutcome): void {
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
