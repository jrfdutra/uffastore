import assert from "node:assert/strict";
import test from "node:test";
import {
  CORDAS,
  FIOS,
  atributosPersonalizacao,
  mesmaPersonalizacao,
  personalizacaoCompleta,
  temFio,
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

test("só os Air Force W Rope Lace personalizáveis têm Corda/Fio", () => {
  assert.equal(temPersonalizacao("nike-air-force-chapa-dourada"), true);
  assert.equal(temPersonalizacao("air-force-w-rope-lace-offwhite"), true);
  assert.equal(temPersonalizacao("air-force-floral-w-rope-laces-gs"), false);
});

test("a cor do fio só existe no anúncio OffWhite", () => {
  assert.equal(temFio("air-force-w-rope-lace-offwhite"), true);
  assert.equal(temFio("nike-air-force-chapa-dourada"), false);
});

test("a escolha só está completa quando a corda (e o fio, quando aplicável) são válidos", () => {
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "rosa" }, true), true);
  assert.equal(personalizacaoCompleta({ corda: "bege" }, true), false);
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "amarelo" }, true), false);
  assert.equal(personalizacaoCompleta({ corda: "bege" }), true);
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "amarelo" }), true);
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
