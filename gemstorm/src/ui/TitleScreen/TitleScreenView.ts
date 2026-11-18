import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { NewGameChosenEvent } from './events/NewGameChosenEvent';
import { OptionsChosenEvent } from './events/OptionsChosenEvent';
import type { TitleScreenContext, TitleScreenViews } from './types';

import styles from './TitleScreen.module.scss';

export class TitleScreenView extends View<
  TitleScreenContext,
  TitleScreenViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <main class=${styles.root} aria-label="Gemstorm title screen">
        ${views.scene.template}
        <div class=${styles.frame} aria-hidden="true"></div>
        <section class=${styles.menu} aria-labelledby="game-title">
          <h1 id="game-title" class=${styles.title}>Gemstorm</h1>
          <nav class=${styles.nav} aria-label="Main menu">
            <button class=${styles.menuButton} data-new-game
              @click=${() => this.publish(new NewGameChosenEvent())}>
              New Game
            </button>
            <button class=${styles.menuButton}
              @click=${() => this.publish(new OptionsChosenEvent())}>
              Options
            </button>
          </nav>
        </section>
        ${views.options.template}
      </main>
    `;
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  protected override onMount(): void {
    this.element
      .querySelector<HTMLButtonElement>('[data-new-game]')!
      .focus({ preventScroll: true });
  }
}
