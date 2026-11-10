// A config base já inclui: tanstackStart, viteReact, tailwindcss, tsconfig paths,
// nitro (build), alias "@" e dedupe de React/TanStack. Não adicionar estes plugins
// manualmente para evitar duplicados. Config extra via defineConfig({ vite: { ... } }).
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Usa src/server.ts como entrada do servidor (wrapper de erros SSR).
    server: { entry: "server" },
  },
  nitro: {
    // Garante o preset correto para o Vercel (sem depender de auto-deteção).
    preset: "vercel",
  },
});
