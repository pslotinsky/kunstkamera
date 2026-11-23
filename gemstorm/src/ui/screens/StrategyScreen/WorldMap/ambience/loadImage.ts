export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.addEventListener('load', () => resolve(image), { once: true });
    image.addEventListener('error', reject, { once: true });
    image.src = url;
  });
}
