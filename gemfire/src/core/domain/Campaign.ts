import { CampaignOutcome, type DefeatReason } from './CampaignOutcome';
import type { Coronation } from './Coronation';
import type { Family } from './Family';
import type { World } from './World';

const ISHMERIA_PROVINCES = 30;

export class Campaign {
  private readonly world: World;
  private concluded: CampaignOutcome | undefined;
  private fallen: CampaignOutcome | undefined;
  private succession: Coronation | undefined;

  public constructor(world: World) {
    this.world = world;
  }

  public get outcome(): CampaignOutcome | undefined {
    return this.concluded;
  }

  public get isEnded(): boolean {
    return this.concluded !== undefined;
  }

  public get isAwaitingHeir(): boolean {
    return this.succession !== undefined;
  }

  public get canProgress(): boolean {
    return !this.isEnded && !this.isAwaitingHeir;
  }

  public awaitHeir(succession: Coronation): void {
    if (!this.isEnded && succession.isChoiceFor(this.world.player)) {
      this.succession = succession;
    }
  }

  public confirmHeir(succession: Coronation): void {
    if (this.succession === succession) {
      this.succession = undefined;
    }
  }

  public recordFall(
    family: Family,
    reason: DefeatReason,
    rival?: Family,
  ): void {
    if (family === this.world.player && !this.fallen && !this.isEnded) {
      this.fallen = new CampaignOutcome({
        reason,
        date: this.world.date,
        house: family.name,
        ruler: family.ruler.name,
        rival: rival?.name,
      });
    }
  }

  public assess(): CampaignOutcome | undefined {
    if (!this.canProgress) {
      return undefined;
    }

    const { player, families, map, date } = this.world;
    const owned = map.provinces.filter(
      (province) => province.family === player,
    );
    const survives = families.all.includes(player) && owned.length > 0;
    const unified =
      owned.length === ISHMERIA_PROVINCES &&
      owned.length === map.provinces.length &&
      families.all.every((family) => family === player);

    if (this.fallen || !survives || unified) {
      this.concluded =
        this.fallen ??
        new CampaignOutcome({
          reason: survives ? 'unification' : 'last-province-lost',
          date,
          house: player.name,
          ruler: player.ruler.name,
        });
    }

    return this.concluded;
  }
}
