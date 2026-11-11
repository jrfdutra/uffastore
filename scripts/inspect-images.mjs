import sharp from "sharp";
import fs from "node:fs";

async function run() {
  const files = fs.readdirSync("backup-fotos/originais");
  for (const f of files) {
    if (f.endsWith(".HEIC") || f.endsWith(".jpg")) {
      try {
        const meta = await sharp(`backup-fotos/originais/${f}`).metadata();
        console.log(f, meta.format, meta.width, meta.height);
      } catch (err) {
        console.log(f, "ERRO:", err.message);
      }
    }
  }
}

run();
