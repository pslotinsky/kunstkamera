export function getPublicAssetUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path}`;
}
