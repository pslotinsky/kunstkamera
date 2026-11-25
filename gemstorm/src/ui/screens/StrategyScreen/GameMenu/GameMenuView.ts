import { html, type TemplateResult } from 'lit-html';

import type { SaveSlot, SlotNumber } from '@/core/saves/GameSaves';
import { View } from '@/lib/View';
import { isDefined } from '@/lib/value/isDefined';
import { OptionsChosenEvent } from '@/ui/common/Options/events/OptionsChosenEvent';

import { MenuBackEvent } from './events/MenuBackEvent';
import { MenuClosedEvent } from './events/MenuClosedEvent';
import { QuitChosenEvent } from './events/QuitChosenEvent';
import { QuitConfirmedEvent } from './events/QuitConfirmedEvent';
import { ReplaceConfirmedEvent } from './events/ReplaceConfirmedEvent';
import { SaveGameChosenEvent } from './events/SaveGameChosenEvent';
import type { GameMenuContext, GameMenuViews } from './types';

import styles from './GameMenu.module.scss';

const PAGE_HEADINGS = {
  choices: 'Menu',
  slots: 'Save Game',
  replace: 'Replace saved game?',
  confirm: 'Quit to Title',
};

export type MenuPage = keyof typeof PAGE_HEADINGS;

const SAVED_TOAST_MS = 2600;

type ChoiceFocus = 'resume' | 'save';

export class GameMenuView extends View<GameMenuContext, GameMenuViews> {
  protected readonly rootClass = styles.root!;

  private shown: MenuPage = 'choices';
  private savedToastTimer: ReturnType<typeof setTimeout> | undefined;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <dialog class=${styles.dialog} aria-labelledby="game-menu-heading"
          @cancel=${(event: Event) => this.handleCancel(event)}
          @close=${() => this.publish(new MenuClosedEvent())}>
          <h2 id="game-menu-heading" class=${styles.heading}>Menu</h2>
          <nav class=${styles.choices} aria-label="Game menu" data-choices data-menu-page="choices">
            <button class=${styles.choice} type="button" data-resume
              @click=${() => this.close()}>
              Resume
            </button>
            <button class=${styles.choice} type="button" data-save disabled
              aria-describedby="save-block-reason"
              @click=${() => this.publish(new SaveGameChosenEvent())}>
              Save Game
            </button>
            <p class=${styles.reason} id="save-block-reason" hidden></p>
            <button class=${styles.choice} type="button"
              @click=${() => this.publish(new OptionsChosenEvent())}>
              Options
            </button>
            <button class=${styles.choice} type="button"
              @click=${() => this.publish(new QuitChosenEvent())}>
              Quit to Title
            </button>
          </nav>
          <section class=${styles.hidden} data-menu-page="slots">
            ${this.views.saveSlots.template}
            <div class=${styles.actions}>
              <button class=${styles.action} type="button" data-back
                @click=${() => this.publish(new MenuBackEvent())}>
                Back
              </button>
            </div>
          </section>
          <section class=${styles.hidden} data-menu-page="replace">
            ${this.views.saveDetails.template}
            <div class=${styles.actions}>
              <button class=${styles.action} type="button" data-cancel
                @click=${() => this.publish(new MenuBackEvent())}>
                Cancel
              </button>
              <button class=${styles.action} type="button"
                @click=${() => this.publish(new ReplaceConfirmedEvent())}>
                Replace
              </button>
            </div>
          </section>
          <section class=${styles.hidden} data-confirm data-menu-page="confirm">
            <p class=${styles.warning}>
              Return to the title? Unsaved progress will be lost.
            </p>
            <div class=${styles.actions}>
              <button class=${styles.action} type="button" data-stay
                @click=${() => this.publish(new MenuBackEvent())}>
                Stay
              </button>
              <button class=${styles.action} type="button"
                @click=${() => this.publish(new QuitConfirmedEvent())}>
                Quit
              </button>
            </div>
          </section>
          <p class=${styles.message} role="status" data-save-message></p>
        </dialog>
        <p class=${styles.toast} role="status" data-save-toast></p>
        ${this.views.options.template}
      </div>
    `;
  }

  public get isOpen(): boolean {
    return this.dialog.open;
  }

  public get page(): MenuPage {
    return this.shown;
  }

  public open(saveBlockReason?: string): void {
    const reason = this.find('#save-block-reason');

    reason.hidden = !isDefined(saveBlockReason);
    reason.textContent = saveBlockReason ?? '';
    this.button('[data-save]').disabled = isDefined(saveBlockReason);
    this.dialog.showModal();
    this.showChoices('resume');
  }

  public close(): void {
    this.dialog.close();
  }

  public showChoices(focus: ChoiceFocus): void {
    this.showPage('choices', `[data-${focus}]`);
  }

  public askToConfirm(): void {
    this.showPage('confirm', '[data-stay]');
  }

  public showSlots(slots: readonly SaveSlot[], focused?: SlotNumber): void {
    this.views.saveSlots.show(slots);
    this.showPage('slots');

    if (!this.views.saveSlots.focus(focused)) {
      this.button('[data-back]').focus();
    }
  }

  public askToReplace(slot: SaveSlot): void {
    this.views.saveDetails.show(slot);
    this.showPage('replace', '[data-cancel]');
  }

  public finishSave(slot: SlotNumber): void {
    this.close();
    this.showToast(`Game saved to Slot ${slot}`);
  }

  protected override onUnmount(): void {
    clearTimeout(this.savedToastTimer);
  }

  private showToast(message: string): void {
    const toast = this.find('[data-save-toast]');

    clearTimeout(this.savedToastTimer);
    toast.textContent = message;
    this.restartAnimation(toast);
    this.savedToastTimer = setTimeout(() => this.hideToast(), SAVED_TOAST_MS);
  }

  private restartAnimation(toast: HTMLElement): void {
    toast.classList.remove(styles.shown!);
    void toast.offsetWidth;
    toast.classList.add(styles.shown!);
  }

  private hideToast(): void {
    const toast = this.find('[data-save-toast]');

    toast.classList.remove(styles.shown!);
    toast.textContent = '';
  }

  public showSaveMessage(message: string): void {
    this.find('[data-save-message]').textContent = message;
  }

  private showPage(page: MenuPage, focus?: string): void {
    const sections =
      this.element.querySelectorAll<HTMLElement>('[data-menu-page]');

    this.shown = page;
    this.find('#game-menu-heading').textContent = PAGE_HEADINGS[page];

    for (const section of sections) {
      section.classList.toggle(
        styles.hidden!,
        section.dataset.menuPage !== page,
      );
    }

    this.showSaveMessage('');

    if (isDefined(focus)) {
      this.button(focus).focus();
    }
  }

  private handleCancel(event: Event): void {
    if (this.shown !== 'choices') {
      event.preventDefault();
      this.publish(new MenuBackEvent());
    }
  }

  private button(selector: string): HTMLButtonElement {
    return this.element.querySelector<HTMLButtonElement>(selector)!;
  }

  private find(selector: string): HTMLElement {
    return this.element.querySelector<HTMLElement>(selector)!;
  }

  private get dialog(): HTMLDialogElement {
    return this.element.querySelector<HTMLDialogElement>(`.${styles.dialog}`)!;
  }
}
