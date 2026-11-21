import { BREAKAWAY_NAMES } from '@/config/families';
import type { Collection } from '@/lib/Collection';
import { isDefined } from '@/lib/value/isDefined';

import type { Advisor } from './Advisor';
import type { CalendarDate } from './CalendarDate';
import { Campaign } from './Campaign';
import type { Captive } from './Captive';
import { Family } from './Family';
import type { FifthUnit } from './FifthUnit';
import type { General, GeneralRank } from './General';
import { Market } from './Market';
import type { Province } from './Province';
import { TurnQueue } from './TurnQueue';
import type { WorldMap } from './WorldMap';

const BREAKAWAY_FAME = 3;
const ABSORBED_PROVINCE_FAME = 3;
const DEFECTING_LORD_FAME = 3;

export interface WorldParams {
  readonly date: CalendarDate;
  readonly map: WorldMap;
  readonly families: Collection<string, Family>;
  readonly generals: Collection<string, General>;
  readonly player: Family;
  readonly advisor?: Advisor | undefined;
}

export class World {
  public date: CalendarDate;
  public readonly market = new Market();
  public readonly campaign: Campaign;
  public readonly turnQueue: TurnQueue;
  public readonly map: WorldMap;
  public readonly families: Collection<string, Family>;
  public readonly generals: Collection<string, General>;
  public readonly player: Family;

  private exiled: readonly General[] = [];
  private held: readonly Captive[] = [];

  public constructor(params: WorldParams) {
    this.date = params.date;
    this.map = params.map;
    this.families = params.families;
    this.generals = params.generals;
    this.player = params.player;
    this.turnQueue = new TurnQueue(this.map.provinces);
    this.campaign = new Campaign(this, params.advisor);
  }

  public hold(captive: Captive): void {
    this.held = [...this.held, captive];
  }

  public free(captive: Captive): void {
    this.held = this.held.filter((each) => each !== captive);
  }

  public findCaptiveOf(captor: Family): Captive | undefined {
    return this.getCaptivesOf(captor)[0];
  }

  public getCaptivesOf(captor: Family): readonly Captive[] {
    return this.held.filter((captive) => captive.captor.isEqual(captor));
  }

  public findRansomFor(house: Family): Captive | undefined {
    return this.held.find(
      (captive) => captive.house.isEqual(house) && isDefined(captive.demand),
    );
  }

  public exile(general: General): void {
    this.exiled = [...this.exiled, general];
    this.generals.remove(general.name);
  }

  public isExiled(general: General): boolean {
    return this.exiled.some((each) => each.isEqual(general));
  }

  public isHeld(general: General): boolean {
    return this.held.some((captive) => captive.general.isEqual(general));
  }

  public hasCaptive(captive: Captive): boolean {
    return this.held.includes(captive);
  }

  public bury(general: General): void {
    const family = this.findFamilyOf(general);

    family?.discharge(general);
    this.generals.remove(general.name);
    this.held = this.held.filter(
      (captive) => !captive.general.isEqual(general),
    );

    if (family && !family.isRuler(general)) {
      this.getRuledProvince(general)?.assignGovernor(family.ruler);
    }
  }

  public isRuler(general: General): boolean {
    return this.findFamilyOf(general)?.isRuler(general) ?? false;
  }

  public getHeirs(family: Family): readonly General[] {
    return family.members
      .filter(
        (member) =>
          member.isKinOf(family) &&
          !family.isRuler(member) &&
          !this.isHeld(member),
      )
      .sort((left, right) => right.stats.total - left.stats.total);
  }

  public foundFamily(lord: General, province: Province): Family | undefined {
    const name = BREAKAWAY_NAMES.find((free) => !this.families.has(free));

    if (!name) {
      return undefined;
    }

    const founded = new Family({
      name,
      ruler: lord,
      members: [lord],
      homeProvince: province,
      fame: BREAKAWAY_FAME,
    });

    this.findFamilyOf(lord)?.discharge(lord);
    this.families.add(name, founded);
    province.claim(founded);

    return founded;
  }

  public dissolve(family: Family, victor?: Family): void {
    if (victor) {
      family.surrenderTo(victor);
    }

    family.breakAlliance();
    this.families.remove(family.name);
  }

  public absorb(family: Family, victor: Family): void {
    this.campaign.recordFall(family, 'absorption', victor);
    const provinces = this.getFamilyProvinces(family);

    for (const province of provinces) {
      province.claim(victor);
    }

    for (const member of family.members) {
      if (member.isKinOf(family)) {
        member.renounceHouse();
      }
      victor.enlist(member);
    }

    victor.gainFame(provinces.length * ABSORBED_PROVINCE_FAME);
    this.dissolve(family, victor);
  }

  public transfer(general: General, to: Family): void {
    const province = this.getRuledProvince(general);

    const former = this.findFamilyOf(general);

    former?.discharge(general);
    to.enlist(general);
    if (former && province?.belongsTo(former) && !former.isEqual(to)) {
      province.claim(to);
      former.loseFame(DEFECTING_LORD_FAME);
      to.gainFame(DEFECTING_LORD_FAME);
    }

    if (former && this.countProvinces(former) === 0) {
      this.campaign.recordFall(former, 'last-province-lost', to);
      this.dissolve(former, to);
    }
  }

  public findFamilyOf(general: General): Family | undefined {
    return this.families.all.find((family) =>
      family.members.some((member) => member.isEqual(general)),
    );
  }

  public isProvinceTurn(province: Province): boolean {
    return this.turnQueue.current
      ? province.isEqual(this.turnQueue.current)
      : false;
  }

  public getRuledProvince(general: General): Province | undefined {
    return this.map.provinces.find((province) => province.ruledBy(general));
  }

  public getGeneralRank(family: Family, general: General): GeneralRank {
    let rank: GeneralRank = 'vassal';

    if (family.isRuler(general)) {
      rank = 'ruler';
    } else if (this.getRuledProvince(general)) {
      rank = 'lord';
    }

    return rank;
  }

  public getResidence(family: Family, general: General): Province {
    const governed = family.isRuler(general)
      ? family.homeProvince
      : this.getRuledProvince(general);

    return governed ?? family.homeProvince;
  }

  public getHostileNeighbors(province: Province): readonly Province[] {
    const { family } = province;

    return family
      ? this.map
          .getNeighbors(province)
          .filter((neighbor) => family.isHostileTo(neighbor.family))
      : [];
  }

  public isComputerRun(province: Province): boolean {
    return (
      province.hasOwner() &&
      (!province.belongsTo(this.player) || province.isEntrusted)
    );
  }

  public isPlayerRun(province: Province): boolean {
    return province.belongsTo(this.player) && !province.isEntrusted;
  }

  public isBorder(province: Province): boolean {
    return this.getHostileNeighbors(province).length > 0;
  }

  public getThreat(province: Province): number {
    const threats = this.getHostileNeighbors(province).map((neighbor) =>
      this.getDefense(neighbor),
    );

    return Math.max(0, ...threats);
  }

  public getDefense(province: Province): number {
    const strongest = this.getFifthUnits(province)[0];

    return province.resources.troops + (strongest?.strength ?? 0);
  }

  public getFifthUnits(province: Province): readonly FifthUnit[] {
    const guardians = province.family?.getReadyGuardians(this.date) ?? [];

    return [...province.fifthUnits.units, ...guardians].sort(
      (left, right) => right.strength - left.strength,
    );
  }

  public countProvinces(family: Family): number {
    return this.getFamilyProvinces(family).length;
  }

  public getFamilyProvinces(family: Family): readonly Province[] {
    return this.map.getFamilyProvinces(family);
  }

  public getVassals(family: Family): readonly General[] {
    const provinces = this.getFamilyProvinces(family);

    return family.members.filter(
      (member) =>
        !family.isRuler(member) &&
        !provinces.some((province) => province.ruledBy(member)),
    );
  }
}
