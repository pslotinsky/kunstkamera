export interface AdvisorParams {
  readonly name: string;
  readonly title: string;
  readonly saying: string;
}

export class Advisor {
  public readonly name: string;
  public readonly title: string;
  public readonly saying: string;

  public constructor(params: AdvisorParams) {
    this.name = params.name;
    this.title = params.title;
    this.saying = params.saying;
  }

  public isEqual(other: Advisor): boolean {
    return this.name === other.name;
  }
}
