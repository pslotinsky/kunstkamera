import type { Battle } from '@/domain/battle/battle.entity';
import { type Html, html, Template, type TemplateParams } from '@/lib/template';

import type { BattleSideControl } from './battle-side/battle-side.control';
import type { BattleTimelineControl } from './battle-timeline/battle-timeline.control';

import styles from './battle.module.css';

export type Params = {
  battle: Battle;
};

export type Children = {
  timeline: BattleTimelineControl;
  attacker: BattleSideControl;
  defender: BattleSideControl;
};

export const ElementClass = {
  Timeline: styles.battle__timeline,
  Sides: styles.battle__sides,
} as const;

export class BattleTemplate extends Template<Params, Children> {
  protected readonly rootClass: string = styles.battle;

  protected override renderContent({
    children,
  }: TemplateParams<Params, Children>): Html {
    return html`
      <div class="${ElementClass.Timeline}">${children.timeline.render()}</div>
      <div class="${ElementClass.Sides}">
        ${children.attacker.render()}
        ${children.defender.render()}
      </div>
    `;
  }
}
