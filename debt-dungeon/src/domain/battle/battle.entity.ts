import { type Listener, Signal } from '@/lib/signal';
import { assert, assertIsDefined } from '@/lib/utils/assert';
import { uuid } from '@/lib/utils/uuid';

import type { ArmyId, BattleArmy } from './battle-army.entity';
import type { BattleSquad, SquadId } from './battle-squad.entity';
import type { BattleTurn } from './battle-turn.value-object';
import { BattleEndedEvent } from './events/battle-ended.event';
import { SquadAttackedEvent } from './events/squad-attacked.event';
import { SquadDiedEvent } from './events/squad-died.event';
import { TurnStartedEvent } from './events/turn-started.event';
import { TurnOrder } from './turn-order.value-object';

export type BattleId = string;
export type BattleSide = 'attacker' | 'defender';

export enum BattleStatus {
  Pending = 'pending',
  Active = 'active',
  Ended = 'ended',
}

interface Params {
  readonly attacker: BattleArmy;
  readonly defender: BattleArmy;
}

export class Battle {
  public static create(params: Params): Battle {
    const { attacker, defender } = params;

    assert(!attacker.isDefeated, 'Expected a living attacker army');
    assert(!defender.isDefeated, 'Expected a living defender army');

    return new Battle(params);
  }

  public readonly id: BattleId;
  public readonly attacker: BattleArmy;
  public readonly defender: BattleArmy;

  private turnOrder: TurnOrder;
  private battleStatus = BattleStatus.Pending;
  private winningArmyId?: ArmyId;

  private readonly squadAttacked = new Signal<SquadAttackedEvent>();
  private readonly squadDied = new Signal<SquadDiedEvent>();
  private readonly turnStarted = new Signal<TurnStartedEvent>();
  private readonly battleEnded = new Signal<BattleEndedEvent>();

  private constructor(params: Params) {
    this.id = uuid();
    this.attacker = params.attacker;
    this.defender = params.defender;
    this.turnOrder = TurnOrder.create([this.attacker, this.defender]);
  }

  public get currentTurn(): BattleTurn {
    const turn = this.turnOrder.current;

    assertIsDefined(turn, 'Expected an active battle to have a current turn');

    return turn;
  }

  public get turns(): readonly BattleTurn[] {
    return this.turnOrder.order;
  }

  public get status(): BattleStatus {
    return this.battleStatus;
  }

  public get isOver(): boolean {
    return this.status === BattleStatus.Ended;
  }

  public get winnerArmyId(): ArmyId | undefined {
    return this.winningArmyId;
  }

  public get isDraw(): boolean {
    return this.isOver && this.winnerArmyId === undefined;
  }

  public onSquadAttacked(listener: Listener<SquadAttackedEvent>): Listener {
    return this.squadAttacked.subscribe(listener);
  }

  public onSquadDied(listener: Listener<SquadDiedEvent>): Listener {
    return this.squadDied.subscribe(listener);
  }

  public onTurnStarted(listener: Listener<TurnStartedEvent>): Listener {
    return this.turnStarted.subscribe(listener);
  }

  public onBattleEnded(listener: Listener<BattleEndedEvent>): Listener {
    return this.battleEnded.subscribe(listener);
  }

  public start(): void {
    this.assertStatus(BattleStatus.Pending);

    this.battleStatus = BattleStatus.Active;
    this.turnStarted.emit(new TurnStartedEvent(this, this.currentTurn));
  }

  public getAttackTargets(sourceId: SquadId): readonly BattleSquad[] {
    this.assertStatus(BattleStatus.Active);

    const turn = this.currentTurn;

    assert(
      turn.squad.id === sourceId,
      'Expected the source squad to own the current turn',
    );

    const enemy = turn.belongsTo(this.attacker) ? this.defender : this.attacker;

    return enemy.aliveSquads;
  }

  public attack(sourceId: SquadId, targetId: SquadId): void {
    const source = this.getSquad(sourceId);
    const target = this.getSquad(targetId);

    this.assertStatus(BattleStatus.Active);
    this.assertCanAttack(source, target);

    const damage = source.calculateDamage(target);
    const appliedDamage = target.takeDamage(damage);

    this.squadAttacked.emit(
      new SquadAttackedEvent(source, target, appliedDamage),
    );

    if (!target.isAlive) {
      this.turnOrder = this.turnOrder.remove(target.id);
      this.squadDied.emit(new SquadDiedEvent(target));
    }

    this.completeTurn();
  }

  private getSquad(squadId: SquadId): BattleSquad {
    const squad =
      this.attacker.squads.find((squad) => squad.id === squadId) ??
      this.defender.squads.find((squad) => squad.id === squadId);

    assertIsDefined(
      squad,
      'Expected the requested squad to exist in this battle',
    );

    return squad;
  }

  private completeTurn(): void {
    if (this.attacker.isDefeated || this.defender.isDefeated) {
      this.endBattle();
    } else {
      this.turnOrder = this.turnOrder.next();
      this.turnStarted.emit(new TurnStartedEvent(this, this.currentTurn));
    }
  }

  private endBattle(): void {
    this.battleStatus = BattleStatus.Ended;

    if (this.attacker.isDefeated && !this.defender.isDefeated) {
      this.winningArmyId = this.defender.id;
    } else if (!this.attacker.isDefeated && this.defender.isDefeated) {
      this.winningArmyId = this.attacker.id;
    }

    this.battleEnded.emit(new BattleEndedEvent(this.winnerArmyId));
  }

  private assertCanAttack(source: BattleSquad, target: BattleSquad): void {
    const turn = this.currentTurn;

    assert(
      turn.squad.isEqual(source),
      'Expected the source squad to own the current turn',
    );
    assert(source.isAlive, 'Expected a living source squad');
    assert(target.isAlive, 'Expected a living target squad');

    assert(
      this.isAttackTarget(source, target),
      'Expected an eligible attack target',
    );
  }

  private isAttackTarget(source: BattleSquad, target: BattleSquad): boolean {
    const targets = this.getAttackTargets(source.id);

    return targets.some((squad) => squad.isEqual(target));
  }

  private assertStatus(expected: BattleStatus): void {
    assert(
      this.status === expected,
      `Expected battle status ${expected}, got ${this.status}`,
    );
  }
}
