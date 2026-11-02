import type { Battle } from '@/domain/battle/battle.entity';
import {
  classNames,
  type Html,
  html,
  Template,
  type TemplateParams,
} from '@/lib/template';

import styles from './battle-timeline.module.css';

export type Params = {
  battle: Battle;
};

export const ModifierClass = {
  CellLeaving: styles.battleTimeline__cell_leaving,
  CellSelected: styles.battleTimeline__cell_selected,
  CellCurrent: styles.battleTimeline__cell_current,
  CellDefender: styles.battleTimeline__cell_defender,
} as const;

export const ElementClass = {
  Cell: styles.battleTimeline__cell,
  Image: styles.battleTimeline__image,
  Portrait: styles.battleTimeline__portrait,
} as const;

export class BattleTimelineTemplate extends Template<Params> {
  protected readonly rootClass: string = styles.battleTimeline;

  protected override renderContent({ params }: TemplateParams<Params>): Html {
    const { turns } = params.battle;

    return html`${turns.map(
      (turn, index) => html`
        <div
          class="${classNames(ElementClass.Cell, {
            [ModifierClass.CellDefender]: turn.belongsTo(
              params.battle.defender,
            ),
          })}"
          style="--position: ${index}"
          data-squad-id="${turn.squad.id}"
          title="${turn.squad.name}"
        >
          <div class="${ElementClass.Portrait}">
            <img class="${ElementClass.Image}" src="${turn.squad.commander.portrait}" alt="" />
          </div>
        </div>
      `,
    )}`;
  }
}
