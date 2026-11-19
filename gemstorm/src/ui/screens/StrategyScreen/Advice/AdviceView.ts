import { html, type TemplateResult } from 'lit-html';

import type { Advice } from '@/core/domain/Advice';
import type { Advisor } from '@/core/domain/Advisor';
import type { World } from '@/core/domain/World';
import type { EventBus } from '@/lib/EventBus';
import { View } from '@/lib/View';
import { getAdvisorPortraitUrl } from '@/ui/common/art/getAdvisorPortraitUrl';

import { AdviceDismissedEvent } from './events/AdviceDismissedEvent';

import styles from './Advice.module.scss';

export interface AdviceContext {
  readonly world: World;
  readonly events: EventBus;
}

export class AdviceView extends View<AdviceContext> {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <section class="${styles.root} ${styles.hidden}" data-overlay
        role="dialog" aria-modal="true" aria-labelledby="advice-heading">
        <img class=${styles.portrait} data-portrait alt="" />
        <div class=${styles.body}>
          <h2 id="advice-heading" class=${styles.heading}>
            <span data-advisor-name></span>
            <span class=${styles.title} data-advisor-title></span>
          </h2>
          <p class=${styles.line} data-line></p>
          <div class=${styles.actions}>
            <button type="button" class=${styles.action} data-close
              @click=${() => this.publish(new AdviceDismissedEvent())}>
              Close
            </button>
          </div>
        </div>
      </section>
    `;
  }

  public show(advisor: Advisor, advice: Advice): void {
    const line = advisor.lines[advice.meaning].replace(
      '{target}',
      advice.target?.name ?? '',
    );

    this.query<HTMLImageElement>('[data-portrait]').src =
      getAdvisorPortraitUrl(advisor);
    this.query('[data-advisor-name]').textContent = advisor.name;
    this.query('[data-advisor-title]').textContent = advisor.title;
    this.query('[data-line]').textContent = `“${line}”`;
    this.element.classList.remove(styles.hidden!);
    this.query('[data-close]').focus();
  }

  public hide(): void {
    this.element.classList.add(styles.hidden!);
  }

  protected override onMount(): void {
    this.element.addEventListener(
      'keydown',
      (event) => {
        if (event.key === 'Escape') {
          this.publish(new AdviceDismissedEvent());
        }
      },
      { signal: this.lifetime.signal },
    );
  }

  private query<ElementType extends Element = HTMLElement>(
    selector: string,
  ): ElementType {
    return this.element.querySelector<ElementType>(selector)!;
  }
}
