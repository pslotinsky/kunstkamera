import type { Province } from './Province';

export type AdviceMeaning =
  | 'poor-in-both'
  | 'find-gold'
  | 'starving'
  | 'be-generous'
  | 'cultivate'
  | 'enlarge-army'
  | 'prepare-for-disasters'
  | 'hire-monsters'
  | 'hire-mercenaries'
  | 'attack'
  | 'no-ruler'
  | 'praise'
  | 'thought'
  | 'patience';

export interface AdviceParams {
  readonly meaning: AdviceMeaning;
  readonly target?: Province | undefined;
}

export class Advice {
  public readonly meaning: AdviceMeaning;
  public readonly target: Province | undefined;

  public constructor(params: AdviceParams) {
    this.meaning = params.meaning;
    this.target = params.target;
  }
}
