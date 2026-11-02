import type { ArmyId } from '@/domain/battle/battle-army.entity';
import type { SquadId } from '@/domain/battle/battle-squad.entity';
import { AttackCommand } from '@/domain/battle/commands/attack.command';
import { Control } from '@/lib/control';
import type { Command } from '@/lib/domain/command';
import type { Listener } from '@/lib/signal';

import { BattleResizer } from './battle.resizer';
import { BattleTemplate, type Children, type Params } from './battle.template';
import { BattleSideControl } from './battle-side/battle-side.control';
import { BattleTimelineControl } from './battle-timeline/battle-timeline.control';

export class BattleControl extends Control<Params, Children> {
  private readonly resizer = new BattleResizer(this.dom);
  private readonly action = this.signals.create<Command>();
  private targetIds: readonly SquadId[] = [];

  public onAction(listener: Listener<Command>): Listener {
    return this.action.subscribe(listener);
  }

  public get timeline(): BattleTimelineControl {
    return this.children.tree.timeline;
  }

  public getSideByArmy(armyId: ArmyId): BattleSideControl {
    if (armyId === this.params.battle.attacker.id) {
      return this.children.tree.attacker;
    }

    if (armyId === this.params.battle.defender.id) {
      return this.children.tree.defender;
    }

    throw new Error(`Unknown battle army: ${armyId}`);
  }

  public getSideBySquad(squadId: SquadId): BattleSideControl {
    const { attacker, defender } = this.children.tree;

    if (attacker.hasSquad(squadId)) {
      return attacker;
    }

    if (defender.hasSquad(squadId)) {
      return defender;
    }

    throw new Error(`Unknown battle squad: ${squadId}`);
  }

  public enableInput(): void {
    const { attacker, defender } = this.children.tree;

    for (const side of [attacker, defender]) {
      side.roster.enableInput(this.targetIds);
    }
    this.dom.root.removeAttribute('inert');
  }

  public disableInput(): void {
    this.dom.root.setAttribute('inert', '');
    const { attacker, defender } = this.children.tree;

    attacker.roster.disableInput();
    defender.roster.disableInput();
  }

  public async showTurn(
    armyId: ArmyId,
    squadId: SquadId,
    targetIds: readonly SquadId[],
  ): Promise<void> {
    this.targetIds = targetIds;
    const { attacker, defender } = this.children.tree;

    for (const side of [attacker, defender]) {
      side.unfocus();
      side.roster.setCurrent(squadId);
    }

    const side = this.getSideByArmy(armyId);
    side.actor.select(squadId);
    await this.timeline.showTurn(squadId);
  }

  public showResult(): void {
    this.timeline.clearCurrentTurn();
    const { attacker, defender } = this.children.tree;

    for (const side of [attacker, defender]) {
      side.roster.setCurrent();
    }
  }

  protected createTemplate(): BattleTemplate {
    return new BattleTemplate();
  }

  protected override createChildren({ battle }: Params): Children {
    return {
      timeline: new BattleTimelineControl({ battle }),
      attacker: new BattleSideControl({
        army: battle.attacker,
        side: 'attacker',
      }),
      defender: new BattleSideControl({
        army: battle.defender,
        side: 'defender',
      }),
    };
  }

  protected override onAttach(): void {
    this.resizer.start();
    this.disableInput();

    const { attacker, defender } = this.children.tree;

    for (const side of [attacker, defender]) {
      side.onSquadFocused((squadId) => this.timeline.select(squadId));
      side.onSquadUnfocused((squadId) => this.timeline.deselect(squadId));
      side.onSquadSelected((targetId) => this.attack(targetId));
    }
  }

  protected override onDetach(): void {
    this.resizer.stop();
  }

  private attack(targetId: SquadId): void {
    const turn = this.params.battle.currentTurn;
    const command = new AttackCommand({
      sourceId: turn.squad.id,
      targetId,
    });
    this.action.emit(command);
  }
}
