import assert from "node:assert/strict";
import test from "node:test";
import {
  CORDAS,
  CORES_AIR_FORCE,
  FIOS,
  atributosPersonalizacao,
  mesmaPersonalizacao,
  personalizacaoCompleta,
  temCorAirForce,
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
  assert.deepEqual(
    CORES_AIR_FORCE.map((opcao) => opcao.slug),
    ["branco", "preto"],
  );
});

test("só os Air Force W Rope Lace personalizáveis têm Corda/Fio", () => {
  assert.equal(temPersonalizacao("nike-air-force-chapa-dourada"), true);
  assert.equal(temPersonalizacao("air-force-w-rope-lace-offwhite"), true);
  assert.equal(temPersonalizacao("air-force-floral-w-rope-laces-gs"), false);
});

test("a cor da Air Force só existe no AIR FORCE FLORAL", () => {
  assert.equal(temCorAirForce("air-force-floral-w-rope-laces"), true);
  assert.equal(temCorAirForce("air-force-floral-w-rope-laces-gs"), true);
  assert.equal(temCorAirForce("air-force-floral-w-rope-laces-senior"), true);
  assert.equal(temCorAirForce("nike-air-force-chapa-dourada"), false);
  assert.equal(temCorAirForce("air-force-w-rope-lace-offwhite"), false);
});

test("a escolha só está completa quando as opções aplicáveis são válidas", () => {
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "rosa" }, true, true), true);
  assert.equal(personalizacaoCompleta({ corda: "bege" }, true, true), false);
  assert.equal(personalizacaoCompleta({ corda: "bege", fio: "amarelo" }, true, true), false);
  assert.equal(personalizacaoCompleta({ corAirForce: "branco" }, false, false, true), true);
  assert.equal(personalizacaoCompleta({}, false, false, true), false);
  assert.equal(personalizacaoCompleta({ corAirForce: "verde" }, false, false, true), false);
  assert.equal(personalizacaoCompleta({ corda: "bege" }), true);
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
  assert.deepEqual(atributosPersonalizacao({ corAirForce: "preto" }), [
    { key: "Cor da Air Force", value: "Preto" },
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
