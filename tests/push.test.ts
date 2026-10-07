import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildPayload, cleanTopics, isAllowedEndpoint, isGoneStatus, paymentNotice, safeUrl, subscriptionSchema } from "../lib/push";

describe("destinos permitidos (anti SSRF)", () => {
  it("acepta las redes de notificaciones de los navegadores", () => {
    assert.equal(isAllowedEndpoint("https://fcm.googleapis.com/fcm/send/abc", ""), true);
    assert.equal(isAllowedEndpoint("https://updates.push.services.mozilla.com/wpush/v2/abc", ""), true);
    assert.equal(isAllowedEndpoint("https://web.push.apple.com/abc", ""), true);
    assert.equal(isAllowedEndpoint("https://wns2-par02p.notify.windows.com/w/?token=x", ""), true);
  });
  it("rechaza http, direcciones internas, puertos raros y credenciales", () => {
    assert.equal(isAllowedEndpoint("http://fcm.googleapis.com/x", ""), false);
    assert.equal(isAllowedEndpoint("https://localhost/x", ""), false);
    assert.equal(isAllowedEndpoint("https://169.254.169.254/latest", ""), false);
    assert.equal(isAllowedEndpoint("https://evil.com/fcm.googleapis.com", ""), false);
    assert.equal(isAllowedEndpoint("https://fcm.googleapis.com.evil.com/x", ""), false);
    assert.equal(isAllowedEndpoint("https://fcm.googleapis.com:8443/x", ""), false);
    assert.equal(isAllowedEndpoint("https://user:pw@fcm.googleapis.com/x", ""), false);
    assert.equal(isAllowedEndpoint("no es una url", ""), false);
  });
  it("solo permite hosts extra si se configuran (pruebas)", () => {
    assert.equal(isAllowedEndpoint("https://localhost:4443/x", "localhost:4443"), true);
    assert.equal(isAllowedEndpoint("https://localhost:4444/x", "localhost:4443"), false);
  });
});

describe("suscripción y temas", () => {
  it("valida la forma de la suscripción", () => {
    assert.equal(subscriptionSchema.safeParse({ endpoint: "https://fcm.googleapis.com/x", keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } }).success, true);
    assert.equal(subscriptionSchema.safeParse({ endpoint: "https://x", keys: { p256dh: "no válido!", auth: "x" } }).success, false);
  });
  it("limpia los temas: sin repetidos ni inventados, y todos por defecto", () => {
    assert.deepEqual(cleanTopics(["payment", "payment", "raro", "community"]), ["payment", "community"]);
    assert.deepEqual(cleanTopics(undefined), ["payment", "comment", "deliverable", "community"]);
    assert.deepEqual(cleanTopics([]), []);
  });
});

describe("aviso", () => {
  it("solo enlaza rutas del propio panel", () => {
    assert.equal(safeUrl("/admin/facturas"), "/admin/facturas");
    assert.equal(safeUrl("https://evil.com"), "/admin");
    assert.equal(safeUrl("//evil.com"), "/admin");
    assert.equal(safeUrl("/otra"), "/admin");
  });
  it("recorta el texto y arma el JSON", () => {
    const p = JSON.parse(buildPayload({ title: "T".repeat(200), body: "B".repeat(500), url: "javascript:alert(1)" }));
    assert.equal(p.title.length, 80);
    assert.equal(p.body.length, 180);
    assert.equal(p.url, "/admin");
  });
  it("reconoce dispositivos que ya no existen", () => {
    assert.equal(isGoneStatus(410), true);
    assert.equal(isGoneStatus(404), true);
    assert.equal(isGoneStatus(500), false);
    assert.equal(isGoneStatus(undefined), false);
  });
  it("redacta el aviso de pago en español e inglés", () => {
    assert.match(paymentNotice("paid", { number: "FC-1", brand: "Sol", amount: "$500" }, "es").title, /Te pagaron/);
    assert.match(paymentNotice("paid", { number: "FC-1" }, "en").title, /You got paid/);
    assert.match(paymentNotice("claimed", { number: "FC-1", brand: "Sol" }, "es").body, /Confírmalo/);
  });
});
