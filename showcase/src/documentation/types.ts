export interface DocumentSummary {
  readonly file: string;
  readonly title: string;
  readonly url: string;
}
export interface DocumentSection {
  readonly title: string;
  readonly description: string;
  readonly documents: readonly DocumentSummary[];
}
