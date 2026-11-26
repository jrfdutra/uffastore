import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const res = await fetch("https://www.uffastore.pt/catalogo");
const html = await res.text();
const productPaths = [
  ...new Set([...html.matchAll(/href="(\/produto\/[^"]+)"/g)].map((m) => m[1])),
];
const today = new Date().toISOString().slice(0, 10);

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0" },
  { loc: "/catalogo", changefreq: "weekly", priority: "0.9" },
  { loc: "/ajuda", changefreq: "monthly", priority: "0.6" },
  { loc: "/rastreio", changefreq: "monthly", priority: "0.5" },
  { loc: "/privacidade", changefreq: "yearly", priority: "0.3" },
  { loc: "/termos", changefreq: "yearly", priority: "0.3" },
];

const entries = [
  ...staticPages,
  ...productPaths.map((path) => ({ loc: path, changefreq: "weekly", priority: "0.7" })),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>https://www.uffastore.pt${e.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`;

await writeFile(resolve(import.meta.dirname, "../public/sitemap.xml"), xml, "utf8");
console.log(`Sitemap atualizado: ${entries.length} URLs (${productPaths.length} produtos)`);
