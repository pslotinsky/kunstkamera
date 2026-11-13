class Html {
  private readonly markup: string;

  constructor(markup: string) {
    this.markup = markup;
  }

  public toString(): string {
    return this.markup;
  }
}

export type { Html };

export function html(
  strings: TemplateStringsArray,
  ...values: unknown[]
): Html {
  const markup = strings.reduce(
    (result, string, index) =>
      result +
      string +
      (index < values.length ? renderValue(values[index]) : ''),
    '',
  );

  return new Html(markup);
}

function renderValue(value: unknown): string {
  if (value === null || value === undefined || typeof value === 'boolean') {
    return '';
  }

  if (value instanceof Html) {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(renderValue).join('');
  }

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
