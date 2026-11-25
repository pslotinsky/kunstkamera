import { html, type TemplateResult } from 'lit-html';

import type { SaveSlot, SlotNumber } from '@/core/saves/GameSaves';
import type { SaveSummary } from '@/core/saves/SavedGame';
import { View } from '@/lib/View';
import { isDefined } from '@/lib/value/isDefined';
import { getFamilyCrestUrl } from '@/ui/common/art/getFamilyCrestUrl';
import { hideBrokenImage } from '@/ui/common/art/hideBrokenImage';
import { OptionsChosenEvent } from '@/ui/common/Options/events/OptionsChosenEvent';

import { ContinueChosenEvent } from './events/ContinueChosenEvent';
import { LoadConfirmedEvent } from './events/LoadConfirmedEvent';
import { LoadGameChosenEvent } from './events/LoadGameChosenEvent';
import { LoadPickerClosedEvent } from './events/LoadPickerClosedEvent';
import { NewGameChosenEvent } from './events/NewGameChosenEvent';
import type { TitleScreenContext, TitleScreenViews } from './types';

import styles from './TitleScreen.module.scss';

const STORAGE_UNAVAILABLE = 'Saved games are unavailable in this browser.';

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
            <button class="${styles.menuButton} ${styles.continueButton}" data-continue hidden
              @click=${() => this.publish(new ContinueChosenEvent())}>
              <span class=${styles.continueText}>
                <span>Continue</span>
                <span class=${styles.continueDetails} data-continue-details></span>
              </span>
              <img class=${styles.continueCrest} data-continue-crest alt=""
                @error=${hideBrokenImage} />
            </button>
            <button class=${styles.menuButton} data-new-game
              @click=${() => this.publish(new NewGameChosenEvent())}>
              New Game
            </button>
            <button class=${styles.menuButton} data-load-game hidden
              @click=${() => this.publish(new LoadGameChosenEvent())}>
              Load Game
            </button>
            <button class=${styles.menuButton}
              @click=${() => this.publish(new OptionsChosenEvent())}>
              Options
            </button>
          </nav>
          <p class=${styles.status} role="status" data-title-message></p>
        </section>
        <dialog class=${styles.dialog} aria-labelledby="load-game-heading" data-load-picker
          @close=${() => this.handleLoadPickerClose()}>
          <h2 id="load-game-heading" class=${styles.heading}>Load Game</h2>
          ${views.saveSlots.template}
          ${views.saveDetails.template}
          <p class=${styles.loadMessage} role="status" data-load-message></p>
          <div class=${styles.actions}>
            <button class=${styles.action} data-load-back
              @click=${() => this.closeLoadPicker()}>Back</button>
            <button class=${styles.action} data-confirm-load disabled
              @click=${() => this.publish(new LoadConfirmedEvent())}>Load</button>
          </div>
        </dialog>
        ${views.options.template}
      </main>
    `;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public get isVisible(): boolean {
    return !this.element.classList.contains(styles.hidden!);
  }

  public showSaves(slots: readonly SaveSlot[], newest?: SaveSummary): void {
    const hasSaves = slots.some(
      ({ status }) => status !== 'empty' && status !== 'unavailable',
    );
    const isBlocked = slots.some(({ status }) => status === 'unavailable');

    this.button('[data-continue]').hidden = !isDefined(newest);
    this.button('[data-load-game]').hidden = !hasSaves;
    this.showTitleMessage(isBlocked ? STORAGE_UNAVAILABLE : '');

    if (isDefined(newest)) {
      this.showContinueSummary(newest);
    }
  }

  public focusMainMenu(): void {
    const resume = this.button('[data-continue]');
    const button = resume.hidden ? this.button('[data-new-game]') : resume;

    button.focus({ preventScroll: true });
  }

  public showTitleMessage(message: string): void {
    this.find('[data-title-message]').textContent = message;
  }

  public showLoadPicker(
    slots: readonly SaveSlot[],
    selected?: SlotNumber,
  ): void {
    this.updateLoadPicker(slots, selected);
    this.dialog.showModal();

    if (!this.views.saveSlots.focus(selected)) {
      this.button('[data-load-back]').focus();
    }
  }

  public updateLoadPicker(
    slots: readonly SaveSlot[],
    selected?: SlotNumber,
  ): void {
    const slot = slots.find(({ number }) => number === selected);

    this.views.saveSlots.show(slots, selected);
    this.views.saveDetails.show(slot);
    this.button('[data-confirm-load]').disabled = slot?.status !== 'ready';
    this.showLoadMessage('');
  }

  public closeLoadPicker(): void {
    this.dialog.close();
  }

  public showLoadMessage(message: string): void {
    this.find('[data-load-message]').textContent = message;
  }

  private showContinueSummary({ family, date }: SaveSummary): void {
    const crest = this.element.querySelector<HTMLImageElement>(
      '[data-continue-crest]',
    )!;

    crest.hidden = false;
    crest.src = getFamilyCrestUrl({ name: family });
    this.find('[data-continue-details]').textContent = `${family} · ${date}`;
    this.button('[data-continue]').ariaLabel =
      `Continue: House ${family}, ${date}`;
  }

  private handleLoadPickerClose(): void {
    if (this.isVisible) {
      this.button('[data-load-game]').focus();
    }

    this.publish(new LoadPickerClosedEvent());
  }

  private get dialog(): HTMLDialogElement {
    return this.element.querySelector<HTMLDialogElement>('[data-load-picker]')!;
  }

  private button(selector: string): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(selector)!;
  }

  private find(selector: string): HTMLElement {
    return this.element.querySelector<HTMLElement>(selector)!;
  }
}
