const DATE_TIME = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatDateTime(date: Date | number): string {
  return DATE_TIME.format(date);
}
