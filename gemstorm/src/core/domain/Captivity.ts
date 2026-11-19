import type { Captive } from './Captive';
import { Succession, type SuccessionOutcome } from './Succession';
import type { World } from './World';

export type Disposal = 'recruit' | 'release' | 'banish';

export type DisposalOutcome = 'joined' | 'refused' | 'released' | 'banished';

const RECRUIT_ODDS = 0.5;
const RULER_RECRUIT_ODDS = 0.2;
const RELEASE_WAR_LOSS = 5;

export class Captivity {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public recruit(captive: Captive): boolean {
    const success = Math.random() < this.weighOdds(captive);

    if (success) {
      this.turn(captive);
    }

    return success;
  }

  private weighOdds(captive: Captive): number {
    return captive.isRuler ? RULER_RECRUIT_ODDS : RECRUIT_ODDS;
  }

  public release(captive: Captive): void {
    captive.general.decreaseWar(RELEASE_WAR_LOSS);
  }

  public banish(captive: Captive): SuccessionOutcome | undefined {
    const { general, house, captor } = captive;
    const wasRuler = captive.isRuler;

    if (!wasRuler) {
      this.world.getRuledProvince(general)?.assignGovernor(house.ruler);
    }

    house.discharge(general);
    this.world.exile(general);

    return wasRuler
      ? new Succession(this.world).replace(house, captor)
      : undefined;
  }

  private turn(captive: Captive): void {
    const wasRuler = captive.isRuler;

    captive.house.discharge(captive.general);
    captive.captor.enlist(captive.general);

    if (wasRuler) {
      this.world.absorb(captive.house, captive.captor);
    }
  }
}
