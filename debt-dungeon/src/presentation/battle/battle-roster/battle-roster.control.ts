import type { SquadId } from '@/domain/battle/battle-squad.entity';
import type { SquadHealth } from '@/domain/battle/squad-health.value-object';
import { Control } from '@/lib/control';
import type { Listener } from '@/lib/signal';
import { Subscriptions } from '@/lib/subscriptions';
import { assertIsDefined } from '@/lib/utils/assert';

import { BattleCardControl } from '../battle-card/battle-card.control';
import {
  BattleRosterTemplate,
  type Children,
  type Params,
} from './battle-roster.template';

export class BattleRosterControl extends Control<Params, Children> {
  private readonly squadFocused = this.signals.create<SquadId>();
  private readonly squadUnfocused = this.signals.create<SquadId>();
  private focusedSquadId?: SquadId;

  public hasSquad(squadId: SquadId): boolean {
    return this.cards.some((card) => card.squadId === squadId);
  }

  public enableInput(targetIds: readonly SquadId[]): void {
    for (const card of this.cards) {
      card.allowTarget(targetIds.includes(card.squadId));
    }

    this.dom.root.removeAttribute('inert');
  }

  public disableInput(): void {
    this.dom.root.setAttribute('inert', '');
    this.unfocus();
  }

  public playHit(squadId: SquadId, after: SquadHealth): Promise<void> {
    const card = this.getCard(squadId);
    return card.playHit(after);
  }

  public playDeath(squadId: SquadId): Promise<void> {
    if (this.focusedSquadId === squadId) {
      this.unfocus();
    }

    const card = this.getCard(squadId);
    return card.playDeath();
  }

  public setCurrent(squadId?: SquadId): void {
    for (const card of this.cards) {
      card.setCurrent(card.squadId === squadId);
    }
  }

  public focus(squadId: SquadId): void {
    const card = this.getCard(squadId);

    if (this.focusedSquadId !== squadId) {
      this.unfocus();
      this.focusedSquadId = squadId;
      card.highlight();
      this.squadFocused.emit(squadId);
    }
  }

  public unfocus(): void {
    const squadId = this.focusedSquadId;

    if (squadId) {
      this.focusedSquadId = undefined;
      this.getCard(squadId).unhighlight();
      this.squadUnfocused.emit(squadId);
    }
  }

  public onSquadSelected(listener: Listener<SquadId>): Listener {
    const subscriptions = new Subscriptions();

    for (const card of this.cards) {
      subscriptions.add(card.onClick(listener));
    }

    return () => subscriptions.clear();
  }

  public onSquadFocused(listener: Listener<SquadId>): Listener {
    return this.squadFocused.subscribe(listener);
  }

  public onSquadUnfocused(listener: Listener<SquadId>): Listener {
    return this.squadUnfocused.subscribe(listener);
  }

  protected override onAttach(): void {
    for (const card of this.cards) {
      card.onMouseEnter((squadId) => this.focus(squadId));
      card.onMouseLeave((squadId) => {
        if (this.focusedSquadId === squadId) {
          this.unfocus();
        }
      });
    }
  }

  protected override onDetach(): void {
    this.focusedSquadId = undefined;
  }

  protected createTemplate(): BattleRosterTemplate {
    return new BattleRosterTemplate();
  }

  protected override createChildren(params: Params): Children {
    const cards = params.army.squads.map(
      (squad) => new BattleCardControl({ squad, side: params.side }),
    );

    return { cards };
  }

  private get cards(): readonly BattleCardControl[] {
    return this.children.tree.cards;
  }

  private getCard(squadId: SquadId): BattleCardControl {
    const card = this.cards.find((card) => card.squadId === squadId);

    assertIsDefined(card, `Expected squad ${squadId} to belong to this roster`);

    return card;
  }
}
