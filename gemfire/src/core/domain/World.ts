import type { Collection } from '@/lib/Collection';

import type { CalendarDate } from './CalendarDate';
import type { Captive } from './Captive';
import type { Family } from './Family';
import type { General, GeneralRank } from './General';
import { Market } from './Market';
import type { Province } from './Province';
import { TurnQueue } from './TurnQueue';
import type { WorldMap } from './WorldMap';

export interface WorldParams {
  readonly date: CalendarDate;
  readonly map: WorldMap;
  readonly families: Collection<string, Family>;
  readonly generals: Collection<string, General>;
  readonly player: Family;
}

export class World {
  public date: CalendarDate;
  public readonly market = new Market();
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
  }

  public hold(captive: Captive): void {
    this.held = [...this.held, captive];
  }

  public free(captive: Captive): void {
    this.held = this.held.filter((each) => each !== captive);
  }

  public findCaptiveOf(captor: Family): Captive | undefined {
    return this.held.find((captive) => captive.captor.isEqual(captor));
  }

  public exile(general: General): void {
    this.exiled = [...this.exiled, general];
    this.generals.remove(general.name);
  }

  public isExiled(general: General): boolean {
    return this.exiled.some((each) => each.isEqual(general));
  }

  public dissolve(family: Family, victor: Family): void {
    family.surrenderTo(victor);
    family.breakAlliance();
    this.families.remove(family.name);
  }

  public absorb(family: Family, victor: Family): void {
    for (const province of this.getFamilyProvinces(family)) {
      province.claim(victor);
    }

    for (const member of family.members) {
      victor.enlist(member);
    }

    this.dissolve(family, victor);
  }

  public transfer(general: General, to: Family): void {
    const province = this.getRuledProvince(general);

    this.findFamilyOf(general)?.discharge(general);
    to.enlist(general);
    province?.claim(to);
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

  public getFamilyProvinces(family: Family): readonly Province[] {
    return this.map.provinces.filter((province) => province.belongsTo(family));
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
