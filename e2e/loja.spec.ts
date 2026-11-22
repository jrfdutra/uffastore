import { test, expect, type Page } from "@playwright/test";

/**
 * Fluxo de compra ponta a ponta da UFFA Store.
 *
 * Nenhum pagamento real acontece: as chamadas GraphQL à Shopify para criar o
 * checkout são intercetadas e respondem com dados simulados.
 */

const PENDING_KEY = "uffa-pending-checkout-v1";
const CART_KEY = "uffa-cart";
const MOCK_CHECKOUT_URL = "https://mock-shopify.test/checkout?token=abc123";

/** Produto real da loja com todas as variantes em stock (confirmado via API). */
const PRODUTO_COM_STOCK = "nike-air-force-branco-laranja";

/**
 * O aviso de "versão demo" abre como modal na primeira visita e bloqueia
 * cliques. Marcamo-lo como visto antes de cada teste.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    try {
      window.sessionStorage.setItem("uffa-demo-notice-v1", "1");
    } catch {
      /* ignorar */
    }
  });
});

/** Limpa o estado local da loja (carrinho, cupão, encomenda pendente). */
async function limparEstado(page: Page) {
  await page.goto("/");
  await page.evaluate(() => window.localStorage.clear());
}

/** Interceta o GraphQL da Shopify: só o cartCreate é simulado. */
async function mockShopify(page: Page, mode: "ok" | "erro" = "ok") {
  await page.route("**/graphql.json", async (route) => {
    const body = route.request().postData() ?? "";
    if (!body.includes("cartCreate")) return route.continue();

    if (mode === "erro") {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ errors: [{ message: "Shopify indisponível (simulado)" }] }),
      });
    }

    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: { cartCreate: { cart: { checkoutUrl: MOCK_CHECKOUT_URL }, userErrors: [] } },
      }),
    });
  });

  // Página final do checkout simulado (para onde o browser é redirecionado).
  await page.route("https://mock-shopify.test/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html; charset=utf-8",
      body: "<!doctype html><title>Checkout simulado</title><h1>Checkout simulado da Shopify</h1>",
    }),
  );
}

/** Abre a página de um produto que se sabe ter stock. */
async function abrirProduto(page: Page, handle = PRODUTO_COM_STOCK) {
  await page.goto(`/produto/${handle}`);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
}

/**
 * Escolhe o primeiro tamanho disponível e adiciona ao carrinho.
 * Repete as interações até a hidratação do React estar concluída (SSR primeiro).
 */
async function adicionarAoCarrinho(page: Page) {
  const seletorTamanho = page.getByRole("combobox", { name: "Seleciona um tamanho" });
  await expect(seletorTamanho).toBeEnabled();

  await expect(async () => {
    await seletorTamanho.click();
    await expect(page.getByRole("listbox")).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 30_000 });

  // Teclado em vez de clique: evita problemas de estabilidade/scroll do dropdown.
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).toBeHidden();

  await expect(async () => {
    await page.getByRole("button", { name: "Adicionar ao carrinho" }).click();
    await expect(page.getByRole("button", { name: /^Carrinho \(1\)/ })).toBeVisible({
      timeout: 2000,
    });
  }).toPass({ timeout: 30_000 });
}

async function abrirCarrinho(page: Page) {
  await page.getByRole("button", { name: /^Carrinho \(/ }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("Loja — navegação e catálogo", () => {
  test("a homepage carrega e o menu leva ao catálogo", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Uffa/i);
    await expect(page.getByRole("link", { name: "UFFA Store — Início" }).first()).toBeVisible();

    await page.getByRole("link", { name: "Nike" }).first().click();
    await page.waitForURL(/\/catalogo/);
    await expect(page.getByPlaceholder("Pesquisar sneakers")).toBeVisible();
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("o filtro de cores encontra sapatilhas com as cores da Shopify", async ({ page }) => {
    await page.goto("/catalogo");

    // A Shopify guarda cores como "Preta", "Branco e Laranja" ou "All Black".
    // O filtro tem de as reconhecer através dos botões Preto e Branco.
    for (const cor of ["Preto", "Branco"]) {
      await expect(async () => {
        await page.getByTitle(cor, { exact: true }).click();
        await expect(page.getByText("Sem produtos encontrados.")).toBeHidden();
        expect(await page.locator("article").count()).toBeGreaterThan(0);
      }).toPass({ timeout: 30_000 });
    }
  });

  test("a pesquisa de modelos na homepage encontra resultados", async ({ page }) => {
    await page.goto("/");
    const pesquisa = page.getByPlaceholder(/Pesquisar modelos/);
    await expect(pesquisa).toBeVisible();

    // Repete até o React estar hidratado (o valor só persiste depois disso).
    await expect(async () => {
      await pesquisa.fill("dunk");
      await expect(page.getByText(/modelos encontrados/)).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    await expect(page.locator('#pesquisa a[href^="/produto/"]').first()).toBeVisible();
  });

  test("a Nike aparece em primeiro lugar nas marcas", async ({ page }) => {
    await page.goto("/");
    const navegacao = page.getByRole("navigation").first();
    const marcas = await navegacao.getByRole("link").allTextContents();
    expect(marcas.indexOf("Nike")).toBe(0);
    expect(marcas.indexOf("Adidas")).toBe(1);

    const quadros = page.locator("section").filter({ hasText: "Escolhe a tua marca" });
    await expect(quadros.getByRole("link").first()).toContainText("Nike");
  });

  test("a numeração dos tamanhos acompanha a marca selecionada", async ({ page }) => {
    await page.goto("/catalogo?brand=nike");
    const escalaoNike = page.locator("fieldset").filter({ hasText: "Escalão de Tamanho" });
    await expect(escalaoNike.getByRole("button", { name: "Todos", exact: true })).toHaveCount(0);
    await expect(escalaoNike.getByRole("button", { name: /Criança/ })).toBeVisible();
    await expect(escalaoNike.getByRole("button", { name: /GS/ })).toBeVisible();
    await expect(escalaoNike.getByRole("button", { name: /Sénior/ })).toBeVisible();
    await expect(escalaoNike.getByRole("button", { name: "36.5", exact: true })).toHaveCount(0);

    // O dropdown só responde depois da hidratação (o HTML vem do SSR).
    await expect(async () => {
      await escalaoNike.getByRole("combobox", { name: "Tamanho" }).click();
      await expect(page.getByRole("option", { name: "36.5", exact: true })).toBeVisible({
        timeout: 2000,
      });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole("option", { name: "36 ⅔", exact: true })).toHaveCount(0);

    await page.getByRole("option", { name: "42", exact: true }).click();
    const com42 = page.locator("article");
    await expect(com42.first()).toBeVisible();
    expect(await com42.count()).toBeLessThan(21);

    await page.goto("/catalogo?brand=adidas");
    const escalaoAdidas = page.locator("fieldset").filter({ hasText: "Escalão de Tamanho" });
    await expect(async () => {
      await escalaoAdidas.getByRole("combobox", { name: "Tamanho" }).click();
      await expect(page.getByRole("option", { name: "36 ⅔", exact: true })).toBeVisible({
        timeout: 2000,
      });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole("option", { name: "36.5", exact: true })).toHaveCount(0);
  });

  test("cada marca mostra as suas subcategorias de modelo e filtra os produtos", async ({
    page,
  }) => {
    await page.goto("/catalogo?brand=nike");
    const modelosNike = page.locator("fieldset").filter({ hasText: "Modelo" });
    await expect(modelosNike.getByRole("button", { name: /^Air Force/ })).toBeVisible();
    await expect(modelosNike.getByRole("button", { name: /^Dunk/ })).toBeVisible();
    await expect(modelosNike.getByRole("button", { name: /^Vomero 5/ })).toBeVisible();

    // O clique só tem efeito depois da hidratação do React (o HTML vem do SSR).
    await expect(async () => {
      await modelosNike.getByRole("button", { name: /^Dunk/ }).click();
      await expect(page).toHaveURL(/model=dunk/, { timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    const dunks = page.locator("article");
    await expect(dunks.first()).toBeVisible();
    expect(await dunks.count()).toBe(5);

    await page.goto("/catalogo?brand=adidas");
    const modelosAdidas = page.locator("fieldset").filter({ hasText: "Modelo" });
    await expect(modelosAdidas.getByRole("button", { name: /^Campus 00/ })).toBeVisible();
    await expect(modelosAdidas.getByRole("button", { name: /^Superstar/ })).toBeVisible();
    await expect(modelosAdidas.getByRole("button", { name: /^Dunk/ })).toHaveCount(0);
  });

  test("sapatilhas com rope laces aparecem sempre em primeiro", async ({ page }) => {
    await page.goto("/catalogo");
    await expect(page.locator("article").first()).toContainText(/Rope Laces/i);

    await page.goto("/catalogo?brand=nike&model=dunk");
    await expect(page.locator("article").first()).toContainText(/Rope Laces/i);

    await page.goto("/");
    const pesquisa = page.getByPlaceholder(/Pesquisar modelos/);
    await expect(async () => {
      await pesquisa.fill("air force");
      await expect(page.locator('#pesquisa a[href^="/produto/"]').first()).toContainText(
        /Rope Laces/i,
      );
    }).toPass({ timeout: 30_000 });
  });

  test("o catálogo lista produtos e a pesquisa filtra resultados", async ({ page }) => {
    await page.goto("/catalogo");
    const cartoes = page.locator("article");
    await expect(cartoes.first()).toBeVisible();
    const total = await cartoes.count();
    expect(total).toBeGreaterThan(5);

    const pesquisa = page.getByPlaceholder("Pesquisar sneakers");

    // Repete até o React estar hidratado (o valor só persiste depois disso).
    await expect(async () => {
      await pesquisa.fill("zzzzzzzz");
      await expect(page.locator("article")).toHaveCount(0, { timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    await expect(async () => {
      await pesquisa.fill("dunk");
      const filtrados = await page.locator("article").count();
      expect(filtrados).toBeGreaterThan(0);
      expect(filtrados).toBeLessThan(total);
    }).toPass({ timeout: 30_000 });
  });

  test("a página de produto mostra tamanhos, preço e permite escolher", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await expect(page.getByRole("combobox", { name: "Seleciona um tamanho" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Adicionar ao carrinho|Seleciona um tamanho/ }),
    ).toBeVisible();
  });

  test("produto inexistente não rebenta a aplicação", async ({ page }) => {
    await page.goto("/produto/nao-existe-este-produto");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Carrinho", () => {
  test("adicionar, aumentar quantidade e remover", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await adicionarAoCarrinho(page);

    await abrirCarrinho(page);
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: "Aumentar quantidade" }).click();
    await expect(dialog.locator("span.w-8").first()).toHaveText("2");

    await dialog.getByRole("button", { name: "Remover" }).click();
    await expect(dialog.getByText("O teu carrinho está vazio.")).toBeVisible();

    // Fecha o drawer para o botão do cabeçalho voltar à árvore de acessibilidade.
    await page.keyboard.press("Escape");
    await expect(page.getByRole("button", { name: /^Carrinho \(0\)/ })).toBeVisible();
  });

  test("o carrinho sobrevive a um refresh", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await adicionarAoCarrinho(page);

    await page.reload();
    await expect(page.getByRole("button", { name: /^Carrinho \(1\)/ })).toBeVisible();
    const guardado = await page.evaluate((key) => window.localStorage.getItem(key), CART_KEY);
    expect(guardado).toBeTruthy();
  });

  test("itens de produtos removidos não ficam contados no carrinho", async ({ page }) => {
    await page.addInitScript((key) => {
      window.localStorage.setItem(
        key,
        JSON.stringify([
          { productId: "produto-descontinuado", size: 42, quantity: 1, unitPrice: 99 },
        ]),
      );
    }, CART_KEY);

    await page.goto("/");
    await expect(page.getByRole("button", { name: /^Carrinho \(0\)/ })).toBeVisible();
    await expect
      .poll(() => page.evaluate((key) => window.localStorage.getItem(key), CART_KEY))
      .toBe("[]");

    await page.getByRole("button", { name: /^Carrinho \(0\)/ }).click();
    await expect(page.getByText("O teu carrinho está vazio.")).toBeVisible();
  });
});

test.describe("Cupões", () => {
  test("cupão inválido é rejeitado e cupão válido aplica 10%", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await abrirCarrinho(page);

    const dialog = page.getByRole("dialog");
    const campo = dialog.getByPlaceholder("Código de desconto");

    await campo.fill("NAOEXISTE");
    await dialog.getByRole("button", { name: "Aplicar" }).click();
    await expect(page.getByText("Cupão inválido ou expirado.")).toBeVisible();
    await expect(dialog.getByText(/Cupão:/)).toHaveCount(0);

    await campo.fill("UFFA10");
    await dialog.getByRole("button", { name: "Aplicar" }).click();
    await expect(dialog.getByText("Cupão: UFFA10 (-10%)")).toBeVisible();
  });
});

test.describe("Checkout", () => {
  test("carrinho vazio mostra o estado vazio e não permite pagar", async ({ page }) => {
    await limparEstado(page);
    await page.goto("/checkout");
    await expect(page.getByText("O teu carrinho está vazio.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Pagar agora" })).toHaveCount(0);
  });

  test("campos obrigatórios impedem o envio", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await page.goto("/checkout");

    await expect(page.getByRole("button", { name: "Pagar agora" })).toBeVisible();
    await page.getByRole("button", { name: "Pagar agora" }).click();

    // Validação nativa do browser: continua no checkout e o primeiro campo é inválido.
    await expect(page).toHaveURL(/\/checkout/);
    const nomeInvalido = await page.evaluate(() => {
      const campo = document.querySelector<HTMLInputElement>("form input[required]");
      return campo ? !campo.checkValidity() : false;
    });
    expect(nomeInvalido).toBe(true);
  });

  test("e-mail inválido é bloqueado pela validação do formulário", async ({ page }) => {
    await limparEstado(page);
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await page.goto("/checkout");

    await page.getByPlaceholder("Ex: João").fill("João");
    await page.getByPlaceholder("Ex: Silva").fill("Silva");
    await page.getByPlaceholder("joao@exemplo.com").fill("nao-e-email");
    await page.getByPlaceholder("912 345 678").fill("912345678");
    await page.getByRole("button", { name: "Pagar agora" }).click();

    await expect(page).toHaveURL(/\/checkout/);
    const emailInvalido = await page.evaluate(() => {
      const campo = document.querySelector<HTMLInputElement>('form input[type="email"]');
      return campo ? !campo.checkValidity() : false;
    });
    expect(emailInvalido).toBe(true);
  });

  test("falha da Shopify mostra mensagem de erro e mantém o carrinho", async ({ page }) => {
    await limparEstado(page);
    await mockShopify(page, "erro");
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await page.goto("/checkout");

    await page.getByPlaceholder("Ex: João").fill("João");
    await page.getByPlaceholder("Ex: Silva").fill("Silva");
    await page.getByPlaceholder("joao@exemplo.com").fill("joao@exemplo.com");
    await page.getByPlaceholder("912 345 678").fill("912345678");
    await page.getByRole("button", { name: "Pagar agora" }).click();

    await expect(page.getByText(/Shopify indisponível \(simulado\)/)).toBeVisible();
    await expect(page).toHaveURL(/\/checkout/);
    await expect(page.getByRole("button", { name: /^Carrinho \(1\)/ })).toBeVisible();
  });

  test("sucesso guarda a compra e redireciona para o checkout da Shopify", async ({ page }) => {
    await limparEstado(page);
    await mockShopify(page, "ok");
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await page.goto("/checkout");

    await page.getByPlaceholder("Ex: João").fill("João");
    await page.getByPlaceholder("Ex: Silva").fill("Silva");
    await page.getByPlaceholder("joao@exemplo.com").fill("joao@exemplo.com");
    await page.getByPlaceholder("912 345 678").fill("912345678");
    await page.getByRole("button", { name: "Pagar agora" }).click();

    await page.waitForURL(/mock-shopify\.test/, { timeout: 30_000 });
    expect(page.url()).toContain("skip_shop_pay=true");
    expect(page.url()).toContain("return_url=");

    // A compra fica guardada no localStorage da origem da loja (não da Shopify).
    const estado = await page.context().storageState();
    const origem = estado.origins.find((item) => item.origin.includes("localhost:8080"));
    const guardado = origem?.localStorage.find((item) => item.name === PENDING_KEY)?.value;
    expect(guardado).toBeTruthy();
    const dados = JSON.parse(guardado as string);
    expect(dados.customerName).toBe("João Silva");
    expect(dados.email).toBe("joao@exemplo.com");
    expect(dados.items.length).toBeGreaterThan(0);
    expect(dados.items[0].quantity).toBe(1);
  });

  test("o local de recolha escolhido fica guardado na compra", async ({ page }) => {
    await limparEstado(page);
    await mockShopify(page, "ok");
    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await page.goto("/checkout", { waitUntil: "networkidle" });

    const locais = page.getByTestId("pickup-locations");
    await expect(locais.getByRole("button", { name: /NorteShopping/ })).toBeVisible();
    await expect(locais.getByRole("button", { name: /Maia Jardim/ })).toBeVisible();
    await locais.getByRole("button", { name: /MarShopping/ }).click();

    await page.getByPlaceholder("Ex: João").fill("João");
    await page.getByPlaceholder("Ex: Silva").fill("Silva");
    await page.getByPlaceholder("joao@exemplo.com").fill("joao@exemplo.com");
    await page.getByPlaceholder("912 345 678").fill("912345678");
    await page.getByRole("button", { name: "Pagar agora" }).click();

    await page.waitForURL(/mock-shopify\.test/, { timeout: 30_000 });
    const estado = await page.context().storageState();
    const origem = estado.origins.find((item) => item.origin.includes("localhost:8080"));
    const guardado = origem?.localStorage.find((item) => item.name === PENDING_KEY)?.value;
    expect(guardado).toBeTruthy();
    expect(JSON.parse(guardado as string).pickupLocation).toBe("MarShopping");
  });
});

test.describe("Confirmação", () => {
  test("mostra os detalhes da compra pendente", async ({ page }) => {
    await limparEstado(page);
    const pendente = {
      at: new Date().toISOString(),
      customerName: "Maria Teste",
      email: "maria@exemplo.com",
      deliveryKey: "pickup",
      deliveryLabel: "Receber em mão no Porto",
      items: [
        {
          productId: PRODUTO_COM_STOCK,
          name: "Nike Air Force 1",
          size: 42,
          quantity: 1,
          unitPrice: 120,
        },
      ],
      subtotal: 120,
      shipping: 0,
      total: 120,
    };
    await page.addInitScript(([key, valor]) => window.localStorage.setItem(key, valor), [
      PENDING_KEY,
      JSON.stringify(pendente),
    ] as const);

    await page.goto("/confirmacao");
    await expect(page.getByText("Maria Teste")).toBeVisible();
    await expect(page.getByText("Nike Air Force 1")).toBeVisible();
    await expect(page.getByText(/120,00/).first()).toBeVisible();
  });

  test("sem compra pendente a página continua a funcionar", async ({ page }) => {
    await limparEstado(page);
    await page.goto("/confirmacao");
    await expect(page.getByRole("heading", { name: /Obrigado/i })).toBeVisible();
  });
});

test.describe("Expedição e link mágico", () => {
  test("a página interna regista o tracking e mostra o link enviado", async ({ page }) => {
    let sentToken = "";
    await page.route("**/api/orders/tracking", async (route) => {
      sentToken = route.request().headers()["x-admin-token"] ?? "";
      const body = JSON.parse(route.request().postData() ?? "") as Record<string, string>;
      expect(body["trackingCode"]).toBe("RR123456789PT");
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          emailSent: true,
          trackingUrl: "https://www.uffastore.pt/rastreio?token=token-de-teste",
        }),
      });
    });

    await page.goto("/expedicao");
    await expect(async () => {
      await page.getByLabel("Token interno").fill("segredo-local");
      await page.getByLabel("Número da encomenda").fill("UFFA-48217");
      await page.getByLabel("E-mail do cliente").fill("cliente@exemplo.pt");
      await page.getByLabel("Código de rastreio").fill("RR123456789PT");
      await page.getByRole("button", { name: "Registar e enviar e-mail" }).click();
      await expect(page.getByText("Envio registado e e-mail enviado.")).toBeVisible({
        timeout: 2_000,
      });
    }).toPass({ timeout: 30_000 });

    expect(sentToken).toBe("segredo-local");
    await expect(
      page.getByText("https://www.uffastore.pt/rastreio?token=token-de-teste"),
    ).toBeVisible();
  });

  test("o link mágico mostra o envio e o atalho para o CTT", async ({ page }) => {
    await page.route("**/api/orders/tracking?token=*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          order: {
            orderNumber: "UFFA-48217",
            trackingCode: "RR123456789PT",
            carrier: "CTT Expresso",
            estimatedDelivery: "2026-11-25",
            issuedAt: Date.parse("2026-11-22T12:00:00.000Z"),
            expiresAt: Date.parse("2026-12-06T12:00:00.000Z"),
          },
        }),
      });
    });

    await page.goto("/rastreio?token=token-de-teste");
    await expect(page.getByRole("heading", { name: "UFFA-48217" })).toBeVisible();

    const link = page.getByRole("link", { name: "Ver no CTT" });
    await expect(link).toBeVisible();
    expect(await link.getAttribute("href")).toContain("objects=RR123456789PT");
  });
});

test.describe("Rastreio", () => {
  test("encomenda CTT mostra atalho com o código pré-preenchido", async ({ page }) => {
    await limparEstado(page);
    await page.goto("/rastreio");
    await page.getByLabel("Número da encomenda").fill("UFFA-48217");
    await page.getByLabel("Email ou telefone").fill("demo@uffa.pt");
    await page.getByLabel("Código de exclusividade").fill("UFFA-7K3M-9QX2");
    await page.getByRole("button", { name: "Desbloquear encomenda" }).click();

    const link = page.getByRole("link", { name: "Ver no CTT" });
    await expect(link).toBeVisible();
    const href = await link.getAttribute("href");
    expect(href).toContain("objects=PT-48217-9QX2");
    expect(href).toContain("request_locale=pt");
  });
});

test.describe("Pesquisa de satisfação", () => {
  test("sem token a página de avaliação indica que o link não é válido", async ({ page }) => {
    await page.goto("/avaliar");
    await expect(page.getByRole("heading", { name: "Link indisponível" })).toBeVisible();
  });

  test("o servidor rejeita tokens inválidos e pedidos ao cron sem segredo", async ({ request }) => {
    const nps = await request.get("/api/nps?token=token-invalido");
    expect(nps.status()).toBe(401);

    const cron = await request.get("/api/cron/nps");
    expect(cron.status()).toBe(401);
  });

  test("o cliente dá uma nota de 0 a 5 e deixa um comentário", async ({ page }) => {
    let guardado: { token: string; score: number; comment: string } | null = null;
    await page.route(
      (url) => url.pathname === "/api/nps",
      async (route) => {
        if (route.request().method() === "GET") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              success: true,
              order: { orderNumber: "#1002", customerName: "Ana", score: null, comment: null },
            }),
          });
          return;
        }
        guardado = (await route.request().postDataJSON()) as {
          token: string;
          score: number;
          comment: string;
        };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      },
    );

    await page.goto("/avaliar?token=token-de-teste");
    await expect(page.getByRole("heading", { name: "Como correu?" })).toBeVisible();

    await page.getByRole("button", { name: "Nota 4 de 5" }).click();
    await page.getByLabel("Comentário (opcional)").fill("Gostei da rapidez de entrega.");
    await page.getByRole("button", { name: "Enviar resposta" }).click();

    await expect(page.getByRole("heading", { name: "Obrigada! 💗" })).toBeVisible();
    expect(guardado).toEqual({
      token: "token-de-teste",
      score: 4,
      comment: "Gostei da rapidez de entrega.",
    });
  });
});

test.describe("Formulário de contacto", () => {
  const FOTO_PNG = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
    "base64",
  );

  test("troca ou defeito exige fotografia do produto", async ({ page }) => {
    let pedido: unknown = null;
    await page.route(
      (url) => url.pathname === "/api/contacto",
      async (route) => {
        pedido = await route.request().postDataJSON();
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      },
    );

    // Esperar pela hidratação do React antes de interagir com o formulário.
    await page.goto("/ajuda", { waitUntil: "networkidle" });
    await page.getByLabel("Motivo *").selectOption("troca_defeito");
    await expect(page.getByText("Fotografia do produto *")).toBeVisible();

    await page.getByLabel("Nome *").fill("Ana");
    await page.getByLabel("Email *").fill("ana@exemplo.pt");
    await page.getByLabel("Mensagem *").fill("O produto chegou com um defeito.");
    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(
      page.getByText("Para troca ou defeito, anexa uma fotografia do produto."),
    ).toBeVisible();
    expect(pedido).toBeNull();
  });

  test("envia a fotografia em anexo ao apoio", async ({ page }) => {
    let pedido: {
      reason: string;
      image: { name: string; type: string; data: string } | null;
    } | null = null;
    await page.route(
      (url) => url.pathname === "/api/contacto",
      async (route) => {
        pedido = (await route.request().postDataJSON()) as typeof pedido;
        await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
      },
    );

    await page.goto("/ajuda", { waitUntil: "networkidle" });
    await page.getByLabel("Motivo *").selectOption("troca_defeito");
    await expect(page.getByText("Fotografia do produto *")).toBeVisible();

    await page.getByLabel("Nome *").fill("Ana");
    await page.getByLabel("Email *").fill("ana@exemplo.pt");
    await page.getByLabel("Número de Encomenda (opcional)").fill("UFFA-48217");
    await page.getByLabel("Mensagem *").fill("A sola descolou depois de um dia de uso.");

    await page.locator("#contact-image").setInputFiles({
      name: "defeito.png",
      mimeType: "image/png",
      buffer: FOTO_PNG,
    });
    await expect(page.getByRole("img", { name: "Pré-visualização" })).toBeVisible();
    await expect(page.getByText("defeito", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Enviar mensagem" }).click();

    await expect(page.getByRole("heading", { name: "Mensagem Enviada!" })).toBeVisible();
    expect(pedido).not.toBeNull();
    expect(pedido?.reason).toBe("troca_defeito");
    expect(pedido?.image?.type).toBe("image/jpeg");
    expect(pedido?.image?.name).toBe("defeito");
    expect(pedido?.image?.data).toBeTruthy();
  });

  test("o servidor rejeita pedidos malformados", async ({ request }) => {
    const response = await request.post("/api/contacto", {
      data: { name: "", email: "invalido", message: "" },
    });
    expect(response.status()).toBe(400);
    expect((await response.json()).reason).toBe("missing_fields");
  });
});

test.describe("Mobile", () => {
  test("menu mobile mostra os modelos da marca como submenu @mobile", async ({ page }) => {
    await page.goto("/");
    await expect(async () => {
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    const menu = page.getByRole("dialog");
    const modelosNike = menu.getByRole("button", { name: "Modelos Nike" });
    await modelosNike.click();
    await expect(modelosNike).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("link", { name: /^Air Force/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Dunk/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /^Vomero 5/ })).toBeVisible();

    await menu.getByRole("link", { name: /^Dunk/ }).click();
    await page.waitForURL(/brand=nike.*model=dunk|model=dunk.*brand=nike/);
    await expect(page.locator("article").first()).toBeVisible();
  });

  test("menu mobile e compra completa até ao checkout @mobile", async ({ page }) => {
    await limparEstado(page);

    await expect(async () => {
      await page.getByRole("button", { name: "Menu" }).click();
      await expect(page.getByRole("dialog")).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 30_000 });

    const menu = page.getByRole("dialog");
    await expect(menu).toBeVisible();
    await menu.getByRole("link", { name: "Nike" }).click();
    await page.waitForURL(/\/catalogo/);

    await abrirProduto(page);
    await adicionarAoCarrinho(page);
    await abrirCarrinho(page);
    await page.getByRole("dialog").getByRole("link", { name: "Finalizar compra" }).click();
    await page.waitForURL(/\/checkout/);
    await expect(page.getByRole("button", { name: "Pagar agora" })).toBeVisible();
  });
});
