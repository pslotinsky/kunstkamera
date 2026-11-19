import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { NewGameViews } from './types';

export class NewGameScreenView extends View<
  Record<string, never>,
  NewGameViews
> {
  protected readonly rootClass = 'new-game-screen';

  public get template(): TemplateResult {
    return html`<div class="new-game-screen" style="display: contents">
      ${this.views.scenarioSelect.template}
      ${this.views.familySelect.template}
      ${this.views.advisorSelect.template}
    </div>`;
  }
}
