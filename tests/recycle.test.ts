import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bankDrafts, cleanSource, isUsableSource, shapeResult, SOURCE_MAX, type RecycleRaw } from "../lib/recycle";

const raw = (over: Partial<RecycleRaw> = {}): RecycleRaw => ({
  hooks: ["Gancho 1", " ", "G".repeat(300), "Gancho 4", "Gancho 5", "Gancho 6"],
  instagram: { caption: "Línea 1\nLínea 2", hashtags: ["#skincare", "rutina!", "skincare", "Piel Sana", "#a#b", "extra1", "extra2"] },
  tiktok: { caption: "Corto", onScreenText: "Mira esto" },
  youtube: { title: "Título", description: "Descripción larga" },
  facebook: { post: "Publicación" },
  carousel: { slides: [{ title: "Portada", text: "Texto" }, { title: "", text: "" }, { title: "Idea", text: "x".repeat(500) }] },
  ...over,
});

describe("texto de partida", () => {
  it("limpia espacios y saltos de línea de más", () => assert.equal(cleanSource("  hola   mundo \r\n\r\n\r\n\r\nfin  "), "hola mundo \n\nfin"));
  it("recorta lo larguísimo", () => assert.equal(cleanSource("a".repeat(SOURCE_MAX + 500)).length, SOURCE_MAX));
  it("exige un mínimo", () => {
    assert.equal(isUsableSource("corto"), false);
    assert.equal(isUsableSource("Este es un texto lo bastante largo para reciclar en otras redes."), true);
  });
});

describe("respuesta de la IA", () => {
  const r = shapeResult(raw());
  it("deja máximo 5 ganchos, sin vacíos y recortados", () => {
    assert.equal(r.hooks.length, 5);
    assert.ok(r.hooks.every((h) => h.length > 0 && h.length <= 140));
  });
  it("limpia hashtags: con #, sin símbolos, sin repetidos y máximo 5", () => {
    assert.deepEqual(r.instagram.hashtags, ["#skincare", "#rutina", "#PielSana", "#ab", "#extra1"]);
  });
  it("descarta diapositivas vacías y recorta el texto", () => {
    assert.equal(r.carousel.slides.length, 2);
    assert.equal(r.carousel.slides[1].text.length, 220);
  });
});

describe("banco de contenido", () => {
  it("arma una pieza por red con la red correcta", () => {
    const drafts = bankDrafts(shapeResult(raw()));
    assert.deepEqual(drafts.map((d) => d.networks[0]), ["instagram", "tiktok", "youtube", "facebook", "instagram"]);
    assert.deepEqual(drafts.map((d) => d.contentType), ["reel", "reel", "long_video", "post", "carousel"]);
    assert.match(drafts[0].caption, /#skincare/);
    assert.match(drafts[4].caption, /^1\. Portada: Texto/);
  });
  it("omite lo que quedó vacío", () => {
    const drafts = bankDrafts(shapeResult(raw({ tiktok: { caption: "", onScreenText: "" }, facebook: { post: "" }, carousel: { slides: [] } })));
    assert.deepEqual(drafts.map((d) => d.networks[0]), ["instagram", "youtube"]);
  });
});
