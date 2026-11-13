import type { SquadId } from '@/domain/battle/battle-squad.entity';
import type { SquadHealth } from '@/domain/battle/squad-health.value-object';
import { Control } from '@/lib/control';

import {
  BattleActorSquadTemplate,
  ElementClass,
  ModifierClass,
  type Params,
} from './battle-actor-squad.template';

export class BattleActorSquadControl extends Control<Params> {
  private readonly elements = this.dom.bindElements({
    troops: ElementClass.Troops,
  });

  public get squadId(): SquadId {
    return this.params.squad.id;
  }

  public show(): void {
    this.dom.addModifier(ModifierClass.Visible);
  }

  public hide(): void {
    this.dom.removeModifier(ModifierClass.Visible);
  }

  public playEnter(): Promise<void> {
    return this.dom.animateClass(ModifierClass.Enter);
  }

  public playAttack(): Promise<void> {
    return this.dom.animateClass(ModifierClass.Attack);
  }

  public async playHit(after: SquadHealth): Promise<void> {
    await this.dom.animateClass(ModifierClass.Hit);

    if (after.isAlive) {
      const livingCount = BattleActorSquadTemplate.toSpriteTroopCount(after);
      const fallen = Array.from(this.elements.troops.children)
        .slice(livingCount)
        .filter((troop) => !troop.classList.contains(ModifierClass.TroopDead));

      await Promise.all(fallen.map((troop) => this.playTroopDeath(troop)));
    }
  }

  public playDeath(): Promise<void> {
    return this.dom.animateClass(ModifierClass.Death);
  }

  protected override onDetach(): void {
    this.hide();
  }

  protected createTemplate(): BattleActorSquadTemplate {
    return new BattleActorSquadTemplate();
  }

  private async playTroopDeath(troop: Element): Promise<void> {
    await this.dom.animateClass(ModifierClass.TroopDying, troop);
    troop.classList.add(ModifierClass.TroopDead);
  }
}
