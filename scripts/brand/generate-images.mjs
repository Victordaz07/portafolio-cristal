// Genera las imágenes de marca con la API de imágenes de OpenAI (DALL·E / gpt-image).
// Uso:  npm run brand:images            → todas
//       npm run brand:images -- og-plataforma login-fondo   → solo esas
// Necesita OPENAI_API_KEY en el entorno o en .env. Modelo: OPENAI_IMAGE_MODEL
// (por defecto gpt-image-1, el sucesor de DALL·E; también acepta dall-e-3).
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { PROMPTS } from "./prompts.mjs";

async function loadDotEnv() {
  if (process.env.OPENAI_API_KEY || !existsSync(".env")) return;
  for (const line of (await readFile(".env", "utf8")).split("\n")) {
    const m = line.match(/^\s*(OPENAI_API_KEY|OPENAI_IMAGE_MODEL)\s*=\s*"?([^"\n]*)"?/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const SIZES = {
  "dall-e-3": { square: "1024x1024", landscape: "1792x1024", portrait: "1024x1792" },
  default: { square: "1024x1024", landscape: "1536x1024", portrait: "1024x1536" },
};

async function generate(item, model, key) {
  const isDalle = model.startsWith("dall-e");
  const size = (SIZES[model] ?? SIZES.default)[item.orientation];
  const body = { model, prompt: item.prompt, size, n: 1 };
  if (isDalle) Object.assign(body, { response_format: "b64_json", quality: "hd" });
  else body.quality = "high";
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message ?? `HTTP ${response.status}`);
  return Buffer.from(data.data[0].b64_json, "base64");
}

await loadDotEnv();
const key = process.env.OPENAI_API_KEY;
if (!key) {
  console.error("Falta OPENAI_API_KEY (ponla en .env o en las variables del entorno). Ver docs/marca.md.");
  process.exit(1);
}
const model = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
const wanted = process.argv.slice(2);
const items = wanted.length ? PROMPTS.filter((p) => wanted.includes(p.id)) : PROMPTS;
if (!items.length) {
  console.error(`No hay prompts con esos ids. Disponibles: ${PROMPTS.map((p) => p.id).join(", ")}`);
  process.exit(1);
}
const outDir = path.join("public", "brand", "ia");
await mkdir(outDir, { recursive: true });
let failed = 0;
for (const item of items) {
  process.stdout.write(`→ ${item.id} (${model}) … `);
  try {
    await writeFile(path.join(outDir, `${item.id}.png`), await generate(item, model, key));
    console.log("listo");
  } catch (error) {
    failed += 1;
    console.log(`error: ${error.message}`);
  }
}
console.log(`\nImágenes en ${outDir}. Revisa cada una antes de usarla.`);
process.exit(failed ? 1 : 0);
