export class TargetingStartedEvent {
  public constructor(
    public readonly selectable: readonly number[],
    public readonly inspectsTarget: boolean,
  ) {}
}
