import assert from "node:assert/strict";
import test from "node:test";
import {
  CORDAS,
  FIOS,
  atributosPersonalizacao,
  mesmaPersonalizacao,
  personalizacaoCompleta,
  temPersonalizacao,
  textoPersonalizacao,
} from "./personalizacao.ts";

test("as opções pedidas para corda e fio são exactamente estas", () => {
  assert.deepEqual(
    CORDAS.map((opcao) => opcao.slug),
    ["bege", "cinza", "preto", "branco"],
  );
  assert.deepEqual(
    FIOS.map((opcao) => opcao.slug),
    ["vermelho", "branco", "preto", "laranja", "rosa"],
  );
});

test("só a Air Force W Rope Lace é personalizável", () => {
  assert.equal(temPersonalizacao("nike-air-force-chapa-dourada"), true);
  assert.equal(temPersonalizacao("air-force-floral-w-rope-laces-gs"), false);
});

test("a escolha só está completa quando corda e fio são válidos", () => {
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "rosa" }), true);
  assert.equal(personalizacaoCompleta({ corda: "bege" }), false);
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "amarelo" }), false);
});

test("artigos com personalizações diferentes não se juntam no carrinho", () => {
  assert.equal(
    mesmaPersonalizacao({ corda: "bege", fio: "rosa" }, { corda: "bege", fio: "rosa" }),
    true,
  );
  assert.equal(
    mesmaPersonalizacao({ corda: "bege", fio: "rosa" }, { corda: "bege", fio: "preto" }),
    false,
  );
  assert.equal(mesmaPersonalizacao(undefined, {}), true);
});

test("a escolha segue na encomenda como atributos da linha", () => {
  assert.deepEqual(atributosPersonalizacao({ corda: "cinza", fio: "laranja" }), [
    { key: "Corda", value: "cinza" },
    { key: "Fio", value: "laranja" },
  ]);
  assert.deepEqual(atributosPersonalizacao(undefined), []);
});

test("o texto da personalização é legível no carrinho e na confirmação", () => {
  assert.equal(
    textoPersonalizacao({ corda: "branco", fio: "vermelho" }),
    "Corda: branco · Fio: vermelho",
  );
  assert.equal(textoPersonalizacao(undefined), "");
});
