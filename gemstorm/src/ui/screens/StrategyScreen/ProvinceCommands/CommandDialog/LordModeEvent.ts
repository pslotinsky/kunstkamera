export type LordMode = 'you' | 'vassals' | 'lords';

export class LordModeEvent {
  public constructor(public readonly mode: LordMode) {}
}
