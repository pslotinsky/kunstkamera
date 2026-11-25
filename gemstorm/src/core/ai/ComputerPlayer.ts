import { CommandExecutor } from '@/core/CommandExecutor';
import type {
  WorldCommand,
  WorldCommandContext,
} from '@/core/commands/WorldCommand';
import type { Captive } from '@/core/domain/Captive';
import type { Family } from '@/core/domain/Family';
import type { Province } from '@/core/domain/Province';

import { CaptorPolicy } from './CaptorPolicy';
import { DiplomacyPolicy } from './DiplomacyPolicy';
import { EconomyPolicy } from './EconomyPolicy';
import { WarPolicy } from './WarPolicy';

type PlanStep = (province: Province) => WorldCommand | undefined;

interface Temperament {
  readonly diplomacyOdds: number;
  readonly developOdds: number;
}

const PERCENT = 100;
const THOUGHTFUL: Temperament = { diplomacyOdds: 30, developOdds: 30 };
const WARLIKE: Temperament = { diplomacyOdds: 20, developOdds: 20 };

export class ComputerPlayer {
  private readonly executor: CommandExecutor;
  private readonly context: WorldCommandContext;
  private readonly captor: CaptorPolicy;
  private readonly diplomacy: DiplomacyPolicy;
  private readonly war: WarPolicy;
  private readonly economy: EconomyPolicy;

  public constructor(context: WorldCommandContext) {
    this.executor = new CommandExecutor(context);
    this.context = context;
    this.captor = new CaptorPolicy(context);
    this.diplomacy = new DiplomacyPolicy(context);
    this.war = new WarPolicy(context);
    this.economy = new EconomyPolicy(context);
  }

  public play(province: Province): boolean {
    const { world } = this.context;
    const family = province.family;

    if (
      !family ||
      !world.isComputerRun(province) ||
      !world.campaign.canProgress
    ) {
      return false;
    }

    this.judgeCaptives(family);

    if (!world.campaign.canProgress) {
      return false;
    }

    this.takeFreeActions(province);

    const order = this.chooseOrder(province);

    this.executor.execute(order);

    return order?.suspendsTurn() ?? false;
  }

  private judgeCaptives(family: Family): void {
    const { world } = this.context;

    if (!family.isEqual(world.player)) {
      for (const captive of world.getCaptivesOf(family)) {
        this.demandRansom(captive);
        if (
          world.campaign.canProgress &&
          world.hasCaptive(captive) &&
          !captive.ransom
        ) {
          this.executor.execute(this.captor.chooseJudgement(captive));
        }
      }
    }
  }

  public demandRansom(captive: Captive): void {
    const { world } = this.context;

    if (
      world.campaign.canProgress &&
      world.hasCaptive(captive) &&
      !captive.isHeldBy(world.player) &&
      captive.canDemandRansom
    ) {
      this.executor.execute(this.captor.demandRansom(captive));
    }
  }

  private takeFreeActions(province: Province): void {
    const trade = this.economy.chooseTrade(province);
    const subsidy = this.economy.chooseSubsidy(province);
    const lord = this.economy.chooseLord(province);

    this.executor.execute(trade);
    this.executor.execute(subsidy);
    this.executor.execute(lord);
  }

  private chooseOrder(province: Province): WorldCommand | undefined {
    const plan = this.choosePlan(province);

    return plan.reduce<WorldCommand | undefined>(
      (order, step) => order ?? step(province),
      undefined,
    );
  }

  private choosePlan(province: Province): readonly PlanStep[] {
    const { intelligence, war } = province.effectiveStats;
    const temperament = intelligence >= war ? THOUGHTFUL : WARLIKE;
    const { diplomacyOdds, developOdds } = temperament;
    const roll = Math.random() * PERCENT;
    let plan = this.militaryPlan;

    if (roll < diplomacyOdds) {
      plan = this.diplomacyPlan;
    } else if (roll < diplomacyOdds + developOdds) {
      plan = this.developPlan;
    }

    return plan;
  }

  private get militaryPlan(): readonly PlanStep[] {
    return [
      (province) => this.chooseOffence(province),
      (province) => this.chooseBuildUp(province),
      (province) => this.chooseDiplomacy(province),
    ];
  }

  private get developPlan(): readonly PlanStep[] {
    return [
      (province) => this.chooseDevelopment(province),
      (province) => this.chooseBuildUp(province),
      (province) => this.chooseOffence(province),
    ];
  }

  private get diplomacyPlan(): readonly PlanStep[] {
    return [
      (province) => this.chooseDiplomacy(province),
      (province) => this.chooseFakeRaid(province),
      (province) => this.chooseDevelopment(province),
      (province) => this.chooseOffence(province),
    ];
  }

  private chooseOffence(province: Province): WorldCommand | undefined {
    return this.war.chooseCommand(province);
  }

  private chooseBuildUp(province: Province): WorldCommand | undefined {
    return this.economy.chooseBuildUp(province);
  }

  private chooseDevelopment(province: Province): WorldCommand | undefined {
    return this.economy.chooseDevelopment(province);
  }

  private chooseDiplomacy(province: Province): WorldCommand | undefined {
    return this.diplomacy.chooseCommand(province);
  }

  private chooseFakeRaid(province: Province): WorldCommand | undefined {
    return this.diplomacy.chooseFakeRaid(province);
  }
}
