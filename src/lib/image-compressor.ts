// ====================================================================
// DIMKHATA (ডিমখাতা) — Client-Side Zero-Cost Image Compressor (WebP)
// Compresses 5-10MB smartphone photos to <60KB WebP before saving
// ====================================================================

import imageCompression from 'browser-image-compression';

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  compressionRatio: string;
}

export async function compressKycImage(file: File): Promise<CompressedImageResult> {
  const originalSizeKb = Math.round(file.size / 1024);

  // If already small (< 70KB) and is image, read dataUrl directly
  if (file.size <= 70 * 1024) {
    const dataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
      compressionRatio: '1.0x',
    };
  }

  const options = {
    maxSizeMB: 0.07, // 70 KB target
    maxWidthOrHeight: 1200, // Crisp for NID numbers & passport text
    useWebWorker: true,
    fileType: 'image/webp',
    initialQuality: 0.75,
  };

  try {
    const compressedBlob = await imageCompression(file, options);
    const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
      type: 'image/webp',
    });
    const compressedSizeKb = Math.round(compressedFile.size / 1024);
    const dataUrl = await imageCompression.getDataUrlFromFile(compressedFile);
    const ratio = (originalSizeKb / Math.max(1, compressedSizeKb)).toFixed(1) + 'x';

    return {
      file: compressedFile,
      dataUrl,
      originalSizeKb,
      compressedSizeKb,
      compressionRatio: ratio,
    };
  } catch (err) {
    console.warn('Image compression fallback:', err);
    const dataUrl = await imageCompression.getDataUrlFromFile(file);
    return {
      file,
      dataUrl,
      originalSizeKb,
      compressedSizeKb: originalSizeKb,
      compressionRatio: '1.0x',
    };
  }
}
