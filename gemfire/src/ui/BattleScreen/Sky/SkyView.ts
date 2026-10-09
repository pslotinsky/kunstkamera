import { html, type TemplateResult } from 'lit-html';

import type { Phase } from '@/core/domain/BattleClock';
import { View } from '@/lib/View';

import styles from './Sky.module.scss';

const FULL_TURN = 360;

const SKIES: Readonly<Record<Phase, string>> = {
  sunrise: styles.sunrise!,
  noon: styles.noon!,
  sunset: styles.sunset!,
  midnight: styles.midnight!,
};

const ORDER: readonly Phase[] = ['sunrise', 'noon', 'sunset', 'midnight'];

const ANGLES: Readonly<Record<Phase, number>> = {
  sunrise: -55,
  noon: 20,
  sunset: 55,
  midnight: 160,
};

export class SkyView extends View {
  protected readonly rootClass = styles.root!;

  private steps = 0;

  public get template(): TemplateResult {
    return html`
      <span class=${styles.root}>
        ${ORDER.map(
          (phase) =>
            html`<span class="${styles.sky} ${SKIES[phase]}" data-sky=${phase}></span>`,
        )}
        <span class=${styles.orbit}>
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
      </span>
    `;
  }

  public showPhase(phase: Phase): void {
    for (const sky of this.skies) {
      sky.classList.toggle(styles.shown!, sky.dataset.sky === phase);
    }

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

  private get skies(): readonly HTMLElement[] {
    return [...this.element.querySelectorAll<HTMLElement>('[data-sky]')];
  }

  private get wheel(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-wheel]')!;
  }
}
