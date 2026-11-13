import type { BattleSide } from '@/domain/battle/battle.entity';
import type { BattleArmy } from '@/domain/battle/battle-army.entity';
import { type Html, html, Template, type TemplateParams } from '@/lib/template';

import type { BattleCardControl } from '../battle-card/battle-card.control';

import styles from './battle-roster.module.css';

export type Params = {
  army: BattleArmy;
  side: BattleSide;
};

export type Children = {
  cards: BattleCardControl[];
};

export class BattleRosterTemplate extends Template<Params, Children> {
  protected readonly rootClass: string = styles.battleRoster;

  protected override renderContent({
    children,
  }: TemplateParams<Params, Children>): Html {
    return html`${children.cards.map((card) => card.render())}`;
  }
}
