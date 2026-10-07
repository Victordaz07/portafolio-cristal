import { test } from "node:test";
import assert from "node:assert/strict";

process.env.AUTH_SECRET = "secreto-solo-para-pruebas";

import { unsubscribeHeaders, validUnsubscribeToken, waitlistUnsubscribeUrl } from "../lib/waitlist-unsubscribe";
import { passwordResetEmail, waitlistInviteEmail, waitlistJoinedEmail } from "../lib/email-templates";

test("enlace de baja: firmado por entrada y verificable", () => {
  const url = new URL(waitlistUnsubscribeUrl("https://foliocrew.pro", "abc123"));
  assert.equal(url.pathname, "/api/waitlist/unsubscribe");
  assert.equal(url.searchParams.get("id"), "abc123");
  const token = url.searchParams.get("t")!;
  assert.equal(validUnsubscribeToken("abc123", token), true);
  // El enlace de una persona no sirve para dar de baja a otra.
  assert.equal(validUnsubscribeToken("otra", token), false);
  assert.equal(validUnsubscribeToken("abc123", ""), false);
  assert.equal(validUnsubscribeToken("abc123", token + "x"), false);
});

test("cabeceras de baja en un clic", () => {
  const h = unsubscribeHeaders("https://foliocrew.pro/x");
  assert.equal(h["List-Unsubscribe"], "<https://foliocrew.pro/x>");
  assert.equal(h["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
});

test("los correos de la lista de espera traen el enlace de baja (HTML y texto, es y en)", () => {
  const unsubscribeUrl = "https://foliocrew.pro/api/waitlist/unsubscribe?id=a&t=b";
  const base = { origin: "https://foliocrew.pro", unsubscribeUrl };
  const mails = [
    waitlistJoinedEmail({ ...base, position: 3, shareUrl: "https://foliocrew.pro/" }),
    waitlistJoinedEmail({ ...base, position: 3, shareUrl: "https://foliocrew.pro/", lang: "en" }),
    waitlistInviteEmail({ ...base, name: "Ana", registerUrl: "https://foliocrew.pro/admin/registro", inviteCode: "X" }),
    waitlistInviteEmail({ ...base, name: "Ana", registerUrl: "https://foliocrew.pro/admin/registro", inviteCode: "X", lang: "en" }),
  ];
  for (const mail of mails) {
    assert.ok(mail.html.includes("id=a&amp;t=b"), "falta el enlace de baja en el HTML");
    assert.ok(mail.text.includes(unsubscribeUrl), "falta el enlace de baja en el texto");
  }
});

test("la dirección postal sale al pie de todos los correos cuando está configurada", () => {
  const p = { origin: "https://foliocrew.pro", name: "Ana", resetUrl: "https://foliocrew.pro/r" };
  delete process.env.LEGAL_POSTAL_ADDRESS;
  assert.equal(passwordResetEmail(p).html.includes("PO Box"), false);
  process.env.LEGAL_POSTAL_ADDRESS = "PO Box 123\nDaly City, CA 94015";
  const mail = passwordResetEmail(p);
  assert.ok(mail.html.includes("PO Box 123, Daly City, CA 94015"));
  assert.ok(mail.text.includes("PO Box 123, Daly City, CA 94015"));
  // Los correos de la cuenta (transaccionales) no llevan enlace de baja.
  assert.equal(mail.html.includes("/api/waitlist/unsubscribe"), false);
  delete process.env.LEGAL_POSTAL_ADDRESS;
});
