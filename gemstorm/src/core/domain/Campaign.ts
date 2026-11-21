import { ARTIFACTS } from '@/config/artifacts';
import { sample } from '@/lib/array/sample';
import { isDefined } from '@/lib/value/isDefined';

import type { Advisor } from './Advisor';
import { Artifact } from './Artifact';
import {
  CampaignOutcome,
  type CampaignReason,
  type DefeatReason,
} from './CampaignOutcome';
import type { Coronation } from './Coronation';
import type { Family } from './Family';
import type { World } from './World';

const AURETH_PROVINCES = 30;

export class Campaign {
  public readonly advisor: Advisor | undefined;

  private readonly world: World;
  private undiscoveredArtifacts = ARTIFACTS;
  private concluded: CampaignOutcome | undefined;
  private fallen: CampaignOutcome | undefined;
  private succession: Coronation | undefined;

  public constructor(world: World, advisor?: Advisor) {
    this.world = world;
    this.advisor = advisor;
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

  public get hasUndiscoveredArtifacts(): boolean {
    return this.undiscoveredArtifacts.length > 0;
  }

  public discoverArtifact(): Artifact | undefined {
    const discovery = this.hasUndiscoveredArtifacts
      ? sample(this.undiscoveredArtifacts)
      : undefined;

    if (isDefined(discovery)) {
      this.undiscoveredArtifacts = this.undiscoveredArtifacts.filter(
        (artifact) => artifact !== discovery,
      );
    }

    return isDefined(discovery) ? new Artifact(discovery) : undefined;
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
      this.fallen = this.buildOutcome(reason, rival);
    }
  }

  public assess(): CampaignOutcome | undefined {
    let outcome: CampaignOutcome | undefined;

    if (this.canProgress) {
      outcome = this.fallen ?? this.assessMap();
      this.concluded = outcome;
    }

    return outcome;
  }

  private assessMap(): CampaignOutcome | undefined {
    const { player, map } = this.world;
    const ownedCount = map.provinces.filter(
      (province) => province.family === player,
    ).length;
    let reason: CampaignReason | undefined;

    if (!this.playerSurvives(ownedCount)) {
      reason = 'last-province-lost';
    } else if (this.isUnified(ownedCount)) {
      reason = 'unification';
    }

    return isDefined(reason) ? this.buildOutcome(reason) : undefined;
  }

  private playerSurvives(ownedCount: number): boolean {
    const { player, families } = this.world;

    return (
      families.all.includes(player) &&
      (ownedCount > 0 || this.world.isHeld(player.ruler))
    );
  }

  private isUnified(ownedCount: number): boolean {
    const { player, families, map } = this.world;

    return (
      ownedCount === AURETH_PROVINCES &&
      ownedCount === map.provinces.length &&
      families.all.every((family) => family === player)
    );
  }

  private buildOutcome(
    reason: CampaignReason,
    rival?: Family,
  ): CampaignOutcome {
    const { player, date } = this.world;

    return new CampaignOutcome({
      reason,
      date,
      house: player.name,
      ruler: player.ruler.name,
      rival: rival?.name,
    });
  }
}
