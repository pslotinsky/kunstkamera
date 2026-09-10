import { html, type TemplateResult } from 'lit-html';

import type { Phase } from '@/core/domain/BattleClock';
import { View } from '@/lib/View';

import styles from './Sky.module.scss';

const FULL_TURN = 360;

const HOURS: Readonly<Record<Phase, string>> = {
  sunrise: styles.sunrise!,
  noon: styles.noon!,
  sunset: styles.sunset!,
  midnight: styles.midnight!,
};

const ORDER: readonly Phase[] = ['sunrise', 'noon', 'sunset', 'midnight'];

const ANGLES: Readonly<Record<Phase, number>> = {
  sunrise: -60,
  noon: 0,
  sunset: 60,
  midnight: 180,
};

export class SkyView extends View {
  protected readonly rootClass = styles.root!;

  private steps = 0;

  public get template(): TemplateResult {
    return html`
      <span class=${styles.root}>
        <span class=${styles.wheel} data-wheel>
          <img
            class="${styles.body} ${styles.sun}"
            src="/sky/sun.webp"
            alt=""
          />
          <img
            class="${styles.body} ${styles.moon}"
            src="/sky/moon.webp"
            alt=""
          />
        </span>
      </span>
    `;
  }

  public showPhase(phase: Phase): void {
    this.element.className = `${styles.root!} ${HOURS[phase]}`;
    this.turnTo(phase);
  }

  private turnTo(phase: Phase): void {
    while (ORDER[this.steps % ORDER.length] !== phase) {
      this.steps += 1;
    }

    const days = Math.floor(this.steps / ORDER.length);
    const turn = days * FULL_TURN + ANGLES[phase];

    this.wheel.style.setProperty('--turn', `${turn}deg`);
  }

  private get wheel(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-wheel]')!;
  }
}
