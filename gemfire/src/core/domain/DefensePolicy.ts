import type { Province } from './Province';
import type { World } from './World';

export type DefenderAnswer = 'fight' | 'retreat' | 'surrender';

export class DefensePolicy {
  private readonly world: World;

  public constructor(world: World) {
    this.world = world;
  }

  public decide(province: Province): DefenderAnswer {
    const [preferred] = this.getAnswers(province);

    return preferred ?? 'surrender';
  }

  public getAnswers(province: Province): readonly DefenderAnswer[] {
    const answers: DefenderAnswer[] = [];

    if (province.resources.troops > 0) {
      answers.push('fight');
    }

    if (this.getRefuges(province).length > 0) {
      answers.push('retreat');
    }

    return answers.length > 0 ? answers : ['surrender'];
  }

  public getRefuges(province: Province): readonly Province[] {
    const { family } = province;

    if (!family) {
      return [];
    }

    const neighbors = this.world.map
      .getNeighbors(province)
      .filter((neighbor) => neighbor.belongsTo(family));
    const home = family.homeProvince;
    const isHomeApart =
      !home.isEqual(province) &&
      home.belongsTo(family) &&
      !neighbors.some((neighbor) => neighbor.isEqual(home));

    return isHomeApart ? [...neighbors, home] : neighbors;
  }

  public chooseRefuge(province: Province): Province | undefined {
    return [...this.getRefuges(province)].sort(
      (left, right) => right.resources.troops - left.resources.troops,
    )[0];
  }
}
