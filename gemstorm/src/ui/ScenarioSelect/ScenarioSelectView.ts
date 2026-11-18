import { html, type TemplateResult } from 'lit-html';

import type { Scenario } from '@/config/scenarios';
import { View } from '@/lib/View';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { NextChosenEvent } from '@/ui/Setup/events/NextChosenEvent';

import { ScenarioSelectedEvent } from './events/ScenarioSelectedEvent';
import type { ScenarioSelectContext, ScenarioSelectViews } from './types';

import styles from './ScenarioSelect.module.scss';

export class ScenarioSelectView extends View<
  ScenarioSelectContext,
  ScenarioSelectViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <section class="${styles.root} ${styles.hidden}"
        aria-labelledby="scenario-heading">
        <div class=${styles.frame} aria-hidden="true"></div>
        <div class=${styles.choices}>
          <header class=${styles.header}>
            <h2 id="scenario-heading" class=${styles.heading}>
              Choose Scenario
            </h2>
          </header>
          <ol class=${styles.list}>
            ${this.context.scenarios.map((scenario) =>
              this.renderScenario(scenario),
            )}
          </ol>
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

  public showSelected(selected: Scenario): void {
    for (const button of this.scenarioButtons) {
      const isSelected = button.dataset.scenario === String(selected.number);

      button.classList.toggle(styles.selected!, isSelected);
      button.setAttribute('aria-pressed', String(isSelected));
    }
  }

  private renderScenario(scenario: Scenario): TemplateResult {
    return html`
      <li>
        <button class=${styles.scenario} data-scenario=${scenario.number}
          aria-pressed="false"
          @click=${() => this.publish(new ScenarioSelectedEvent(scenario))}>
          <span class=${styles.name}>${scenario.name}</span>
          <span class=${styles.year}>Year ${scenario.year}</span>
          <span class=${styles.description}>${scenario.description}</span>
        </button>
      </li>
    `;
  }

  private get scenarioButtons(): readonly HTMLButtonElement[] {
    return [
      ...this.element.querySelectorAll<HTMLButtonElement>('[data-scenario]'),
    ];
  }
}
