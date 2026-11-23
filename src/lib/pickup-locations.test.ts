import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_PICKUP_LOCATION,
  PICKUP_LOCATIONS,
  isPickupLocation,
  pickupHandleForLocation,
} from "./pickup-locations";

const locations = [
  { id: "gid://shopify/Location/123726889308", name: "Rua Alcino de Araújo" },
  { id: "gid://shopify/Location/900000000001", name: "NorteShopping" },
  { id: "gid://shopify/Location/900000000002", name: "Maia Jardim" },
  { id: "gid://shopify/Location/900000000003", name: "MarShopping" },
];

test("os três pontos de recolha continuam a ser os mesmos", () => {
  assert.deepEqual(PICKUP_LOCATIONS, ["NorteShopping", "Maia Jardim", "MarShopping"]);
  assert.equal(DEFAULT_PICKUP_LOCATION, "NorteShopping");
  assert.equal(isPickupLocation("MarShopping"), true);
  assert.equal(isPickupLocation("Rua Alcino de Araújo"), false);
});

test("o local escolhido é mapeado para o pickupHandle da Shopify", () => {
  assert.equal(pickupHandleForLocation(locations, "NorteShopping"), "900000000001");
  assert.equal(pickupHandleForLocation(locations, "Maia Jardim"), "900000000002");
  assert.equal(pickupHandleForLocation(locations, "MarShopping"), "900000000003");
});

test("a procura ignora maiúsculas e espaços", () => {
  assert.equal(pickupHandleForLocation(locations, "  norteShopping "), "900000000001");
});

test("localizações desconhecidas ou antigas não geram pickupHandle", () => {
  assert.equal(pickupHandleForLocation(locations, "Rua Alcino de Araújo"), undefined);
  assert.equal(pickupHandleForLocation(locations, "Loja inexistente"), undefined);
  assert.equal(pickupHandleForLocation([], "NorteShopping"), undefined);
});
