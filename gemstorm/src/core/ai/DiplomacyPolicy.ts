import { AllyCommand } from '@/core/commands/province/AllyCommand';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import { PlunderCommand } from '@/core/commands/province/PlunderCommand';
import { SabotageCommand } from '@/core/commands/province/SabotageCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import { Envoy } from '@/core/domain/Envoy';
import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

const BREAK_ODDS = 0.1;
const PROPOSAL_ODDS = 0.25;
const COVERT_ODDS = 0.15;

type CovertOrder = 'plunder' | 'sabotage' | 'defection';

const COVERT_ORDERS: readonly CovertOrder[] = [
  'plunder',
  'sabotage',
  'defection',
];

export class DiplomacyPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseCommand(province: Province): WorldCommand | undefined {
    const family = province.family;

    if (!family || !province.isHome) {
      return undefined;
    }

    return this.chooseAllianceMove(family) ?? this.chooseCovertOrder(province);
  }

  private chooseAllianceMove(family: Family): WorldCommand | undefined {
    const ally = new AllyCommand(this.context);

    if (family.ally) {
      return Math.random() < BREAK_ODDS ? ally : undefined;
    }

    const partner = this.findPartner(family);

    if (!partner || Math.random() >= PROPOSAL_ODDS) {
      return undefined;
    }

    ally.proposeTo(partner);

    return ally;
  }

  private findPartner(family: Family): Family | undefined {
    const envoy = new Envoy({ world: this.world, family });
    const ownCount = this.world.countProvinces(family);

    return this.findNeighborFamilies(family)
      .filter(
        (rival) =>
          envoy.canAllyWith(rival) &&
          this.world.countProvinces(rival) > ownCount,
      )
      .sort(
        (left, right) =>
          this.world.countProvinces(right) - this.world.countProvinces(left),
      )[0];
  }

  private findNeighborFamilies(family: Family): readonly Family[] {
    const neighbors = this.world
      .getFamilyProvinces(family)
      .flatMap((owned) => this.world.getHostileNeighbors(owned))
      .map((neighbor) => neighbor.family)
      .filter(isDefined);

    return [...new Map(neighbors.map((rival) => [rival.name, rival])).values()];
  }

  private chooseCovertOrder(home: Province): WorldCommand | undefined {
    const targets = this.world.getHostileNeighbors(home);
    const defection = this.chooseDefection(home);

    if (
      (targets.length === 0 && !isDefined(defection)) ||
      Math.random() >= COVERT_ODDS
    ) {
      return undefined;
    }

    const order = targets.length > 0 ? sample(COVERT_ORDERS) : 'defection';

    return order === 'defection'
      ? defection
      : this.chooseInfiltration(order, targets);
  }

  private chooseInfiltration(
    order: CovertOrder,
    targets: readonly Province[],
  ): WorldCommand {
    const richest = [...targets].sort(
      (left, right) => right.resources.gold - left.resources.gold,
    )[0]!;
    const infiltration =
      order === 'plunder'
        ? new PlunderCommand(this.context)
        : new SabotageCommand(this.context);

    infiltration.aimAt(richest);

    return infiltration;
  }

  private chooseDefection(home: Province): WorldCommand | undefined {
    const { family } = home;
    let defection: NegotiateCommand | undefined;

    if (isDefined(family)) {
      const envoy = new Envoy({ world: this.world, family });
      const command = new NegotiateCommand(this.context);
      const targets = this.world.map.provinces
        .filter((target) => family.isHostileTo(target.family))
        .sort((left, right) => right.resources.troops - left.resources.troops);
      const candidate = targets
        .flatMap((target) => command.getCandidates(target))
        .find((general) => envoy.canPersuade(general));

      if (isDefined(candidate)) {
        command.persuade(candidate);
        defection = command;
      }
    }

    return defection;
  }

  private get world(): World {
    return this.context.world;
  }
}
