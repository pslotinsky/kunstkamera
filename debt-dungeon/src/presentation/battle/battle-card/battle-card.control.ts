import type { SquadId } from '@/domain/battle/battle-squad.entity';
import type { SquadHealth } from '@/domain/battle/squad-health.value-object';
import { Control } from '@/lib/control';
import type { Listener } from '@/lib/signal';

import {
  BattleCardTemplate,
  ElementClass,
  ModifierClass,
  type Params,
} from './battle-card.template';

export class BattleCardControl extends Control<Params> {
  private readonly click = this.signals.create<SquadId>();
  private readonly mouseEnter = this.signals.create<SquadId>();
  private readonly mouseLeave = this.signals.create<SquadId>();

  private readonly elements = this.dom.bindElements({
    healthLabel: ElementClass.HealthLabel,
    healthBar: ElementClass.HealthBar,
    troopsLabel: ElementClass.TroopsLabel,
    commanderHealthLabel: ElementClass.CommanderHealthLabel,
  });

  public get squadId(): SquadId {
    return this.params.squad.id;
  }

  public highlight(): void {
    this.dom.addModifier(ModifierClass.Selected);
  }

  public unhighlight(): void {
    this.dom.removeModifier(ModifierClass.Selected);
  }

  public setCurrent(current: boolean): void {
    this.dom.toggleModifier(ModifierClass.Current, current);
  }

  public allowTarget(allowed: boolean): void {
    this.dom.root.toggleAttribute('inert', !allowed);
  }

  public playHit(after: SquadHealth): Promise<void> {
    this.showHealth(after);
    this.showTroops(after.troops);

    return this.dom.animateClass(ModifierClass.Hit);
  }

  public playDeath(): Promise<void> {
    this.markDefeated();
    return this.dom.animateClass(ModifierClass.Death);
  }

  public onClick(listener: Listener<SquadId>): Listener {
    return this.click.subscribe(listener);
  }

  public onMouseEnter(listener: Listener<SquadId>): Listener {
    return this.mouseEnter.subscribe(listener);
  }

  public onMouseLeave(listener: Listener<SquadId>): Listener {
    return this.mouseLeave.subscribe(listener);
  }

  protected override onAttach(): void {
    this.dom.on('click', () => this.click.emit(this.params.squad.id));
    this.dom.on('mouseenter', () => this.mouseEnter.emit(this.params.squad.id));
    this.dom.on('mouseleave', () => this.mouseLeave.emit(this.params.squad.id));
  }

  protected createTemplate(): BattleCardTemplate {
    return new BattleCardTemplate();
  }

  private showHealth(health: SquadHealth): void {
    const { healthLabel, healthBar, commanderHealthLabel } = this.elements;

    healthLabel.textContent = `${health.current} / ${health.max}`;
    commanderHealthLabel.textContent = `${health.commanderHealth} / ${health.commanderMaxHealth}`;
    const healthPercent =
      health.max > 0 ? (health.current / health.max) * 100 : 0;

    healthBar.style.width = `${healthPercent}%`;
  }

  private showTroops(troops: number): void {
    const { troopsLabel } = this.elements;
    troopsLabel.textContent = String(troops);
  }

  private markDefeated(): void {
    this.unhighlight();
    this.dom.addModifier(ModifierClass.Defeated);
  }
}
