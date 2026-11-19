import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import { MuteChangedEvent } from './events/MuteChangedEvent';
import { OptionsClosedEvent } from './events/OptionsClosedEvent';
import type { OptionsContext, OptionsViews } from './types';

import styles from './Options.module.scss';

export class OptionsView extends View<OptionsContext, OptionsViews> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;
    const { master } = this.context.sounds;

    return html`
      <dialog class=${styles.root} aria-labelledby="options-heading"
        @close=${() => this.publish(new OptionsClosedEvent())}>
        <h2 id="options-heading" class=${styles.heading}>Options</h2>
        <label class=${styles.masterToggle}>
          <span>All sounds</span>
          <input type="checkbox" class=${styles.checkbox}
            ?checked=${master.isEnabled}
            @change=${(event: Event) => this.changeMute(event)} />
        </label>
        ${views.music.template}
        ${views.sfx.template}
        <form method="dialog">
          <button class=${styles.back}>Back</button>
        </form>
      </dialog>
    `;
  }

  public show(): void {
    this.dialog.showModal();
  }

  private changeMute(event: Event): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      const muted = !event.currentTarget.checked;

      this.publish(new MuteChangedEvent(muted));
    }
  }

  private get dialog(): HTMLDialogElement {
    return this.element as HTMLDialogElement;
  }
}
