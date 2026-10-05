import type { Battle } from '../Battle';
import { type BattleUnit, BLOW_WEIGHT, RETALIATION } from '../BattleUnit';
import type { Cell } from '../Cell';
import { UnitOrder } from '../UnitOrder';
import { STEPS_CAP } from './Approach';
import { Roads } from './Roads';

const CANDIDATES = 8;
const WORK_CANDIDATES = 3;

const WORTH_OF_WORK = 0.5;

interface Weighed {
  readonly order: UnitOrder;
  readonly worth: number;
}

export class OrderCandidates {
  public constructor(
    private readonly battle: Battle,
    private readonly unit: BattleUnit,
  ) {}

  public list(): readonly UnitOrder[] {
    const standings = [
      this.unit.cell,
      ...this.battle.getMoveRange(this.unit).cells,
    ];

    const roads = new Roads({
      goal: this.chooseGoal(),
      walker: this.unit,
      battlefield: this.battle.field,
    });

    return [
      ...this.findBlows(standings),
      ...this.findWorks(standings),
      ...this.findWalks(standings, roads),
    ];
  }

  private findBlows(standings: readonly Cell[]): readonly UnitOrder[] {
    const blows = standings.flatMap((from) =>
      this.battle.getTargets(this.unit, from).map((target) => ({
        order: new UnitOrder({ destination: from, target }),
        worth: this.weighBlow(target, from),
      })),
    );

    return this.best(blows, CANDIDATES);
  }

  private findWorks(standings: readonly Cell[]): readonly UnitOrder[] {
    const works = standings.flatMap((from) =>
      this.findWorkSites(from).map((fence) => ({
        order: new UnitOrder({ destination: from, fence }),
        worth: WORTH_OF_WORK,
      })),
    );

    return this.best(works, WORK_CANDIDATES);
  }

  private findWalks(
    standings: readonly Cell[],
    roads: Roads,
  ): readonly UnitOrder[] {
    const walks = standings.map((from) => ({
      order: new UnitOrder({ destination: from }),
      worth: -Math.min(roads.measureEffort(from), STEPS_CAP),
    }));

    return this.best(walks, CANDIDATES);
  }

  private best(
    weighed: readonly Weighed[],
    keep: number,
  ): readonly UnitOrder[] {
    return [...weighed]
      .sort((left, right) => right.worth - left.worth)
      .slice(0, keep)
      .map((candidate) => candidate.order);
  }

  private findWorkSites(from: Cell): readonly Cell[] {
    const built = this.unit.canBuild
      ? this.battle.getBuildSites(this.unit, from)
      : [];

    return [...built, ...this.battle.getBreakable(this.unit, from)];
  }

  private weighBlow(target: BattleUnit, from: Cell): number {
    const approach = target.getApproach(from);
    const exposure = target.isNextTo(from) ? RETALIATION[approach] : 0;

    return BLOW_WEIGHT[approach] - exposure;
  }

  private chooseGoal(): Cell {
    const enemy = this.unit.side.opposite;
    const mine = this.battle.getStrength(this.unit.side);
    const theirs = this.battle.getStrength(enemy);
    const guarded = mine < theirs ? this.unit.side : enemy;

    return this.battle.field.getFlag(guarded);
  }
}
