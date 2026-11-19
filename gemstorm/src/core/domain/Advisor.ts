import type { AdviceMeaning } from './Advice';

export type AdvisorLines = Readonly<Record<AdviceMeaning, string>>;

export interface AdvisorParams {
  readonly name: string;
  readonly title: string;
  readonly saying: string;
  readonly lines: AdvisorLines;
  readonly farewell: string;
}

export class Advisor {
  public readonly name: string;
  public readonly title: string;
  public readonly saying: string;
  public readonly lines: AdvisorLines;
  public readonly farewell: string;

  public constructor(params: AdvisorParams) {
    this.name = params.name;
    this.title = params.title;
    this.saying = params.saying;
    this.lines = params.lines;
    this.farewell = params.farewell;
  }

  public isEqual(other: Advisor): boolean {
    return this.name === other.name;
  }
}
