import { html, type TemplateResult } from 'lit-html';

import type { Advisor } from '@/core/domain/Advisor';
import { View } from '@/lib/View';
import { getAdvisorPortraitUrl } from '@/ui/common/art/getAdvisorPortraitUrl';

import styles from './AdvisorPreview.module.scss';

export class AdvisorPreviewView extends View {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <img class=${styles.portrait} data-portrait alt="" />
        <div class=${styles.facts}>
          <span class=${styles.name} data-advisor-name></span>
          <span class=${styles.title} data-advisor-title></span>
          <p class=${styles.saying} data-saying></p>
        </div>
      </div>
    `;
  }

  public showAdvisor(advisor: Advisor): void {
    this.query<HTMLImageElement>('[data-portrait]').src =
      getAdvisorPortraitUrl(advisor);
    this.query('[data-advisor-name]').textContent = advisor.name;
    this.query('[data-advisor-title]').textContent = advisor.title;
    this.query('[data-saying]').textContent = `“${advisor.saying}”`;
  }

  private query<ElementType extends Element = HTMLElement>(
    selector: string,
  ): ElementType {
    return this.element.querySelector<ElementType>(selector)!;
  }
}
