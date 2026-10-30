import { isDefined } from '@/lib/value/isDefined';

import { Captive } from './Captive';
import type { Family } from './Family';
import type { General } from './General';
import type { InvasionReport } from './InvasionReport';
import type { Province } from './Province';
import type { World } from './World';

const CAPTURE_ODDS = 0.35;
const CORNERED_ODDS = 0.95;

interface Loser {
  readonly general: General;
  readonly house: Family;
  readonly captor: Family;
  readonly seat: Province;
}

export interface ConquestParams {
  readonly world: World;
  readonly source: Province;
  readonly report: InvasionReport;
}

export class Conquest {
  private readonly world: World;
  private readonly source: Province;
  private readonly report: InvasionReport;

  public constructor(params: ConquestParams) {
    this.world = params.world;
    this.source = params.source;
    this.report = params.report;
  }

  public takeCaptive(): Captive | undefined {
    const loser = this.findLoser();

    if (!loser || !this.isCaught(loser)) {
      return undefined;
    }

    const captive = new Captive(loser);

    return captive.ransom.spendFrom(loser.seat) ? undefined : captive;
  }

  public endHouse(house?: Family): boolean {
    const victor = this.source.family;

    const isEnded = isDefined(victor) && this.hasFallen(house);

    if (isEnded) {
      this.world.campaign.recordFall(house, 'last-province-lost', victor);
      this.world.dissolve(house, victor);
    }

    return isEnded;
  }

  private hasFallen(house?: Family): house is Family {
    return isDefined(house) && this.world.countProvinces(house) === 0;
  }

  private findLoser(): Loser | undefined {
    const attacking = this.source.family;
    const defending = this.report.target.family;

    if (!attacking || !defending) {
      return undefined;
    }

    return this.report.isTaken
      ? {
          general: this.report.defender.commander,
          house: defending,
          captor: attacking,
          seat: this.report.target,
        }
      : {
          general: this.report.attacker.commander,
          house: attacking,
          captor: defending,
          seat: this.source,
        };
  }

  private isCaught(loser: Loser): boolean {
    return (
      this.isLastStand(loser) ||
      (!this.isStandIn(loser) && Math.random() < this.weighOdds())
    );
  }

  private isStandIn({ house, general }: Loser): boolean {
    return (
      this.report.isTaken &&
      house.isRuler(general) &&
      !this.report.target.isHome
    );
  }

  private isLastStand({ house, general }: Loser): boolean {
    return house.isRuler(general) && this.world.countProvinces(house) === 1;
  }

  private weighOdds(): number {
    return this.isCornered() ? CORNERED_ODDS : CAPTURE_ODDS;
  }

  private isCornered(): boolean {
    return this.report.isTaken && !this.hasRefuge();
  }

  private hasRefuge(): boolean {
    const { target } = this.report;
    const house = target.family;

    return (
      isDefined(house) &&
      this.world.map
        .getNeighbors(target)
        .some((neighbor) => neighbor.belongsTo(house))
    );
  }
}
