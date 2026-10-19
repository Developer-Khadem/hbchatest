export function getProductImageSource(image: string) {
  return image.startsWith("local-webp:")
    ? `data:image/webp;base64,${image.slice("local-webp:".length)}`
    : image;
}
