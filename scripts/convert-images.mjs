import sharp from "sharp";
import convert from "heic-convert";
import fs from "node:fs";

fs.mkdirSync("public/produtos", { recursive: true });
fs.mkdirSync("public/produtos/thumbs", { recursive: true });

async function convertHeicToJpeg(inputPath) {
  const inputBuffer = fs.readFileSync(inputPath);
  const outputBuffer = await convert({
    buffer: inputBuffer,
    format: "JPEG",
    quality: 0.9,
  });
  return outputBuffer;
}

async function processImage(input, baseName, isHeic = false) {
  const mainPath = `public/produtos/${baseName}.webp`;
  const thumbPath = `public/produtos/thumbs/${baseName}.webp`;

  let pipeline;
  if (isHeic) {
    const jpegBuffer = await convertHeicToJpeg(input);
    pipeline = sharp(jpegBuffer);
  } else {
    pipeline = sharp(input);
  }

  await pipeline
    .clone()
    .resize({ width: 1600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(mainPath);

  await pipeline
    .clone()
    .resize({ width: 600, withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(thumbPath);

  console.log(`Gerado com sucesso: ${baseName}.webp`);
}

async function run() {
  const files = [
    { src: "photo_2026-11-10_17-40-43.jpg", name: "material-01", heic: false },
    { src: "photo_2026-11-10_17-40-48.jpg", name: "material-02", heic: false },
    { src: "photo_2026-11-10_17-40-57.jpg", name: "material-03", heic: false },
    { src: "photo_2026-11-10_17-41-02.jpg", name: "material-04", heic: false },
    { src: "photo_2026-11-10_17-41-07.jpg", name: "material-05", heic: false },
    { src: "748F72A0-21C7-4DDD-AA34-5D0637C73FA4.HEIC", name: "material-heic-01", heic: true },
    { src: "8CC63CAC-6F61-48BF-8AFC-E9147A68DA10.HEIC", name: "material-heic-02", heic: true },
    { src: "A89C1ADB-BDD0-42E6-A070-0DAF41AB8EE3.HEIC", name: "material-heic-03", heic: true },
    { src: "B0AEF903-7F53-47E0-8DB8-ACA2E18CF2BE.HEIC", name: "material-heic-04", heic: true },
    { src: "CD99C69A-91E3-4B11-AC06-F39FAD7D8DCE.HEIC", name: "material-heic-05", heic: true },
    { src: "DC0635A1-CE0C-4D3F-AC3D-A9189BF325A4.HEIC", name: "material-heic-06", heic: true },
    { src: "F9F08DC2-5D81-4329-B74E-C6B165ED2049.HEIC", name: "material-heic-07", heic: true },
  ];

  for (const item of files) {
    try {
      await processImage(`backup-fotos/originais/${item.src}`, item.name, item.heic);
    } catch (err) {
      console.error(`Erro ao processar ${item.src}:`, err.message);
    }
  }
}

run();
