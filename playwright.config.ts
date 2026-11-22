import { defineConfig, devices } from "@playwright/test";

/**
 * Testes E2E da loja UFFA.
 *
 * - Corre contra o servidor de desenvolvimento (`npm run dev`, porta 8080).
 * - O checkout da Shopify é sempre simulado (route interception): nenhum
 *   pagamento real é efetuado e nenhum dado de cartão é usado.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  forbidOnly: !!process.env.CI,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "off",
    locale: "pt-PT",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } },
      grepInvert: /@mobile/,
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
      grep: /@mobile/,
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:8080",
    reuseExistingServer: true,
    timeout: 180_000,
    // Segredos de teste: os endpoints fail-closed devem poder ser exercitados sem .env.
    env: {
      ...process.env,
      CRON_SECRET: process.env.CRON_SECRET ?? "cron-de-teste-com-mais-de-16-caracteres",
      NPS_SECRET: process.env.NPS_SECRET ?? "nps-de-teste-com-mais-de-16-caracteres",
    },
  },
});
