/** Pixel rectangle to cut out of the source image. */
export type CropArea = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MAX_OUTPUT_WIDTH = 1600;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read the selected image"));
    image.src = src;
  });
}

/**
 * Cuts `area` out of `file` and re-encodes it, keeping PNG input as PNG so
 * transparency survives and sending everything else to JPEG.
 */
export async function cropImageToFile(file: File, area: CropArea): Promise<File> {
  const objectUrl = URL.createObjectURL(file);

  try {
    const image = await loadImage(objectUrl);

    const sourceX = Math.max(0, Math.round(area.x));
    const sourceY = Math.max(0, Math.round(area.y));
    const sourceWidth = Math.min(Math.round(area.width), image.naturalWidth - sourceX);
    const sourceHeight = Math.min(Math.round(area.height), image.naturalHeight - sourceY);

    if (sourceWidth <= 0 || sourceHeight <= 0) {
      throw new Error("Could not crop the image");
    }

    const scale = Math.min(1, MAX_OUTPUT_WIDTH / sourceWidth);
    const width = Math.round(sourceWidth * scale);
    const height = Math.round(sourceHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not crop the image");
    }

    context.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      width,
      height
    );

    const type = file.type === "image/png" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type)
    );

    if (!blob) {
      throw new Error("Could not crop the image");
    }

    return new File([blob], file.name, { type });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
