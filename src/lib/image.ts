export function dataUrlToBase64(dataUrl: string) {
  const parts = dataUrl.split(',', 2);
  return parts[1] ?? '';
}

export function mimeFromDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:(.*?);base64,/);
  return match?.[1] ?? 'image/jpeg';
}

interface OptimizeOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function optimizeImageDataUrl(
  dataUrl: string,
  {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    mimeType = 'image/jpeg',
  }: OptimizeOptions = {},
) {
  const image = await loadImage(dataUrl);
  const { width, height } = fitWithin(image.naturalWidth || image.width, image.naturalHeight || image.height, maxWidth, maxHeight);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL(mimeType, quality);
}

function fitWithin(width: number, height: number, maxWidth: number, maxHeight: number) {
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  const ratio = Math.min(maxWidth / width, maxHeight / height);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    // Only set crossOrigin for external URLs. Data URLs don't support CORS.
    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    img.onerror = () => {
      const info = src.startsWith('data:') ? `Data URL (${src.length} chars)` : src;
      reject(new Error(`ไม่สามารถโหลดรูปภาพได้: ${info.slice(0, 50)}...`));
    };
    img.src = src;
  });
}
