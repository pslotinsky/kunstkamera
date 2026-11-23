import { isDefined } from '@/lib/value/isDefined';

import { Captive } from './Captive';
import type { Family } from './Family';
import type { General } from './General';
import type { InvasionReport } from './InvasionReport';
import type { Province } from './Province';
import type { World } from './World';

const CAPTURE_ON_ATTACKER_WIN = 115;
const CAPTURE_ON_DEFENDER_WIN = 110;
const PERCENT_SCALE = 100;

interface Loser {
  readonly general: General;
  readonly house: Family;
  readonly captor: Family;
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

    return loser && this.isCaught(loser)
      ? new Captive({ ...loser, battlefield: this.report.target })
      : undefined;
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
    return (
      isDefined(house) &&
      this.world.countProvinces(house) === 0 &&
      !this.world.isHeld(house.ruler)
    );
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
        }
      : {
          general: this.report.attacker.commander,
          house: attacking,
          captor: defending,
        };
  }

  private isCaught(loser: Loser): boolean {
    const army = this.report.isTaken
      ? this.report.defender
      : this.report.attacker;
    let caught = false;

    if (!army.remotelyCommanded && !loser.general.captureImmune) {
      const surrendered =
        this.report.isTaken && this.report.answer === 'surrender';

      if (surrendered || !this.hasEscape(loser)) {
        caught = true;
      } else {
        caught = this.rollCapture(loser.general);
      }
    }

    return caught;
  }

  private hasEscape({ house }: Loser): boolean {
    return (
      isDefined(this.report.refuge) ||
      (!this.report.isTaken && this.source.belongsTo(house))
    );
  }

  private rollCapture(general: General): boolean {
    const base = this.report.isTaken
      ? CAPTURE_ON_ATTACKER_WIN
      : CAPTURE_ON_DEFENDER_WIN;
    const chance = Math.max(0, base - general.stats.war) / PERCENT_SCALE;

    return Math.random() < chance;
  }
}
