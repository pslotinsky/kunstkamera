import type { HiredUnit } from '@/core/domain/HiredUnit';
import type { Province } from '@/core/domain/Province';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import { WorldCommand, type WorldCommandContext } from './WorldCommand';

const MIGRATION_MONTHS = [3, 9];
const MIGRATION_CHANCE = 0.6;

export class MigrateMercenariesCommand extends WorldCommand {
  public constructor(context: WorldCommandContext) {
    super('Migrate mercenaries', context);
  }

  public execute(): void {
    const { world } = this.context;

    if (MIGRATION_MONTHS.includes(world.date.month)) {
      this.migrateAvailableMercenaries(world.map.provinces);
    }
  }

  private migrateAvailableMercenaries(provinces: readonly Province[]): void {
    const movedTypes = new Set<string>();
    const updatedProvinces = new Set<Province>();

    for (const province of provinces) {
      const destinations = this.migrateFrom(province, movedTypes);

      if (destinations.length > 0) {
        updatedProvinces.add(province);
        for (const destination of destinations) {
          updatedProvinces.add(destination);
        }
      }
    }

    this.publishUpdates([...updatedProvinces]);
  }

  private migrateFrom(
    province: Province,
    movedTypes: Set<string>,
  ): readonly Province[] {
    const destinations: Province[] = [];

    for (const unit of province.fifthUnits.hirePool) {
      if (unit.category === 'mercenary' && !movedTypes.has(unit.name)) {
        const destination = this.findDestination(province);

        if (isDefined(destination)) {
          this.moveOffer(unit, province, destination);
          movedTypes.add(unit.name);
          destinations.push(destination);
        }
      }
    }

    return destinations;
  }

  private findDestination(province: Province): Province | undefined {
    const { map } = this.context.world;
    const neighbors = map.getNeighbors(province);
    const destinations = neighbors.filter(
      (neighbor) => neighbor.fifthUnits.hasFreeSlot,
    );
    let destination: Province | undefined;

    if (destinations.length > 0) {
      const candidate = sample(destinations);

      if (Math.random() < MIGRATION_CHANCE) {
        destination = candidate;
      }
    }

    return destination;
  }

  private moveOffer(
    unit: HiredUnit,
    source: Province,
    destination: Province,
  ): void {
    source.fifthUnits.removeHireOffer(unit);
    destination.fifthUnits.addHireOffer(unit);
  }
}
