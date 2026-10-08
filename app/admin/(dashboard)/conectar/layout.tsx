import type { ReactNode } from "react";
import { requireModule } from "@/lib/releases-server";

// Lanzamiento por temporadas: si este módulo no está abierto para la cuenta, la página no existe (lib/releases.ts).
export default async function ReleaseGate({ children }: { children: ReactNode }) {
  await requireModule("conectar");
  return children;
}
