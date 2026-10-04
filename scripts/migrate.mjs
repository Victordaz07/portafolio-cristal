// Aplica las migraciones de Prisma antes del build, con un seguro para los previews de Vercel.
//
// Los previews (cada rama/PR) NO deben tocar la base de producción. Solo se migra cuando:
//   - es el deploy de producción (VERCEL_ENV=production), o
//   - es un preview y Vercel le asignó la base de previews (DB_ENV=preview), o
//   - no es Vercel (en tu computadora: migra la base de tu .env).
// Si un preview no tiene DB_ENV=preview, se asume que apunta a producción: no migra y avisa.
import { execSync } from "node:child_process";

const vercelEnv = process.env.VERCEL_ENV; // "production" | "preview" | "development" | undefined
const dbEnv = process.env.DB_ENV;

if (vercelEnv === "preview" && dbEnv !== "preview") {
  console.warn(
    "⚠️  Preview sin base propia (falta DB_ENV=preview en Vercel): se saltan las migraciones para no tocar producción."
  );
  process.exit(0);
}

if (vercelEnv === "production" && dbEnv && dbEnv !== "production") {
  console.error(`✖ El deploy de producción tiene DB_ENV=${dbEnv}: revisa las variables de Vercel.`);
  process.exit(1);
}

console.log(`Migrando base de datos (${vercelEnv ?? "local"}${dbEnv ? `, DB_ENV=${dbEnv}` : ""})…`);
execSync("npx --no-install prisma migrate deploy", { stdio: "inherit" });
