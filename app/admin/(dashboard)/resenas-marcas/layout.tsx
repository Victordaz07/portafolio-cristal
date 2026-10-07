import type { ReactNode } from "react";
import { requireFeature } from "@/lib/feature-flags-server";

// Lanzamiento gradual (lib/feature-flags.ts): esta sección todavía es solo para embajadoras/es
// y para quien administra Foliocrew. Cubre esta página y todas sus páginas anidadas.
export default async function ResenasMarcasLayout({ children }: { children: ReactNode }) {
  await requireFeature("resenasMarcas");
  return <>{children}</>;
}
