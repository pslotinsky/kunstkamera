import { type Html, html } from './html';

export type TemplateParams<
  TParams = unknown,
  TChildren extends Record<string, unknown> = Record<string, unknown>,
> = {
  controlId: string;
  params: TParams;
  children: TChildren;
};

export abstract class Template<
  TParams = unknown,
  TChildren extends Record<string, unknown> = Record<string, unknown>,
> {
  protected abstract readonly rootClass: string;
  protected readonly tag: keyof HTMLElementTagNameMap = 'div';

  public render(params: TemplateParams<TParams, TChildren>): Html {
    return html`
      <${this.tag} class="${this.getRootClass(params)}" data-control-id="${params.controlId}">
        ${this.renderContent(params)}
      </${this.tag}>
    `;
  }

  protected getRootClass(_params: TemplateParams<TParams, TChildren>): string {
    return this.rootClass;
  }

  protected renderContent(_params: TemplateParams<TParams, TChildren>): Html {
    return html``;
  }
}
