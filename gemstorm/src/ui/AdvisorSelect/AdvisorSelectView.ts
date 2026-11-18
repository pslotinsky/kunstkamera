import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';
import { BackChosenEvent } from '@/ui/Setup/events/BackChosenEvent';
import { BeginChosenEvent } from '@/ui/Setup/events/BeginChosenEvent';
import layout from '@/ui/Setup/SetupScreen.module.scss';

import type { AdvisorSelectViews } from './types';

export class AdvisorSelectView extends View<
  Record<string, never>,
  AdvisorSelectViews
> {
  protected readonly rootClass = layout.root!;

  protected override get rootSelector(): string {
    return '[data-setup-step="advisor"]';
  }

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <section class="${layout.root} ${layout.hidden}" data-setup-step="advisor"
        aria-labelledby="advisor-heading">
        <div class=${layout.frame} aria-hidden="true"></div>
        <div class=${layout.choices}>
          <header class=${layout.header}>
            <h2 id="advisor-heading" class=${layout.heading}>Choose Advisor</h2>
          </header>
          ${views.advisors.template}
          ${views.preview.template}
          <div class=${layout.actions}>
            <button class=${layout.action}
              @click=${() => this.publish(new BackChosenEvent())}>
              Back
            </button>
            <button class=${layout.action}
              @click=${() => this.publish(new BeginChosenEvent())}>
              Begin
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
