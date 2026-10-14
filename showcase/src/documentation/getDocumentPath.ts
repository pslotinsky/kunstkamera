export function getDocumentPath(file: string, heading = ''): string {
  const path = file
    .replace(/\.md$/, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/');
  return `/gemfire/docs/${path}/${heading ? `#${encodeURIComponent(heading)}` : ''}`;
}
