import { isDefined } from '@/lib/value/isDefined';

import type { Family } from './Family';
import type { General } from './General';
import type { Province } from './Province';
import { Ransom, type RansomCurrency } from './Ransom';

export interface CaptiveParams {
  readonly general: General;
  readonly house: Family;
  readonly captor: Family;
  readonly battlefield: Province;
}

export class Captive {
  public static capture(params: CaptiveParams): Captive {
    const { general, house } = params;
    const ransom = house.isRuler(general)
      ? undefined
      : Ransom.forGeneral(general, house);

    return new Captive(params, ransom);
  }

  public readonly general: General;
  public readonly house: Family;
  public readonly captor: Family;
  public readonly battlefield: Province;
  private pendingRansom: Ransom | undefined;
  private requestedCurrency: RansomCurrency | undefined;

  public constructor(params: CaptiveParams, ransom?: Ransom) {
    this.general = params.general;
    this.house = params.house;
    this.captor = params.captor;
    this.battlefield = params.battlefield;
    this.pendingRansom = ransom;
  }

  public get isRuler(): boolean {
    return this.house.isRuler(this.general);
  }

  public get ransom(): Ransom | undefined {
    return this.pendingRansom;
  }

  public get demand(): RansomCurrency | undefined {
    return this.requestedCurrency;
  }

  public get canDemandRansom(): boolean {
    return isDefined(this.pendingRansom) && !isDefined(this.requestedCurrency);
  }

  public belongsTo(house: Family): boolean {
    return this.house.isEqual(house);
  }

  public isHeldBy(captor: Family): boolean {
    return this.captor.isEqual(captor);
  }

  public demandRansom(currency: RansomCurrency): void {
    this.requestedCurrency = currency;
  }

  public closeRansom(): void {
    this.pendingRansom = undefined;
    this.requestedCurrency = undefined;
  }
}
