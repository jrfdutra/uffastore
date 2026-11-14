// Recorta a fotografia do Vomero para 4:5 centrada no ténis.
// Uso: node scripts/crop-vomero-4x5.mjs <entrada> <saida> [offsetY]
import sharp from "sharp";
import { resolve } from "node:path";

const [, , input, output, offsetArg] = process.argv;

if (!input || !output) {
  console.error("Uso: node scripts/crop-vomero-4x5.mjs <entrada> <saida> [offsetY]");
  process.exit(1);
}

const image = sharp(resolve(input));
const meta = await image.metadata();
console.log(`Original: ${meta.width}x${meta.height}`);

const width = meta.width;
const height = Math.round((width * 5) / 4);
const maxOffset = Math.max(0, meta.height - height);
const offsetY = Math.min(Math.max(0, Number(offsetArg ?? Math.round(maxOffset / 2))), maxOffset);

console.log(`Recorte: ${width}x${height} com offsetY=${offsetY}`);

await sharp(resolve(input))
  .extract({ left: 0, top: offsetY, width, height })
  .webp({ quality: 90 })
  .toFile(resolve(output));

const out = await sharp(resolve(output)).metadata();
console.log(`Gerado: ${output} (${out.width}x${out.height}, ${out.format})`);
