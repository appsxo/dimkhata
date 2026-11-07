export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatio: string;
}

function readDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function compressKycImage(file: File): Promise<CompressedImageResult> {
  const originalSizeKb = Math.max(1, Math.round(file.size / 1024));

  if (file.size <= 70 * 1024) {
    const dataUrl = await readDataUrl(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
      compressionRatio: '1.0x',
    };
  }

  try {
    const srcUrl = await readDataUrl(file);
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = srcUrl;
    });

    const maxDim = 1100;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable');
    ctx.drawImage(img, 0, 0, width, height);

    const dataUrl = canvas.toDataURL('image/webp', 0.72);
    const approxBytes = Math.round((dataUrl.length * 3) / 4);
    const compressedSizeKb = Math.max(1, Math.round(approxBytes / 1024));
    const ratio = (originalSizeKb / compressedSizeKb).toFixed(1) + 'x';
    const webpFile = new File([file], file.name.replace(/\.[^/.]+$/, '') + '.webp', {
      type: 'image/webp',
    });

    return {
      file: webpFile,
      dataUrl,
      originalSizeKb,
      compressedSizeKb,
      compressionRatio: ratio,
    };
  } catch {
    const dataUrl = await readDataUrl(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
      compressionRatio: '1.0x',
    };
  }
}
