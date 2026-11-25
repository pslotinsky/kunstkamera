export function hideBrokenImage(event: Event): void {
  if (event.target instanceof HTMLImageElement) {
    event.target.hidden = true;
  }
}
