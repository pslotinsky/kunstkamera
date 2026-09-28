import type { Family } from './Family';
import type { General } from './General';
import { Ransom } from './Ransom';

export interface CaptiveParams {
  readonly general: General;
  readonly house: Family;
  readonly captor: Family;
}

export class Captive {
  public readonly general: General;
  public readonly house: Family;
  public readonly captor: Family;
  public readonly ransom: Ransom;

  public constructor(params: CaptiveParams) {
    this.general = params.general;
    this.house = params.house;
    this.captor = params.captor;
    this.ransom = Ransom.forGeneral(params.general);
  }

  public get isRuler(): boolean {
    return this.house.isRuler(this.general);
  }
}
