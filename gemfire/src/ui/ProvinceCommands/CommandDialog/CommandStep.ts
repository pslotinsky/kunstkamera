export interface StepChoice {
  readonly value: string;
  readonly label: string;
}

export class CommandStep {
  public constructor(
    public readonly prompt: string,
    public readonly choices: readonly StepChoice[] = [],
    public readonly chosen?: string | undefined,
  ) {}

  public isChosen(choice: StepChoice): boolean {
    return choice.value === this.chosen;
  }
}
