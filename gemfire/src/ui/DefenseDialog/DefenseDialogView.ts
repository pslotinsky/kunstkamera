import { html, type TemplateResult } from 'lit-html';

import type { DefenderAnswer } from '@/core/domain/DefensePolicy';
import type { Invasion } from '@/core/domain/Invasion';
import type { World } from '@/core/domain/World';
import type { ChildrenViews } from '@/lib/Control';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import type { DropdownControl } from '@/ui/Dropdown/DropdownControl';

import { AnswerChosenEvent } from './AnswerChosenEvent';
import { RefugeCancelledEvent } from './RefugeCancelledEvent';
import { RefugeConfirmedEvent } from './RefugeConfirmedEvent';

import styles from './DefenseDialog.module.scss';

const ANSWERS: readonly { answer: DefenderAnswer; label: string }[] = [
  { answer: 'fight', label: 'Fight' },
  { answer: 'retreat', label: 'Retreat' },
  { answer: 'surrender', label: 'Surrender' },
];

export interface DefenseDialogContext {
  readonly world: World;
  readonly events: EventBus;
}

export type DefenseDialogControls = {
  readonly unit: DropdownControl;
  readonly refuge: DropdownControl;
};

export type DefenseDialogViews = ChildrenViews<DefenseDialogControls>;

export class DefenseDialogView extends View<
  DefenseDialogContext,
  DefenseDialogViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}" data-overlay>
        <h2 class=${styles.title} data-title></h2>
        <p class=${styles.line} data-attacker></p>
        <p class=${styles.line} data-garrison></p>
        <div class=${styles.part} data-answering>
          <label class=${styles.field}>
            <span class=${styles.label}>Fifth Unit</span>
            <span class=${styles.picker}>${this.views.unit.template}</span>
          </label>
          <div class=${styles.answers}>
            ${ANSWERS.map(
              ({ answer, label }) => html`
                <button
                  class=${styles.answer}
                  type="button"
                  data-answer=${answer}
                  @click=${() => this.publish(new AnswerChosenEvent(answer))}
                >
                  ${label}
                </button>
              `,
            )}
          </div>
        </div>
        <div class="${styles.part} ${styles.hidden}" data-fleeing>
          <label class=${styles.field}>
            <span class=${styles.label}>Flee to</span>
            <span class=${styles.picker}>${this.views.refuge.template}</span>
          </label>
          <div class=${styles.answers}>
            <button
              class=${styles.answer}
              type="button"
              data-back
              @click=${() => this.publish(new RefugeCancelledEvent())}
            >
              Back
            </button>
            <button
              class=${styles.answer}
              type="button"
              data-flee
              @click=${() => this.publish(new RefugeConfirmedEvent())}
            >
              Flee
            </button>
          </div>
        </div>
      </section>
    `;
  }

  public askForAnswer(invasion: Invasion): void {
    const { attacker, source, target } = invasion;
    const { troops, food } = target.resources;
    const house = source.family?.name ?? '';

    this.title.textContent = `${target.name} is attacked`;
    this.attacker.textContent = `${attacker.commander.name} of ${house} marches from ${source.name} with ${attacker.troops} troops.`;
    this.garrison.textContent = `${target.name}: ${troops} troops, ${food} food.`;

    for (const button of this.answerButtons) {
      const answer = button.dataset.answer as DefenderAnswer;

      button.disabled = !invasion.answers.includes(answer);
    }

    this.showPart('answering');
    this.element.classList.remove(styles.hidden!);
  }

  public askForRefuge(): void {
    this.showPart('fleeing');
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  private showPart(part: 'answering' | 'fleeing'): void {
    this.answering.classList.toggle(styles.hidden!, part !== 'answering');
    this.fleeing.classList.toggle(styles.hidden!, part !== 'fleeing');
  }

  private get title(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-title]')!;
  }

  private get attacker(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-attacker]')!;
  }

  private get garrison(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-garrison]')!;
  }

  private get answering(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-answering]')!;
  }

  private get fleeing(): HTMLElement {
    return this.element.querySelector<HTMLElement>('[data-fleeing]')!;
  }

  private get answerButtons(): readonly HTMLButtonElement[] {
    return [
      ...this.element.querySelectorAll<HTMLButtonElement>('[data-answer]'),
    ];
  }
}
