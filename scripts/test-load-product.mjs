import { loadProduct } from "../src/lib/catalog.ts";
try {
  const p = await loadProduct("teste");
  console.log("loadProduct('teste') result:", p);
} catch (e) {
  console.error("Erro:", e);
}
