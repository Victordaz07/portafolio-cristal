import { afterEach, beforeEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { PROVIDERS } from "../lib/social/providers";
import { fetchJson } from "../lib/social/http";
import { ReconnectRequiredError, describeAccountError, needsReconnect, renewTokens } from "../lib/social/token-refresh";
import {
  allowedPrivacyOptions,
  buildDirectPostBody,
  buildDraftBody,
  parseCreatorInfo,
  planChunks,
  uploadVideoChunks,
  TikTokPostingError,
  type CreatorInfo,
  type DirectPostInput,
} from "../lib/social/tiktok-posting";
import type { StoredTokens } from "../lib/social/types";

const tiktok = PROVIDERS.tiktok;
const MB = 1024 * 1024;
const realFetch = globalThis.fetch;
const FLAGS = ["TIKTOK_POSTING_DRAFT_ENABLED", "TIKTOK_POSTING_DIRECT_ENABLED", "TIKTOK_POSTING_AUDITED"] as const;

type Call = { url: string; init?: RequestInit };
let calls: Call[] = [];

/** Reemplaza fetch por respuestas fijas (en orden) y anota cada pedido. */
function mockFetch(...responses: (Response | Error)[]) {
  calls = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const next = responses.shift();
    if (!next) throw new Error("fetch inesperado");
    if (next instanceof Error) throw next;
    return next;
  }) as typeof fetch;
}

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function tokens(expiresInMs: number | null, refreshToken: string | null = "rt-old"): StoredTokens {
  return {
    accessToken: "at-old",
    refreshToken,
    expiresAt: expiresInMs == null ? null : new Date(Date.now() + expiresInMs),
    externalId: "open-id",
    connectedAt: new Date(Date.now() - 2 * 86_400_000),
  };
}

beforeEach(() => {
  process.env.TIKTOK_CLIENT_KEY = "ck";
  process.env.TIKTOK_CLIENT_SECRET = "cs";
  for (const key of FLAGS) delete process.env[key];
});

afterEach(() => {
  globalThis.fetch = realFetch;
  for (const key of FLAGS) delete process.env[key];
});

describe("TikTok: permisos que pide el login", () => {
  const BASE = ["user.info.basic", "user.info.profile", "user.info.stats", "video.list"];
  const requested = () => new URL(tiktok.authorizeUrl("https://foliocrew.pro/api/admin/connect/tiktok/callback", "st")).searchParams.get("scope");

  it("sin variables: exactamente los 4 permisos aprobados", () => {
    assert.equal(requested(), BASE.join(","));
  });
  it("solo borrador: agrega video.upload", () => {
    process.env.TIKTOK_POSTING_DRAFT_ENABLED = "1";
    assert.equal(requested(), [...BASE, "video.upload"].join(","));
  });
  it("solo directa: agrega video.publish", () => {
    process.env.TIKTOK_POSTING_DIRECT_ENABLED = "1";
    assert.equal(requested(), [...BASE, "video.publish"].join(","));
  });
  it("ambas: agrega los dos", () => {
    process.env.TIKTOK_POSTING_DRAFT_ENABLED = "1";
    process.env.TIKTOK_POSTING_DIRECT_ENABLED = "1";
    assert.equal(requested(), [...BASE, "video.upload", "video.publish"].join(","));
  });
  it("solo \"1\" activa: otros valores no piden permisos de más", () => {
    process.env.TIKTOK_POSTING_DRAFT_ENABLED = "true";
    process.env.TIKTOK_POSTING_DIRECT_ENABLED = "0";
    process.env.TIKTOK_POSTING_AUDITED = "1";
    assert.equal(requested(), BASE.join(","));
  });
});

describe("TikTok: tarjeta de /admin/conectar", () => {
  it("ya no menciona el Sandbox", () => {
    assert.ok(!tiktok.cannot.some((line) => /sandbox/i.test(line)));
  });
  it("separa lo que bloquea cada cosa", () => {
    const blockers = tiktok.later.map((g) => g.blocker);
    assert.deepEqual(blockers, ["Requiere aprobación de TikTok (Content Posting API)", "Requiere cuenta Business + TikTok for Business"]);
  });
  it("lo que se activa pasa a «Ya funciona»", () => {
    process.env.TIKTOK_POSTING_DRAFT_ENABLED = "1";
    process.env.TIKTOK_POSTING_DIRECT_ENABLED = "1";
    assert.equal(tiktok.can.length, 4);
    assert.deepEqual(tiktok.later.map((g) => g.blocker), ["Requiere cuenta Business + TikTok for Business"]);
  });
});

describe("Instagram y Facebook: lo activado pasa a «Ya funciona»", () => {
  afterEach(() => {
    delete process.env.PUBLISH_INSTAGRAM_ENABLED;
    delete process.env.PUBLISH_FACEBOOK_ENABLED;
    delete process.env.INSTAGRAM_DM_ENABLED;
  });
  const laterItems = (id: "instagram" | "facebook") => PROVIDERS[id].later.flatMap((g) => g.items);
  it("apagado: publicar y DMs siguen en «más adelante»", () => {
    assert.ok(laterItems("instagram").some((l) => l.startsWith("Publicar")));
    assert.ok(laterItems("instagram").some((l) => l.includes("DMs")));
    assert.ok(laterItems("facebook").some((l) => l.startsWith("Publicar")));
  });
  it("encendido: se mueven a «Ya funciona»", () => {
    process.env.PUBLISH_INSTAGRAM_ENABLED = "1";
    process.env.PUBLISH_FACEBOOK_ENABLED = "1";
    process.env.INSTAGRAM_DM_ENABLED = "1";
    assert.ok(PROVIDERS.instagram.can.some((l) => l.startsWith("Publicar")));
    assert.ok(PROVIDERS.instagram.can.some((l) => l.includes("DMs")));
    assert.ok(PROVIDERS.facebook.can.some((l) => l.startsWith("Publicar")));
    assert.ok(!laterItems("instagram").some((l) => l.startsWith("Publicar") || l.includes("DMs")));
    assert.ok(!laterItems("facebook").some((l) => l.startsWith("Publicar")));
  });
});

describe("TikTok: renovación del token (dura 24 h)", () => {
  it("no renueva si falta más de 5 minutos", async () => {
    mockFetch();
    const result = await renewTokens(tiktok, tokens(60 * 60_000));
    assert.equal(result.renewed, null);
    assert.equal(calls.length, 0);
  });

  it("renueva con el refresh token y usa el refresh token NUEVO que devuelve TikTok", async () => {
    mockFetch(json({ access_token: "at-new", refresh_token: "rt-new", expires_in: 86400, scope: "user.info.basic,video.list" }));
    const result = await renewTokens(tiktok, tokens(2 * 60_000));
    assert.equal(calls[0].url, "https://open.tiktokapis.com/v2/oauth/token/");
    const body = new URLSearchParams(String(calls[0].init?.body));
    assert.equal(body.get("grant_type"), "refresh_token");
    assert.equal(body.get("refresh_token"), "rt-old");
    assert.equal(body.get("client_key"), "ck");
    assert.equal(result.tokens.accessToken, "at-new");
    assert.equal(result.tokens.refreshToken, "rt-new");
    assert.deepEqual(result.renewed?.scopes, ["user.info.basic", "video.list"]);
    assert.ok(result.tokens.expiresAt && result.tokens.expiresAt.getTime() > Date.now() + 23 * 3_600_000);
  });

  it("también renueva un token ya vencido", async () => {
    mockFetch(json({ access_token: "at-new", refresh_token: "rt-old", expires_in: 86400 }));
    const result = await renewTokens(tiktok, tokens(-3_600_000));
    assert.equal(result.tokens.accessToken, "at-new");
  });

  it("si TikTok rechaza el refresh token, pide volver a conectar con un mensaje claro", async () => {
    mockFetch(json({ error: "invalid_grant", error_description: "Refresh token is invalid or expired." }, 400));
    await assert.rejects(renewTokens(tiktok, tokens(-60_000)), (error: unknown) => {
      assert.ok(error instanceof ReconnectRequiredError);
      assert.ok(needsReconnect(error.message));
      assert.match(error.message, /^TikTok ya no acepta la conexión guardada; vuelve a conectar la cuenta \(invalid_grant/);
      return true;
    });
  });

  it("una falla de red no pide reconectar (se reintenta la próxima vez)", async () => {
    mockFetch(new TypeError("fetch failed"));
    await assert.rejects(renewTokens(tiktok, tokens(-60_000)), (error: unknown) => !(error instanceof ReconnectRequiredError));
    mockFetch(new Response("oops", { status: 502 }));
    await assert.rejects(renewTokens(tiktok, tokens(-60_000)), (error: unknown) => !(error instanceof ReconnectRequiredError));
  });

  it("sin refresh token no intenta renovar", async () => {
    mockFetch();
    const result = await renewTokens(tiktok, tokens(-60_000, null));
    assert.equal(result.renewed, null);
    assert.equal(calls.length, 0);
  });

  it("si la renovación falla pero el token aún sirve, sigue con el actual", async () => {
    // Instagram renueva con 15 días de margen: un fallo ahí no debe cortar nada.
    mockFetch(json({ error: { message: "boom", code: 1 } }, 400));
    const result = await renewTokens(PROVIDERS.instagram, { ...tokens(5 * 86_400_000), connectedAt: new Date(Date.now() - 30 * 86_400_000) });
    assert.equal(result.renewed, null);
    assert.equal(result.tokens.accessToken, "at-old");
  });
});

describe("errores que piden volver a conectar", () => {
  it("TikTok access_token_invalid llega con su código", async () => {
    mockFetch(json({ error: { code: "access_token_invalid", message: "The access token is invalid or not found in the request." } }, 401));
    await assert.rejects(fetchJson("https://open.tiktokapis.com/v2/user/info/"), /access_token_invalid/);
  });
  it("token inválido o permiso faltante → aviso de reconectar", () => {
    assert.ok(needsReconnect(describeAccountError("TikTok", new Error("The access token is invalid (access_token_invalid)"))));
    assert.ok(needsReconnect(describeAccountError("TikTok", new Error("scope_not_authorized"))));
  });
  it("Meta código 190 ya lo pide", () => {
    assert.ok(needsReconnect("El token ya no es válido; vuelve a conectar la cuenta (Meta, código 190: x)"));
  });
  it("otros errores quedan tal cual", () => {
    assert.equal(describeAccountError("TikTok", new Error("HTTP 500: oops")), "HTTP 500: oops");
    assert.ok(!needsReconnect("HTTP 500: oops"));
    assert.ok(!needsReconnect(null));
  });
  it("TikTok OK (error.code = ok) no es error", async () => {
    mockFetch(json({ data: { user: {} }, error: { code: "ok", message: "" } }));
    await fetchJson("https://open.tiktokapis.com/v2/user/info/");
  });
});

describe("Content Posting: partes del archivo", () => {
  it("menos de 5 MB: una sola parte del tamaño del archivo", () => {
    assert.deepEqual(planChunks(3 * MB), { chunkSize: 3 * MB, totalChunkCount: 1, ranges: [{ start: 0, end: 3 * MB - 1 }] });
  });
  it("la última parte absorbe el sobrante", () => {
    const plan = planChunks(25 * MB + 123);
    assert.equal(plan.chunkSize, 10 * MB);
    assert.equal(plan.totalChunkCount, 2);
    assert.deepEqual(plan.ranges, [
      { start: 0, end: 10 * MB - 1 },
      { start: 10 * MB, end: 25 * MB + 122 },
    ]);
  });
  it("rechaza archivos vacíos o de más de 4 GB", () => {
    assert.throws(() => planChunks(0), TikTokPostingError);
    assert.throws(() => planChunks(4 * 1024 * MB + 1), TikTokPostingError);
  });
  it("borrador: solo source_info", () => {
    assert.deepEqual(buildDraftBody(3 * MB), { source_info: { source: "FILE_UPLOAD", video_size: 3 * MB, chunk_size: 3 * MB, total_chunk_count: 1 } });
  });
  it("sube las partes en orden con Content-Range", async () => {
    mockFetch(new Response(null, { status: 206 }), new Response(null, { status: 201 }));
    const size = 25 * MB;
    await uploadVideoChunks("https://upload.tiktok/x?y=1", size, "video/mp4", async (start, end) => new Uint8Array(end - start + 1));
    assert.equal(calls.length, 2);
    const headers = calls.map((c) => c.init?.headers as Record<string, string>);
    assert.equal(headers[0]["Content-Range"], `bytes 0-${10 * MB - 1}/${size}`);
    assert.equal(headers[1]["Content-Range"], `bytes ${10 * MB}-${size - 1}/${size}`);
    assert.equal(headers[1]["Content-Length"], String(15 * MB));
    assert.equal(calls[0].init?.method, "PUT");
  });
  it("falla claro si TikTok rechaza una parte", async () => {
    mockFetch(new Response("expired", { status: 403 }));
    await assert.rejects(uploadVideoChunks("https://u", 1000, "video/mp4", async (s, e) => new Uint8Array(e - s + 1)), /HTTP 403/);
  });
});

describe("Content Posting: publicación directa", () => {
  const creator: CreatorInfo = parseCreatorInfo({
    creator_nickname: "Foliocrew",
    creator_username: "foliocrew",
    privacy_level_options: ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY", "INVENTADO"],
    comment_disabled: true,
    duet_disabled: false,
    stitch_disabled: false,
    max_video_post_duration_sec: 600,
  });
  const input = (over: Partial<DirectPostInput> = {}): DirectPostInput => ({
    title: "Mi video #ugc",
    privacyLevel: "SELF_ONLY",
    allowComment: true,
    allowDuet: false,
    allowStitch: true,
    commercial: false,
    yourBrand: false,
    brandedContent: false,
    videoSize: 3 * MB,
    durationSec: 30,
    ...over,
  });

  it("lee la info del creador y descarta opciones desconocidas", () => {
    assert.deepEqual(creator.privacyLevelOptions, ["PUBLIC_TO_EVERYONE", "MUTUAL_FOLLOW_FRIENDS", "SELF_ONLY"]);
    assert.equal(creator.maxVideoPostDurationSec, 600);
  });
  it("sin auditoría solo se ofrece «Solo yo»", () => {
    assert.deepEqual(allowedPrivacyOptions(creator, false), ["SELF_ONLY"]);
    assert.deepEqual(allowedPrivacyOptions(creator, true), creator.privacyLevelOptions);
  });
  it("sin auditoría rechaza publicar en público", () => {
    assert.throws(() => buildDirectPostBody(input({ privacyLevel: "PUBLIC_TO_EVERYONE" }), creator, { audited: false }), { reason: "privacy" });
    assert.equal(buildDirectPostBody(input({ privacyLevel: "PUBLIC_TO_EVERYONE" }), creator, { audited: true }).post_info.privacy_level, "PUBLIC_TO_EVERYONE");
  });
  it("sin privacidad elegida no publica (no hay valor por defecto)", () => {
    assert.throws(() => buildDirectPostBody(input({ privacyLevel: "" }), creator, { audited: false }), { reason: "privacy" });
  });
  it("arma el cuerpo y respeta lo que el creador tiene apagado", () => {
    const body = buildDirectPostBody(input(), creator, { audited: false });
    assert.deepEqual(body.post_info, {
      title: "Mi video #ugc",
      privacy_level: "SELF_ONLY",
      disable_comment: true, // apagado en la cuenta aunque se pidió permitir
      disable_duet: true,
      disable_stitch: false,
      brand_content_toggle: false,
      brand_organic_toggle: false,
    });
    assert.equal(body.source_info.source, "FILE_UPLOAD");
  });
  it("contenido comercial: hay que elegir al menos una opción", () => {
    assert.throws(() => buildDirectPostBody(input({ commercial: true }), creator, { audited: true }), { reason: "commercial_choice" });
    const own = buildDirectPostBody(input({ commercial: true, yourBrand: true }), creator, { audited: true });
    assert.equal(own.post_info.brand_organic_toggle, true);
  });
  it("contenido de marca no puede ser privado", () => {
    assert.throws(() => buildDirectPostBody(input({ commercial: true, brandedContent: true }), creator, { audited: true }), { reason: "branded_private" });
    const ok = buildDirectPostBody(input({ commercial: true, brandedContent: true, privacyLevel: "PUBLIC_TO_EVERYONE" }), creator, { audited: true });
    assert.equal(ok.post_info.brand_content_toggle, true);
  });
  it("respeta el largo del texto y la duración máxima", () => {
    assert.throws(() => buildDirectPostBody(input({ title: "a".repeat(2201) }), creator, { audited: false }), { reason: "title" });
    assert.throws(() => buildDirectPostBody(input({ durationSec: 601 }), creator, { audited: false }), { reason: "duration" });
  });
});
