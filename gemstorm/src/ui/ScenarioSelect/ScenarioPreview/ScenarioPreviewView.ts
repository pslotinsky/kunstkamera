import { html, type TemplateResult } from 'lit-html';

import type { Scenario } from '@/config/scenarios';
import { View } from '@/lib/View';

import styles from './ScenarioPreview.module.scss';

export class ScenarioPreviewView extends View {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <p class=${styles.description} data-description></p>
      </div>
    `;
  }

  public showScenario(scenario: Scenario): void {
    this.element.querySelector('[data-description]')!.textContent =
      scenario.description;
  }
}
