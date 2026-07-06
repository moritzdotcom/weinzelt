export type DownscaledImageResult = {
  file: File;
  originalSize: number;
  resizedSize: number;
  originalWidth: number;
  originalHeight: number;
  resizedWidth: number;
  resizedHeight: number;
  wasProcessed: boolean;
};

type DownscaleOptions = {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: 'image/jpeg' | 'image/webp';
};

function getOutputFileName(fileName: string, outputType: string) {
  const extension = outputType === 'image/webp' ? 'webp' : 'jpg';
  const cleanName = fileName.replace(/\.[^.]+$/, '');

  return `${cleanName}.${extension}`;
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Bild konnte nicht verarbeitet werden.'));
          return;
        }

        resolve(blob);
      },
      type,
      quality,
    );
  });
}

async function loadImage(file: File): Promise<{
  source: CanvasImageSource;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof createImageBitmap === 'function') {
    try {
      const bitmap = await createImageBitmap(file);

      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback auf HTMLImageElement
    }
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);

    image.onload = () => {
      resolve({
        source: image,
        width: image.naturalWidth,
        height: image.naturalHeight,
        cleanup: () => URL.revokeObjectURL(objectUrl),
      });
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Bild konnte nicht geladen werden.'));
    };

    image.src = objectUrl;
  });
}

export async function downscaleImageFile(
  file: File,
  {
    maxWidth = 2400,
    maxHeight = 2400,
    quality = 0.82,
    outputType = 'image/jpeg',
  }: DownscaleOptions = {},
): Promise<DownscaledImageResult> {
  if (!file.type.startsWith('image/')) {
    return {
      file,
      originalSize: file.size,
      resizedSize: file.size,
      originalWidth: 0,
      originalHeight: 0,
      resizedWidth: 0,
      resizedHeight: 0,
      wasProcessed: false,
    };
  }

  const image = await loadImage(file);

  try {
    const scale = Math.min(1, maxWidth / image.width, maxHeight / image.height);

    const targetWidth = Math.round(image.width * scale);
    const targetHeight = Math.round(image.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Bild konnte nicht verarbeitet werden.');
    }

    // Weißer Hintergrund, falls PNGs mit Transparenz dabei sind.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    ctx.drawImage(image.source, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, outputType, quality);

    // Falls die optimierte Datei aus irgendeinem Grund größer ist,
    // verwenden wir lieber das Original.
    if (blob.size >= file.size && scale === 1) {
      return {
        file,
        originalSize: file.size,
        resizedSize: file.size,
        originalWidth: image.width,
        originalHeight: image.height,
        resizedWidth: image.width,
        resizedHeight: image.height,
        wasProcessed: false,
      };
    }

    const resizedFile = new File(
      [blob],
      getOutputFileName(file.name, outputType),
      {
        type: outputType,
        lastModified: Date.now(),
      },
    );

    return {
      file: resizedFile,
      originalSize: file.size,
      resizedSize: resizedFile.size,
      originalWidth: image.width,
      originalHeight: image.height,
      resizedWidth: targetWidth,
      resizedHeight: targetHeight,
      wasProcessed: true,
    };
  } finally {
    image.cleanup();
  }
}
