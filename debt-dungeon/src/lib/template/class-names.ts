type ClassValue = string | Record<string, boolean> | false | null | undefined;

export function classNames(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (!value) {
      continue;
    }

    if (typeof value === 'string') {
      classes.push(value);
    } else {
      for (const [className, enabled] of Object.entries(value)) {
        if (enabled) {
          classes.push(className);
        }
      }
    }
  }

  return classes.join(' ');
}
