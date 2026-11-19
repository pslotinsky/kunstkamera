import { html, type TemplateResult } from 'lit-html';

import type { Family } from '@/core/domain/Family';
import { View } from '@/lib/View';
import { getGeneralPortraitUrl } from '@/ui/common/art/getGeneralPortraitUrl';

import styles from './RulerPreview.module.scss';

export class RulerPreviewView extends View {
  protected readonly rootClass = styles.root!;

  public get template(): TemplateResult {
    return html`
      <div class=${styles.root}>
        <img class=${styles.portrait} data-portrait alt="" />
        <div class=${styles.facts}>
          <span class=${styles.name} data-ruler-name></span>
          <span class=${styles.age} data-age></span>
          <dl class=${styles.stats}>
            <dt class=${styles.statName}>INT</dt>
            <dd class=${styles.statValue} data-intelligence></dd>
            <dt class=${styles.statName}>WAR</dt>
            <dd class=${styles.statValue} data-war></dd>
            <dt class=${styles.statName}>CHA</dt>
            <dd class=${styles.statValue} data-charisma></dd>
          </dl>
          <span class=${styles.vassals} data-vassals></span>
        </div>
      </div>
    `;
  }

  public showRuler(family: Family, rulerAge: number): void {
    const { ruler } = family;

    this.query<HTMLImageElement>('[data-portrait]').src =
      getGeneralPortraitUrl(ruler);
    this.query('[data-ruler-name]').textContent = ruler.name;
    this.query('[data-age]').textContent = `Age ${rulerAge}`;
    this.query('[data-intelligence]').textContent = String(
      ruler.stats.intelligence,
    );
    this.query('[data-war]').textContent = String(ruler.stats.war);
    this.query('[data-charisma]').textContent = String(ruler.stats.charisma);
    this.query('[data-vassals]').textContent =
      `${family.vassals.length} vassals`;
  }

  private query<ElementType extends Element = HTMLElement>(
    selector: string,
  ): ElementType {
    return this.element.querySelector<ElementType>(selector)!;
  }
}
