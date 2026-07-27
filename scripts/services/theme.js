const MAX_IMAGE_EDGE = 1600;
const MAX_IMAGE_BYTES = 2_400_000;

export async function prepareThemeImage(file) {
  if (!(file instanceof File) || !file.type.startsWith("image/")) {
    throw new Error("请选择一张图片");
  }

  const sourceUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(sourceUrl);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) {
      throw new Error("当前设备无法处理这张图片");
    }

    context.drawImage(image, 0, 0, width, height);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.82);
    if (estimateDataUrlBytes(imageDataUrl) > MAX_IMAGE_BYTES) {
      throw new Error("图片仍然过大，请选择一张更小的照片");
    }

    return {
      imageDataUrl,
      tone: getThemeTone(canvas)
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("这张图片无法读取，请换一张再试"));
    image.src = url;
  });
}

function getThemeTone(sourceCanvas) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 32;
  sampleCanvas.height = 32;
  const sampleContext = sampleCanvas.getContext("2d", { alpha: false });
  if (!sampleContext) {
    return "dark";
  }
  sampleContext.drawImage(sourceCanvas, 0, 0, 32, 32);
  const sample = sampleContext.getImageData(0, 0, 32, 32).data;
  let luminance = 0;
  for (let index = 0; index < sample.length; index += 4) {
    luminance += sample[index] * 0.2126 + sample[index + 1] * 0.7152 + sample[index + 2] * 0.0722;
  }
  return luminance / (sample.length / 4) >= 155 ? "light" : "dark";
}

function estimateDataUrlBytes(dataUrl) {
  return Math.floor((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
}
