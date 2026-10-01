export type Disposal = 'recruit' | 'release' | 'banish';

export type DisposalOutcome = 'joined' | 'refused' | 'released' | 'banished';

export class DisposalChosenEvent {
  public constructor(public readonly disposal: Disposal) {}
}
