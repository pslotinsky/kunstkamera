import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { NextChosenEvent } from '@/ui/Setup/events/NextChosenEvent';
import layout from '@/ui/Setup/SetupScreen.module.scss';

import type { ScenarioSelectContext, ScenarioSelectViews } from './types';

export class ScenarioSelectView extends View<
  ScenarioSelectContext,
  ScenarioSelectViews
> {
  protected readonly rootClass = layout.root!;

  protected override get rootSelector(): string {
    return '[data-setup-step="scenario"]';
  }

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <section class="${layout.root} ${layout.hidden}" data-setup-step="scenario"
        aria-labelledby="scenario-heading">
        <div class=${layout.frame} aria-hidden="true"></div>
        <div class=${layout.choices}>
          <header class=${layout.header}>
            <h2 id="scenario-heading" class=${layout.heading}>
              Choose Scenario
            </h2>
          </header>
          ${views.scenarios.template}
          ${views.preview.template}
          <div class=${layout.actions}>
            <button class=${layout.action}
              @click=${() => this.publish(new BackChosenEvent())}>
              Back
            </button>
            <button class=${layout.action}
              @click=${() => this.publish(new NextChosenEvent())}>
              Next
            </button>
          </div>
        </div>
        <div class=${layout.map}>${views.map.template}</div>
      </section>
    `;
  }

  public show(): void {
    this.element.classList.remove(layout.hidden!);
  }

  public hide(): void {
    this.element.classList.add(layout.hidden!);
  }
}
