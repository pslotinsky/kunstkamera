import type { Captive } from './Captive';
import type { Family } from './Family';
import type { World } from './World';

const RECRUIT_ODDS = 0.5;
const RELEASE_WAR_LOSS = 5;

export class Captivity {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public recruit(captive: Captive): boolean {
    const success = Math.random() < RECRUIT_ODDS;

    if (success) {
      this.turn(captive);
    }

    return success;
  }

  public release(captive: Captive): void {
    captive.general.decreaseWar(RELEASE_WAR_LOSS);
  }

  public banish(captive: Captive): void {
    const wasRuler = captive.isRuler;

    captive.house.discharge(captive.general);
    this.world.exile(captive.general);

    if (wasRuler) {
      this.scatter(captive.house, captive.captor);
    }
  }

  private turn(captive: Captive): void {
    const wasRuler = captive.isRuler;

    captive.house.discharge(captive.general);
    captive.captor.enlist(captive.general);

    if (wasRuler) {
      this.absorb(captive.house, captive.captor);
    }
  }

  private absorb(house: Family, victor: Family): void {
    for (const province of this.world.getFamilyProvinces(house)) {
      province.claim(victor);
    }

    for (const member of house.members) {
      victor.enlist(member);
    }

    this.world.dissolve(house, victor);
  }

  private scatter(house: Family, victor: Family): void {
    for (const province of this.world.getFamilyProvinces(house)) {
      province.unclaim();
    }

    this.world.dissolve(house, victor);
  }
}
