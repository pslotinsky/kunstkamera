export interface Attachable {
  attach(container: Element): void;
  detach(): void;
}
