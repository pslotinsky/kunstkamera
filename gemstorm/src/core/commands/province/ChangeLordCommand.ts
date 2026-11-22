import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import { ProvinceUpdatedEvent } from '@/core/events/ProvinceUpdatedEvent';
import { isDefined } from '@/lib/value/isDefined';

import { ProvinceCommand, type WorldCommandContext } from '../ProvinceCommand';

type LordChange = RecallLord | AppointLord | SwapGovernors;

type RecallLord = {
  readonly kind: 'recall';
  readonly target: Province;
};

type AppointLord = {
  readonly kind: 'appoint';
  readonly target: Province;
  readonly lord: General;
};

type SwapGovernors = {
  readonly kind: 'swap';
  readonly target: Province;
  readonly source: Province;
};

export class ChangeLordCommand extends ProvinceCommand {
  private change: LordChange | undefined;

  public constructor(context: WorldCommandContext) {
    super('Change Lord', context);
  }

  public assignLord(target: Province, lord: General): void {
    this.change = { kind: 'appoint', target, lord };
  }

  public ruleDirectly(target: Province): void {
    this.change = { kind: 'recall', target };
  }

  public swapGovernors(target: Province, source: Province): void {
    this.change = { kind: 'swap', target, source };
  }

  public override canExecute(): boolean {
    return this.currentProvince?.isHome ?? false;
  }

  public override get selectableTargets(): readonly number[] {
    const family = this.currentProvince?.family;

    return isDefined(family) && this.canExecute()
      ? this.context.world
          .getFamilyProvinces(family)
          .filter((province) => !province.isHome)
          .map((province) => province.number)
      : [];
  }

  public override consumesTurn(): boolean {
    const { change } = this;
    const family = this.currentProvince?.family;

    return (
      isDefined(family) &&
      this.canExecute() &&
      change?.kind === 'swap' &&
      change.source.isHome &&
      this.canSwap(change.target, change.source, family)
    );
  }

  public execute(): void {
    const { change } = this;
    const family = this.currentProvince?.family;

    if (
      isDefined(change) &&
      isDefined(family) &&
      this.canChange(change.target, family)
    ) {
      this.applyChange(change, family);
    }
  }

  private canChange(target: Province, family: Family): boolean {
    return this.canExecute() && target.belongsTo(family) && !target.isHome;
  }

  private canSwap(target: Province, source: Province, family: Family): boolean {
    return (
      this.canChange(target, family) &&
      source.belongsTo(family) &&
      !source.isEqual(target)
    );
  }

  private applyChange(change: LordChange, family: Family): void {
    const { target } = change;

    switch (change.kind) {
      case 'recall':
        this.recallLord(target, family);
        break;
      case 'appoint':
        this.appointVassal(target, change.lord, family);
        break;
      case 'swap':
        this.swapGovernorsIfAllowed(target, change.source, family);
        break;
    }
  }

  private recallLord(target: Province, family: Family): void {
    if (target.hasLord) {
      target.assignGovernor(family.ruler);
      target.cancelEntrust();
      this.complete(target);
    }
  }

  private appointVassal(target: Province, lord: General, family: Family): void {
    const { world } = this.context;

    if (world.getVassals(family).includes(lord) && !world.isHeld(lord)) {
      target.assignGovernor(lord);
      this.complete(target);
    }
  }

  private swapGovernorsIfAllowed(
    target: Province,
    source: Province,
    family: Family,
  ): void {
    if (this.canSwap(target, source, family)) {
      this.applyGovernorSwap(target, source, family);
    }
  }

  private applyGovernorSwap(
    target: Province,
    source: Province,
    family: Family,
  ): void {
    const displaced = target.governor ?? family.ruler;
    const incoming = source.governor ?? family.ruler;
    const movesRuler = source.isHome;

    if (movesRuler) {
      family.moveHome(target);
      source.assignGovernor(displaced);
      this.recordAction();
    } else {
      target.assignGovernor(incoming);
      source.assignGovernor(displaced);
    }

    this.publish(new ProvinceUpdatedEvent(source));
    this.publish(new ProvinceUpdatedEvent(target));
  }
}
