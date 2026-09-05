import type { Province } from './Province';
import type { World } from './World';

export type DefenderAnswer = 'fight' | 'retreat' | 'surrender';

export class DefensePolicy {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public decide(province: Province): DefenderAnswer {
    let answer: DefenderAnswer = 'surrender';

    if (province.resources.troops > 0) {
      answer = 'fight';
    } else if (this.chooseRetreat(province)) {
      answer = 'retreat';
    }

    return answer;
  }

  public chooseRetreat(province: Province): Province | undefined {
    const { family } = province;

    return family
      ? this.world.map
          .getNeighbors(province)
          .filter((neighbor) => neighbor.belongsTo(family))
          .sort(
            (left, right) => right.resources.troops - left.resources.troops,
          )[0]
      : undefined;
  }
}
