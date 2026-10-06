import { test } from "node:test";
import assert from "node:assert/strict";
import { addDisclosure, brandedContentTools, checkDisclosure, moveDisclosureToStart, needsDisclosureFix, suggestedTag, visibleWindow } from "../lib/disclosure";

const ig = ["instagram"] as const;
const status = (caption: string, networks: ("instagram" | "tiktok" | "youtube" | "facebook")[] = ["instagram"]) => checkDisclosure(caption, networks).status;
const filler = (n: number) => "x".repeat(n);

test("sin texto todavía no se avisa nada", () => {
  assert.equal(status(""), "empty");
  assert.equal(status("   \n"), "empty");
});

test("un aviso claro al inicio está bien", () => {
  assert.equal(status("#publicidad Mi rutina de noche"), "ok");
  assert.equal(status("Mi rutina favorita #ad"), "ok");
  assert.equal(status("#PUBLICIDAD en mayúsculas"), "ok");
  assert.equal(status("#Patrocinado por mi marca favorita"), "ok");
  assert.equal(status("Colaboración pagada con Sol Skincare"), "ok");
  assert.equal(status("Paid partnership with Sol Skincare"), "ok");
  assert.equal(status("Sponsored by Sol 🌞"), "ok");
});

test("sin ningún aviso", () => {
  assert.equal(status("Mi rutina de skincare de noche con Sol"), "missing");
  // Un hashtag que solo empieza igual no cuenta.
  assert.equal(status("#advance #adorable mi rutina"), "missing");
});

test("el aviso al final queda escondido detrás del «ver más»", () => {
  assert.equal(status(`${filler(200)} #ad`), "late");
  assert.equal(status(`${filler(60)} #publicidad`), "ok");
});

test("el límite lo pone la red que muestra menos texto", () => {
  assert.equal(visibleWindow(["instagram"]), 125);
  assert.equal(visibleWindow(["instagram", "tiktok"]), 100);
  assert.equal(visibleWindow([]), 125);
  const caption = `${filler(105)} #ad`; // el hashtag empieza en 106
  assert.equal(status(caption, ["instagram"]), "ok");
  assert.equal(status(caption, ["instagram", "tiktok"]), "late");
});

test("#colaboración o #collab solos no bastan", () => {
  assert.equal(status("#colaboración con Sol"), "weak");
  assert.equal(status("Gracias por el regalo #collab #gifted"), "weak");
  assert.equal(status("#colaboración #ad"), "ok");
});

test("agregar el aviso al inicio", () => {
  assert.equal(suggestedTag("es"), "#publicidad");
  assert.equal(suggestedTag("en"), "#ad");
  assert.equal(addDisclosure("Mi rutina", "es"), "#publicidad Mi rutina");
  assert.equal(addDisclosure("  Mi rutina", "en"), "#ad Mi rutina");
  assert.equal(addDisclosure("", "es"), "#publicidad ");
  assert.equal(status(addDisclosure(filler(300), "es")), "ok");
});

test("mover el aviso que ya está al inicio", () => {
  const moved = moveDisclosureToStart(`${filler(200)} #ad #skincare`, "es");
  assert.ok(moved.startsWith("#ad "));
  assert.ok(moved.endsWith("#skincare"));
  assert.equal(moved.match(/#ad/g)?.length, 1);
  assert.equal(status(moved), "ok");
  // Si el aviso es una frase, se agrega un hashtag al inicio.
  assert.ok(moveDisclosureToStart(`${filler(200)} sponsored by Sol`, "en").startsWith("#ad "));
});

test("herramientas de contenido de marca por red", () => {
  const tools = brandedContentTools(["instagram", "tiktok"], "es");
  assert.deepEqual(tools.map((t) => t.network), ["instagram", "tiktok"]);
  assert.match(tools[0].tip, /Colaboración pagada/);
  assert.match(brandedContentTools(["youtube"], "en")[0].tip, /paid promotion/);
});

test("solo se marca en el calendario si es para una marca y falta algo", () => {
  assert.equal(needsDisclosureFix("Mi rutina", [...ig], false), false);
  assert.equal(needsDisclosureFix("Mi rutina", [...ig], true), true);
  assert.equal(needsDisclosureFix("#publicidad Mi rutina", [...ig], true), false);
  assert.equal(needsDisclosureFix("", [...ig], true), false);
  assert.equal(needsDisclosureFix("#colaboración", [...ig], true), true);
});
