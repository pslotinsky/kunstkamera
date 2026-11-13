import type { BattleSide } from '@/domain/battle/battle.entity';
import type { BattleSquad } from '@/domain/battle/battle-squad.entity';
import type { SquadHealth } from '@/domain/battle/squad-health.value-object';
import {
  classNames,
  type Html,
  html,
  Template,
  type TemplateParams,
} from '@/lib/template';

import styles from './battle-actor-squad.module.css';

const TROOP_SPRITES = 9;
const RANK_SIZE = 3;
const BACK_RANK_INDEX = 0;
const FRONT_RANK_INDEX = RANK_SIZE - 1;

export type Params = {
  squad: BattleSquad;
  side: BattleSide;
};

export const ModifierClass = {
  Visible: styles.battleActorSquad_visible,
  Enter: styles.battleActorSquad_enter,
  Attack: styles.battleActorSquad_attack,
  Hit: styles.battleActorSquad_hit,
  Death: styles.battleActorSquad_death,
  Attacker: styles.battleActorSquad_attacker,
  Defender: styles.battleActorSquad_defender,
  TroopBackRank: styles.battleActorSquad__troop_backRank,
  TroopFrontRank: styles.battleActorSquad__troop_frontRank,
  TroopDead: styles.battleActorSquad__troop_dead,
  TroopDying: styles.battleActorSquad__troop_dying,
} as const;

export const ElementClass = {
  Commander: styles.battleActorSquad__commander,
  Troops: styles.battleActorSquad__troops,
  Troop: styles.battleActorSquad__troop,
} as const;

export class BattleActorSquadTemplate extends Template<Params> {
  public static toSpriteTroopCount(health: SquadHealth): number {
    return health.maxTroops > 0
      ? Math.ceil((health.troops / health.maxTroops) * TROOP_SPRITES)
      : 0;
  }

  protected readonly rootClass: string = styles.battleActorSquad;

  protected override getRootClass({ params }: TemplateParams<Params>): string {
    return classNames(
      this.rootClass,
      params.side === 'attacker'
        ? ModifierClass.Attacker
        : ModifierClass.Defender,
    );
  }

  protected override renderContent({ params }: TemplateParams<Params>): Html {
    const { squad } = params;

    return html`
      <div class="${ElementClass.Troops}">
        ${this.renderTroops(squad)}
      </div>
      <img class="${ElementClass.Commander}" src="${squad.commander.image}" alt="Commander" />
    `;
  }

  private renderTroops(squad: BattleSquad): Html {
    const spriteCount = squad.health.maxTroops > 0 ? TROOP_SPRITES : 0;
    const livingCount = BattleActorSquadTemplate.toSpriteTroopCount(
      squad.health,
    );

    return html`${Array.from(
      { length: spriteCount },
      (_, index) => html`
        <img
          class="${classNames(ElementClass.Troop, {
            [ModifierClass.TroopBackRank]:
              index % RANK_SIZE === BACK_RANK_INDEX,
            [ModifierClass.TroopFrontRank]:
              index % RANK_SIZE === FRONT_RANK_INDEX,
            [ModifierClass.TroopDead]: index >= livingCount,
          })}"
          src="${squad.troop?.image}"
          alt=""
        />
      `,
    )}`;
  }
}
