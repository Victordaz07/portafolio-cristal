import type { Metadata } from "next";
import LegalPageView from "@/components/LegalPageView";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: `Términos de servicio — ${siteConfig.platformName}` };

export default async function Page({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  return <LegalPageView id="terms" lang={lang} />;
}
