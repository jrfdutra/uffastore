import fs from "node:fs";
import crypto from "node:crypto";

function computeHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  return crypto.createHash("sha256").update(fileBuffer).digest("hex");
}

const files = fs.readdirSync("public/produtos").filter((f) => f.endsWith(".webp"));
const seen = new Map();
const duplicates = [];

for (const f of files) {
  const p = `public/produtos/${f}`;
  const h = computeHash(p);
  if (seen.has(h)) {
    duplicates.push({ original: seen.get(h), duplicate: f });
  } else {
    seen.set(h, f);
  }
}

console.log("Total de imagens WebP processadas:", files.length);
console.log("Duplicadas exatas encontradas:", duplicates.length);
if (duplicates.length > 0) {
  console.log("Lista de duplicados:", duplicates);
} else {
  console.log("Nenhum duplicado exato encontrado! Todas as imagens são únicas.");
}
