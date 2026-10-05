import type { ReactNode } from "react";
import { getAdminLang } from "@/lib/admin-lang-server";
import { AdminLangProvider } from "@/components/admin/AdminLang";

// Todo /admin (panel, entrar, crear cuenta, recuperar contraseña) comparte el idioma elegido en el selector ES/EN.
export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  return <AdminLangProvider lang={await getAdminLang()}>{children}</AdminLangProvider>;
}
