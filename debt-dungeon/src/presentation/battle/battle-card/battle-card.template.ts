import type { BattleSide } from '@/domain/battle/battle.entity';
import type { BattleSquad } from '@/domain/battle/battle-squad.entity';
import {
  classNames,
  type Html,
  html,
  Template,
  type TemplateParams,
} from '@/lib/template';

import styles from './battle-card.module.css';

export type Params = {
  squad: BattleSquad;
  side: BattleSide;
};

export const ModifierClass = {
  Selected: styles.battleCard_selected,
  Current: styles.battleCard_current,
  Defeated: styles.battleCard_defeated,
  Hit: styles.battleCard_hit,
  Death: styles.battleCard_death,
  Attacker: styles.battleCard_attacker,
  Defender: styles.battleCard_defender,
} as const;

export const ElementClass = {
  SquadType: styles.battleCard__squadType,
  SquadImage: styles.battleCard__squadImage,
  HealthLabel: styles.battleCard__healthValue,
  HealthBar: styles.battleCard__health,
  HealthTrack: styles.battleCard__healthTrack,
  TroopsLabel: styles.battleCard__squadTroops,
  Portrait: styles.battleCard__portrait,
  Info: styles.battleCard__info,
  Heading: styles.battleCard__heading,
  UnitIcon: styles.battleCard__unitIcon,
  Composition: styles.battleCard__composition,
  CommanderHealthLabel: styles.battleCard__commanderHealth,
} as const;

export class BattleCardTemplate extends Template<Params> {
  protected readonly rootClass: string = styles.battleCard;

  protected override getRootClass({ params }: TemplateParams<Params>): string {
    return classNames(this.rootClass, {
      [ModifierClass.Defeated]: !params.squad.isAlive,
      [ModifierClass.Attacker]: params.side === 'attacker',
      [ModifierClass.Defender]: params.side === 'defender',
    });
  }

  protected override renderContent({ params }: TemplateParams<Params>): Html {
    const { squad } = params;
    const { health } = squad;
    const healthPercent =
      health.max > 0 ? (health.current / health.max) * 100 : 0;

    return html`
      <div class="${ElementClass.Portrait}">
        <img class="${ElementClass.SquadImage}" src="${squad.commander.portrait}" alt="" />
      </div>
      <div class="${ElementClass.Info}">
        <div class="${ElementClass.Heading}">
          <strong class="${ElementClass.SquadType}">${squad.name}</strong>
          <img class="${ElementClass.UnitIcon}" src="${(squad.troop ?? squad.commander).icon}" alt="" />
        </div>
        <div class="${ElementClass.HealthLabel}">${health.current} / ${health.max}</div>
        <div class="${ElementClass.HealthTrack}">
          <div class="${ElementClass.HealthBar}" style="width: ${healthPercent}%"></div>
        </div>
        <div class="${ElementClass.Composition}">
          <span><span class="${ElementClass.TroopsLabel}">${health.troops}</span> soldiers</span>
          <span>Commander <span class="${ElementClass.CommanderHealthLabel}">${health.commanderHealth} / ${health.commanderMaxHealth}</span></span>
        </div>
      </div>
    `;
  }
}
