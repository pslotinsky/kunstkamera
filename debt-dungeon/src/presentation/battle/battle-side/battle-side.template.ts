import type { BattleSide } from '@/domain/battle/battle.entity';
import type { BattleArmy } from '@/domain/battle/battle-army.entity';
import {
  classNames,
  type Html,
  html,
  Template,
  type TemplateParams,
} from '@/lib/template';

import type { BattleActorControl } from '../battle-actor/battle-actor.control';
import type { BattleRosterControl } from '../battle-roster/battle-roster.control';

import styles from './battle-side.module.css';

export type Params = {
  army: BattleArmy;
  side: BattleSide;
};

export type Children = {
  actor: BattleActorControl;
  roster: BattleRosterControl;
};

export const ElementClass = {
  Scene: styles.battleSide__scene,
  Panel: styles.battleSide__panel,
} as const;

export const ModifierClass = {
  PanelAttacker: styles.battleSide__panel_attacker,
  PanelDefender: styles.battleSide__panel_defender,
} as const;

export class BattleSideTemplate extends Template<Params, Children> {
  protected readonly rootClass: string = styles.battleSide;

  protected override renderContent({
    params,
    children,
  }: TemplateParams<Params, Children>): Html {
    const panelModifier =
      params.side === 'attacker'
        ? ModifierClass.PanelAttacker
        : ModifierClass.PanelDefender;

    return html`
      <div class="${ElementClass.Scene}">${children.actor.render()}</div>
      <div class="${classNames(ElementClass.Panel, panelModifier)}">
        ${children.roster.render()}
      </div>
    `;
  }
}
