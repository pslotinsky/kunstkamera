import type { BattleSide } from '@/domain/battle/battle.entity';
import type { BattleArmy } from '@/domain/battle/battle-army.entity';
import type { SquadId } from '@/domain/battle/battle-squad.entity';
import {
  classNames,
  type Html,
  html,
  Template,
  type TemplateParams,
} from '@/lib/template';

import type { BattleActorSquadControl } from './battle-actor-squad/battle-actor-squad.control';

import styles from './battle-actor.module.css';

export type Params = {
  army: BattleArmy;
  side: BattleSide;
};

export type Children = {
  squads: Record<SquadId, BattleActorSquadControl>;
};

export const ModifierClass = {
  Attacker: styles.battleActor_attacker,
  Defender: styles.battleActor_defender,
  DamageFloating: styles.battleActor__damage_floating,
} as const;

export const ElementClass = {
  Damage: styles.battleActor__damage,
} as const;

export class BattleActorTemplate extends Template<Params, Children> {
  protected readonly rootClass: string = styles.battleActor;

  protected override getRootClass({
    params,
  }: TemplateParams<Params, Children>): string {
    return classNames(
      this.rootClass,
      params.side === 'attacker'
        ? ModifierClass.Attacker
        : ModifierClass.Defender,
    );
  }

  protected override renderContent({
    children,
  }: TemplateParams<Params, Children>): Html {
    return html`
      ${Object.values(children.squads).map((squad) => squad.render())}
      <span class="${ElementClass.Damage}" aria-hidden="true"></span>
    `;
  }
}
