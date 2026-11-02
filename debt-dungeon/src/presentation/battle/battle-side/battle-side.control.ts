import type { SquadId } from '@/domain/battle/battle-squad.entity';
import { Control } from '@/lib/control';
import type { Listener } from '@/lib/signal';

import { BattleActorControl } from '../battle-actor/battle-actor.control';
import { BattleRosterControl } from '../battle-roster/battle-roster.control';
import {
  BattleSideTemplate,
  type Children,
  type Params,
} from './battle-side.template';

export class BattleSideControl extends Control<Params, Children> {
  public get actor(): BattleActorControl {
    return this.children.tree.actor;
  }

  public get roster(): BattleRosterControl {
    return this.children.tree.roster;
  }

  public hasSquad(squadId: SquadId): boolean {
    return this.roster.hasSquad(squadId);
  }

  public unfocus(): void {
    this.roster.unfocus();
  }

  public onSquadSelected(listener: Listener<SquadId>): Listener {
    return this.roster.onSquadSelected(listener);
  }

  public onSquadFocused(listener: Listener<SquadId>): Listener {
    return this.roster.onSquadFocused(listener);
  }

  public onSquadUnfocused(listener: Listener<SquadId>): Listener {
    return this.roster.onSquadUnfocused(listener);
  }

  protected createTemplate(): BattleSideTemplate {
    return new BattleSideTemplate();
  }

  protected override createChildren({ army, side }: Params): Children {
    return {
      actor: new BattleActorControl({ army, side }),
      roster: new BattleRosterControl({ army, side }),
    };
  }

  protected override onAttach(): void {
    this.roster.onSquadFocused((squadId) => this.actor.select(squadId));
  }
}
