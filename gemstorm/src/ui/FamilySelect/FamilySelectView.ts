import { html, type TemplateResult } from 'lit-html';

import type { Scenario } from '@/config/scenarios';
import { View } from '@/lib/View';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { NextChosenEvent } from '@/ui/Setup/events/NextChosenEvent';

import type { FamilySelectViews } from './types';

import styles from './FamilySelect.module.scss';

export class FamilySelectView extends View<
  Record<string, never>,
  FamilySelectViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <section class="${styles.root} ${styles.hidden}"
        aria-labelledby="family-heading">
        <div class=${styles.frame} aria-hidden="true"></div>
        <div class=${styles.choices}>
          <header class=${styles.header}>
            <h2 id="family-heading" class=${styles.heading}>Choose Family</h2>
            <p class=${styles.subtitle} data-scenario-name></p>
          </header>
          ${views.houses.template}
          ${views.ruler.template}
          <div class=${styles.actions}>
            <button class=${styles.action}
              @click=${() => this.publish(new BackChosenEvent())}>
              Back
            </button>
            <button class=${styles.action}
              @click=${() => this.publish(new NextChosenEvent())}>
              Next
            </button>
          </div>
        </div>
        <div class=${styles.map}>${views.mapPreview.template}</div>
      </section>
    `;
  }

  public show(): void {
    this.element.classList.remove(styles.hidden!);
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  public showScenario(scenario: Scenario): void {
    this.element.querySelector('[data-scenario-name]')!.textContent =
      `${scenario.name} · Year ${scenario.year}`;
  }
}
