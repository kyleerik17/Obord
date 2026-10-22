import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Dancing_Script, Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getPublicSiteUrl } from "@/lib/metadata";

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const siteUrl = getPublicSiteUrl();
const siteDescription = "Le collectif O’BORD à Grand-Bassam : jeux, rencontres et sorties conviviales.";

export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: siteUrl } : {}),
  title: { default: "O’BORD — La maison du chill", template: "%s | O’BORD" },
  description: siteDescription,
  openGraph: {
    title: "O’BORD — La maison du chill",
    description: siteDescription,
    siteName: "O’BORD",
    locale: "fr_CI",
    type: "website",
    ...(siteUrl ? { images: [{ url: `${siteUrl}/obord-logo.png`, width: 600, height: 600, alt: "Logo O’BORD" }] } : {}),
  },
  twitter: {
    card: "summary_large_image",
    title: "O’BORD — La maison du chill",
    description: siteDescription,
    ...(siteUrl ? { images: [`${siteUrl}/obord-logo.png`] } : {}),
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "O’BORD",
    telephone: "+225 07 68 96 30 19",
    email: "angeerikkyle@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Grand-Bassam",
      addressCountry: "CI",
    },
    sameAs: ["https://www.tiktok.com/@0bord"],
    ...(siteUrl ? { url: siteUrl } : {}),
  };

  return (
    <html
      lang="fr"
      className={`${dancingScript.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-display" suppressHydrationWarning>
        <PageTransition />
        <Navbar />
        <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <WhatsAppButton />
      </body>
    </html>
  );
}
