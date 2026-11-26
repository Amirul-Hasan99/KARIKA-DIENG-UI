"use client";

export type StudioOutputMode = "transparent" | "template";

export interface StudioProcessOptions {
  mode: StudioOutputMode;
  packBadge?: string;
  onProgress?: (stage: string, progress: number) => void;
}

/**
 * Loads an image from a Blob or URL into an HTMLImageElement.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Finds the tight bounding box of non-transparent pixels (alpha > 12)
 * so the product cutout can be centered and scaled uniformly.
 */
function getTrimmedBounds(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < minX || maxY < minY) {
    return { x: 0, y: 0, width, height };
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

/**
 * Removes background using @imgly/background-removal (client-side WASM/ONNX)
 * and returns a trimmed transparent cutout Data URL.
 */
export async function removeProductBackground(
  file: File,
  onProgress?: (stage: string, progress: number) => void
): Promise<string> {
  onProgress?.("Memuat model AI penghapus background...", 15);
  const { removeBackground } = await import("@imgly/background-removal");

  onProgress?.("Menghapus background gambar secara otomatis...", 40);
  const resultBlob = await removeBackground(file, {
    progress: (key: string, current: number, total: number) => {
      if (total > 0) {
        const pct = Math.min(85, 40 + Math.round((current / total) * 45));
        onProgress?.(`Memproses AI (${key})...`, pct);
      }
    },
  });

  onProgress?.("Merapikan tepi & proporsi objek...", 90);
  const rawUrl = URL.createObjectURL(resultBlob);
  try {
    const img = await loadImage(rawUrl);
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.naturalWidth || img.width;
    tempCanvas.height = img.naturalHeight || img.height;
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) throw new Error("Canvas 2D context tidak tersedia");

    tempCtx.drawImage(img, 0, 0);
    const bounds = getTrimmedBounds(tempCtx, tempCanvas.width, tempCanvas.height);

    // Center trimmed cutout onto an 800x800 transparent canvas at ~78% frame fill
    const size = 800;
    const outCanvas = document.createElement("canvas");
    outCanvas.width = size;
    outCanvas.height = size;
    const outCtx = outCanvas.getContext("2d");
    if (!outCtx) throw new Error("Canvas 2D context tidak tersedia");

    const maxTarget = size * 0.78;
    const scale = Math.min(maxTarget / bounds.width, maxTarget / bounds.height);
    const drawW = bounds.width * scale;
    const drawH = bounds.height * scale;
    const drawX = (size - drawW) / 2;
    const drawY = (size - drawH) / 2;

    outCtx.drawImage(
      tempCanvas,
      bounds.x,
      bounds.y,
      bounds.width,
      bounds.height,
      drawX,
      drawY,
      drawW,
      drawH
    );

    onProgress?.("Selesai!", 100);
    return outCanvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(rawUrl);
  }
}

/**
 * Composites a transparent cutout Data URL either as pure transparent PNG
 * or onto the standardized D'Oleh-Oleh Dieng warm highland catalog template.
 */
export async function renderStudioProductImage(
  cutoutDataUrl: string,
  options: StudioProcessOptions
): Promise<{ dataUrl: string; file: File }> {
  const size = 800;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  const img = await loadImage(cutoutDataUrl);

  if (options.mode === "transparent") {
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, 0, 0, size, size);
  } else {
    // Template Katalog D'Oleh-Oleh ("Dieng Highland Craft")
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, "#FAF8F3");
    bgGrad.addColorStop(0.55, "#F3EFE6");
    bgGrad.addColorStop(1, "#EAE4D7");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Subtle botanical highland accent stripe at top
    ctx.fillStyle = "#163826";
    ctx.fillRect(0, 0, size, 14);
    ctx.fillStyle = "#D97706";
    ctx.fillRect(0, 14, size, 5);

    // Subtle inner hairline frame
    ctx.strokeStyle = "rgba(28, 25, 23, 0.08)";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 34, size - 48, size - 58);

    // Soft elliptical contact shadow under product
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(size / 2, size * 0.80, size * 0.25, size * 0.038, 0, 0, Math.PI * 2);
    const shadowGrad = ctx.createRadialGradient(
      size / 2,
      size * 0.80,
      10,
      size / 2,
      size * 0.80,
      size * 0.25
    );
    shadowGrad.addColorStop(0, "rgba(28, 25, 23, 0.22)");
    shadowGrad.addColorStop(1, "rgba(28, 25, 23, 0)");
    ctx.fillStyle = shadowGrad;
    ctx.fill();
    ctx.restore();

    // Draw centered product cutout (76% frame fill)
    const pad = size * 0.10;
    ctx.drawImage(img, pad, pad - 12, size - pad * 2, size - pad * 2);

    // Brand tag at top-right
    ctx.save();
    ctx.fillStyle = "#163826";
    roundRect(ctx, size - 230, 44, 190, 40, 10);
    ctx.fill();
    ctx.fillStyle = "#FDE68A";
    ctx.font = "800 17px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("D'OLEH-OLEH", size - 135, 64);
    ctx.restore();

    // Optional weight/pack badge at bottom-left
    if (options.packBadge && options.packBadge.trim()) {
      const label = options.packBadge.trim();
      ctx.save();
      ctx.font = "700 20px sans-serif";
      const textW = Math.min(340, ctx.measureText(label).width + 38);
      ctx.fillStyle = "#D97706";
      roundRect(ctx, 42, size - 86, textW, 44, 10);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 61, size - 64);
      ctx.restore();
    }
  }

  const mimeType = options.mode === "transparent" ? "image/png" : "image/webp";
  const ext = options.mode === "transparent" ? "png" : "webp";
  const quality = options.mode === "transparent" ? 1 : 0.9;
  const dataUrl = canvas.toDataURL(mimeType, quality);

  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const file = new File([blob], `studio-${Date.now()}.${ext}`, { type: mimeType });

  return { dataUrl, file };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
