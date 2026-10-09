import { html, type TemplateResult } from 'lit-html';

import { CommandDialogView } from './CommandDialogView';

interface DevelopDialogContext {
  readonly name: string;
}

export class DevelopDialogView extends CommandDialogView<DevelopDialogContext> {
  protected renderBody(): TemplateResult {
    return html``;
  }
}
