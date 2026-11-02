import type { SquadId } from '@/domain/battle/battle-squad.entity';
import type { SquadHealth } from '@/domain/battle/squad-health.value-object';
import { Control } from '@/lib/control';

import {
  BattleActorTemplate,
  type Children,
  ElementClass,
  ModifierClass,
  type Params,
} from './battle-actor.template';
import { BattleActorSquadControl } from './battle-actor-squad/battle-actor-squad.control';

export class BattleActorControl extends Control<Params, Children> {
  private readonly elements = this.dom.bindElements({
    damage: ElementClass.Damage,
  });
  private selectedSquad?: BattleActorSquadControl;

  public select(squadId: SquadId): void {
    const squad = this.children.tree.squads[squadId];

    if (squad && squad !== this.selectedSquad) {
      this.selectedSquad?.hide();
      squad.show();
      this.selectedSquad = squad;
    }
  }

  public deselect(): void {
    this.selectedSquad?.hide();
    this.selectedSquad = undefined;
  }

  public async playEnter(squadId: SquadId): Promise<void> {
    if (this.selectedSquad?.squadId !== squadId) {
      this.select(squadId);
      await this.children.tree.squads[squadId].playEnter();
    }
  }

  public playAttack(squadId: SquadId): Promise<void> {
    const squad = this.children.tree.squads[squadId];

    this.select(squadId);

    return squad.playAttack();
  }

  public async playHit(
    squadId: SquadId,
    after: SquadHealth,
    damage: number,
  ): Promise<void> {
    this.select(squadId);

    await Promise.all([
      this.children.tree.squads[squadId].playHit(after),
      this.playDamage(damage),
    ]);
  }

  public async playDeath(squadId: SquadId): Promise<void> {
    this.select(squadId);

    await this.children.tree.squads[squadId].playDeath();

    this.deselect();
  }

  protected createTemplate(): BattleActorTemplate {
    return new BattleActorTemplate();
  }

  protected override createChildren({ army, side }: Params): Children {
    const squads: Children['squads'] = {};

    for (const squad of army.squads) {
      squads[squad.id] = new BattleActorSquadControl({ squad, side });
    }

    return { squads };
  }

  protected override onDetach(): void {
    this.selectedSquad = undefined;
  }

  private playDamage(damage: number): Promise<void> {
    this.elements.damage.textContent = `-${damage}`;

    return this.dom.animateClass(
      ModifierClass.DamageFloating,
      this.elements.damage,
    );
  }
}
