import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type { Army } from './Army';
import type { Family } from './Family';
import type { FifthUnit } from './FifthUnit';
import { Nerith } from './Nerith';
import type { Province } from './Province';
import type { World } from './World';

const TROOPS_PER_RESERVE_FOOD = 40;
const OVERWHELMING_RATIO = 5;
const FLIGHT_ODDS = 0.8;
const HIRED_FLIGHT_ODDS = 0.5;
const OUTMATCHED_ATTACKER_RATIO = 10;

export type DefenderAnswer = 'fight' | 'retreat' | 'surrender';

export class DefensePolicy {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public decide(province: Province, attacker: Army): DefenderAnswer {
    const refuge = this.chooseRefuge(province);

    return isDefined(refuge)
      ? this.decideWithRefuge(province, attacker)
      : this.decideCornered(province);
  }

  public chooseUnit(province: Province, attacker: Army): FifthUnit | undefined {
    const units = this.world.getFifthUnits(province);
    const nerith = units.find((unit) => unit instanceof Nerith);
    const isAttackerOutmatched =
      attacker.strength * OUTMATCHED_ATTACKER_RATIO < province.resources.troops;
    const [strongest] = units;

    return nerith ?? (isAttackerOutmatched ? undefined : strongest);
  }

  public getAnswers(province: Province): readonly DefenderAnswer[] {
    const answers: DefenderAnswer[] = [];
    const canFight = this.canFight(province);

    if (canFight) {
      answers.push('fight');
    }

    if (this.getRefuges(province).length > 0) {
      answers.push('retreat');
    }

    if (!canFight) {
      answers.push('surrender');
    }

    return answers;
  }

  public canFight(province: Province): boolean {
    const { troops, food } = province.resources;
    const unitCanFight = this.world
      .getFifthUnits(province)
      .some((unit) => unit.standsAlone);

    return food > 0 && (troops > 0 || unitCanFight);
  }

  public getRefuges(
    province: Province,
    family: Family | undefined = province.family,
  ): readonly Province[] {
    if (!family) {
      return [];
    }

    const neighbors = this.world.map
      .getNeighbors(province)
      .filter((neighbor) => neighbor.belongsTo(family) || neighbor.isNeutral());
    const home = family.homeProvince;
    const isHomeApart =
      !home.isEqual(province) &&
      home.belongsTo(family) &&
      !neighbors.some((neighbor) => neighbor.isEqual(home));

    return isHomeApart ? [...neighbors, home] : neighbors;
  }

  public chooseRefuge(province: Province): Province | undefined {
    const refuges = this.getRefuges(province);
    const [strongestOwn] = refuges
      .filter((refuge) => province.isNeighbor(refuge) && refuge.hasOwner())
      .sort((left, right) => right.resources.troops - left.resources.troops);
    const unowned = refuges.find((refuge) => refuge.isNeutral());
    const distantHome = refuges.find((refuge) => !province.isNeighbor(refuge));

    return strongestOwn ?? unowned ?? distantHome;
  }

  public chooseFallback(province: Province): Province | undefined {
    const refuges = this.getRefuges(province);
    const adjacent = refuges.filter((refuge) => province.isNeighbor(refuge));

    return adjacent.length > 1 ? sample(adjacent) : (adjacent[0] ?? refuges[0]);
  }

  private decideCornered(province: Province): DefenderAnswer {
    return this.canFight(province) ? 'fight' : 'surrender';
  }

  private decideWithRefuge(province: Province, attacker: Army): DefenderAnswer {
    let answer: DefenderAnswer = 'fight';

    if (this.isStarving(province)) {
      answer = 'retreat';
    } else if (this.isOverwhelmed(province, attacker)) {
      answer = this.rollFlight(province);
    }

    return answer;
  }

  private rollFlight(province: Province): DefenderAnswer {
    const odds = this.measureFlightOdds(province);

    return Math.random() < odds ? 'retreat' : 'fight';
  }

  private isStarving(province: Province): boolean {
    const { troops, food } = province.resources;

    return food === 0 || food < Math.floor(troops / TROOPS_PER_RESERVE_FOOD);
  }

  private isOverwhelmed(province: Province, attacker: Army): boolean {
    const attackerFifth = Math.floor(attacker.troops / OVERWHELMING_RATIO);

    return attackerFifth >= province.resources.troops;
  }

  private measureFlightOdds(province: Province): number {
    return province.fifthUnits.hiredUnits.length > 0
      ? HIRED_FLIGHT_ODDS
      : FLIGHT_ODDS;
  }
}
