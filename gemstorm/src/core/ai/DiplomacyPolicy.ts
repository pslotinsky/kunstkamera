import { AllyCommand } from '@/core/commands/province/AllyCommand';
import { FakeRaidCommand } from '@/core/commands/province/FakeRaidCommand';
import { NegotiateCommand } from '@/core/commands/province/NegotiateCommand';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import type { Family } from '@/core/domain/Family';
import type { General } from '@/core/domain/General';
import type { Province } from '@/core/domain/Province';
import type { World } from '@/core/domain/World';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

const ALLIANCE_PROVINCE_LIMIT = 10;
const BREAK_PROVINCE_MARGIN = 6;
const MINIMUM_NEIGHBOR_FAMILIES = 2;
const PERCENT = 100;
const CHARISMA_PER_PERCENT = 2;
const FAKE_RAID_ODDS = 1 / 9;

export class DiplomacyPolicy {
  private readonly context: WorldCommandContext;

  public constructor(context: WorldCommandContext) {
    this.context = context;
  }

  public chooseCommand(province: Province): WorldCommand | undefined {
    const { family } = province;
    let command: WorldCommand | undefined;

    if (isDefined(family) && province.isHome) {
      command =
        this.chooseAllianceMove(province, family) ??
        this.chooseDefection(family);
    }

    return command;
  }

  public chooseFakeRaid(province: Province): WorldCommand | undefined {
    const isRaiding = Math.random() < FAKE_RAID_ODDS;

    return isRaiding && !province.isEntrusted
      ? new FakeRaidCommand(this.context)
      : undefined;
  }

  private chooseAllianceMove(
    province: Province,
    family: Family,
  ): WorldCommand | undefined {
    const strongest = this.findStrongestNeighbor(province);

    return isDefined(family.ally)
      ? this.chooseBreak(family, family.ally, strongest)
      : this.chooseProposal(family, strongest);
  }

  private chooseProposal(
    family: Family,
    strongest: Family | undefined,
  ): WorldCommand | undefined {
    const isSmall =
      this.world.countProvinces(family) <= ALLIANCE_PROVINCE_LIMIT;
    const canPropose = isSmall && isDefined(strongest);
    const proposal = new AllyCommand(this.context);

    if (canPropose) {
      proposal.proposeTo(strongest);
    }

    return canPropose && proposal.canExecute() ? proposal : undefined;
  }

  private chooseBreak(
    family: Family,
    ally: Family,
    strongest: Family | undefined,
  ): WorldCommand | undefined {
    const owned = this.world.countProvinces(family);
    const allyOwned = this.world.countProvinces(ally);
    const hasOutgrown =
      owned > ALLIANCE_PROVINCE_LIMIT &&
      owned >= allyOwned + BREAK_PROVINCE_MARGIN;
    const isStillStrongest = isDefined(strongest) && strongest.isEqual(ally);

    return hasOutgrown || !isStillStrongest
      ? new AllyCommand(this.context)
      : undefined;
  }

  private findStrongestNeighbor(province: Province): Family | undefined {
    const families = this.findNeighborFamilies(province);
    const candidates = families
      .filter((family) => !family.royal)
      .sort(
        (left, right) =>
          this.world.countProvinces(right) - this.world.countProvinces(left),
      );
    const hasEnoughNeighbors = families.length >= MINIMUM_NEIGHBOR_FAMILIES;

    return hasEnoughNeighbors ? candidates[0] : undefined;
  }

  private findNeighborFamilies(province: Province): readonly Family[] {
    const { family } = province;
    const neighbors = this.world.map
      .getNeighbors(province)
      .map((neighbor) => neighbor.family)
      .filter(isDefined);
    const others = isDefined(family)
      ? neighbors.filter((neighbor) => !neighbor.isEqual(family))
      : [];

    return this.removeRepeats(others);
  }

  private removeRepeats(families: readonly Family[]): readonly Family[] {
    const byName = new Map(families.map((family) => [family.name, family]));

    return [...byName.values()];
  }

  private chooseDefection(family: Family): WorldCommand | undefined {
    const isTrying = this.rollDefection(family);
    const command = new NegotiateCommand(this.context);
    const candidates = isTrying ? this.findDefectionCandidates(command) : [];
    const hasCandidate = candidates.length > 0;

    if (hasCandidate) {
      command.persuade(sample(candidates));
    }

    return hasCandidate ? command : undefined;
  }

  private rollDefection(family: Family): boolean {
    const { charisma } = family.ruler.stats;
    const chance = charisma / CHARISMA_PER_PERCENT;

    return Math.random() * PERCENT < chance;
  }

  private findDefectionCandidates(
    command: NegotiateCommand,
  ): readonly General[] {
    const targets = command.selectableTargets.map((number) =>
      this.world.map.getProvince(number),
    );

    return targets.flatMap((target) => command.getCandidates(target));
  }

  private get world(): World {
    return this.context.world;
  }
}
