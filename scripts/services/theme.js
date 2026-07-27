const MAX_IMAGE_EDGE = 1600;
const MAX_IMAGE_BYTES = 2_400_000;

export async function prepareThemeImage(file) {
  const isImage = file?.type?.startsWith("image/") || /\.(avif|heic|heif|jpe?g|png|webp)$/i.test(file?.name || "");
  if (!file || !isImage) {
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
      ...buildThemeProfile(canvas)
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

function buildThemeProfile(sourceCanvas) {
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = 32;
  sampleCanvas.height = 32;
  const sampleContext = sampleCanvas.getContext("2d", { alpha: false });
  if (!sampleContext) {
    return { tone: "dark", palette: {}, recommendation: "深色照片主题" };
  }
  sampleContext.drawImage(sourceCanvas, 0, 0, 32, 32);
  const sample = sampleContext.getImageData(0, 0, 32, 32).data;
  let luminance = 0;
  const hueWeights = Array.from({ length: 36 }, () => 0);
  for (let index = 0; index < sample.length; index += 4) {
    const red = sample[index];
    const green = sample[index + 1];
    const blue = sample[index + 2];
    const lightness = red * 0.2126 + green * 0.7152 + blue * 0.0722;
    luminance += lightness;
    const { hue, saturation, value } = rgbToHsv(red, green, blue);
    if (saturation > 0.18 && value > 0.14 && value < 0.9) {
      hueWeights[Math.floor(hue / 10) % hueWeights.length] += saturation * (1 - Math.abs(value - 0.5));
    }
  }
  const averageLuminance = luminance / (sample.length / 4);
  const tone = averageLuminance >= 155 ? "light" : "dark";
  const hueIndex = hueWeights.reduce((best, weight, index) => (weight > hueWeights[best] ? index : best), 20);
  const hue = hueWeights[hueIndex] ? hueIndex * 10 + 5 : 34;

  return {
    tone,
    palette: buildPalette(hue, tone),
    recommendation: getRecommendation(hue, tone)
  };
}

function buildPalette(hue, tone) {
  const color = (saturation, lightness) => `hsl(${hue} ${saturation}% ${lightness}%)`;
  if (tone === "light") {
    return {
      "--bg": color(24, 96),
      "--surface": color(28, 99),
      "--surface-strong": color(22, 100),
      "--surface-muted": color(30, 91),
      "--text": color(26, 16),
      "--text-muted": color(18, 36),
      "--text-soft": color(16, 50),
      "--text-inverse": "#fffdf8",
      "--accent": color(55, 39),
      "--accent-strong": color(61, 27),
      "--accent-soft": color(55, 88),
      "--accent-warm": color(65, 40),
      "--accent-warm-soft": color(58, 91),
      "--line": color(22, 84),
      "--line-strong": color(24, 74)
    };
  }

  return {
    "--bg": color(22, 10),
    "--surface": color(20, 15),
    "--surface-strong": color(20, 19),
    "--surface-muted": color(22, 24),
    "--text": color(24, 96),
    "--text-muted": color(18, 76),
    "--text-soft": color(16, 59),
    "--text-inverse": "#fffaf4",
    "--accent": color(60, 66),
    "--accent-strong": color(68, 79),
    "--accent-soft": color(35, 28),
    "--accent-warm": color(70, 69),
    "--accent-warm-soft": color(37, 25),
    "--line": color(18, 29),
    "--line-strong": color(20, 39)
  };
}

function getRecommendation(hue, tone) {
  const name = hue < 20 || hue >= 340
    ? "玫瑰暮光"
    : hue < 50
      ? "琥珀暖光"
      : hue < 95
        ? "橄榄原野"
        : hue < 170
          ? "青绿清风"
          : hue < 250
            ? "深海蓝调"
            : hue < 320
              ? "紫雾夜色"
              : "玫瑰暮光";
  return `${name} · ${tone === "light" ? "明亮模式" : "夜色模式"}`;
}

function rgbToHsv(red, green, blue) {
  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const maximum = Math.max(r, g, b);
  const minimum = Math.min(r, g, b);
  const delta = maximum - minimum;
  let hue = 0;
  if (delta) {
    if (maximum === r) hue = 60 * (((g - b) / delta) % 6);
    else if (maximum === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
  }
  return { hue: (hue + 360) % 360, saturation: maximum ? delta / maximum : 0, value: maximum };
}

function estimateDataUrlBytes(dataUrl) {
  return Math.floor((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);
}
