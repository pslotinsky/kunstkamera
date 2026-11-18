import { html, type TemplateResult } from 'lit-html';

import { View } from '@/lib/View';

import type { ScenarioMapViews } from './types';

import styles from './ScenarioMap.module.scss';

export class ScenarioMapView extends View<
  Record<string, never>,
  ScenarioMapViews
> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    const { views } = this;

    return html`
      <div class=${styles.root}>
        ${views.map.template}
        <div class=${styles.date}>${views.date.template}</div>
        <div class=${styles.title}>
          <p class=${styles.name} data-map-title></p>
          <p class=${styles.caption} data-map-caption></p>
        </div>
      </div>
    `;
  }

  public showTitle(name: string, caption: string): void {
    this.element.querySelector('[data-map-title]')!.textContent = name;
    this.element.querySelector('[data-map-caption]')!.textContent = caption;
  }
}
