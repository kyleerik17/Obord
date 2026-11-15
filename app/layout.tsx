import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { Dancing_Script, Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import "./rework.css";
import Navbar from "@/components/Navbar";
import PageTransition from "@/components/PageTransition";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import { LocaleProvider } from "@/components/LocaleProvider";
import { getPublicSiteUrl } from "@/lib/metadata";
import { getLocale } from "@/lib/i18n-server";
import { socialLinks } from "@/lib/data/site";
import { getTheme } from "@/lib/theme-server";
import { ThemeProvider } from "@/components/ThemeProvider";

const dancingScript = Dancing_Script({
  variable: "--font-dancing",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space",
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
  const locale = await getLocale();
  const theme = await getTheme();
  const requestHeaders = await headers();
  const nonce = requestHeaders.get("x-nonce") ?? undefined;
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "O’BORD",
    telephone: "+225 07 68 96 30 19",
    email: "collectifchill@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Grand-Bassam",
      addressCountry: "CI",
    },
    sameAs: [socialLinks.instagram, socialLinks.whatsapp],
    ...(siteUrl ? { url: siteUrl } : {}),
  };

  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${dancingScript.variable} ${inter.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-display" suppressHydrationWarning>
        <LocaleProvider initialLocale={locale}>
          <ThemeProvider initialTheme={theme}>
            <PageTransition />
            <Navbar />
            <script nonce={nonce} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }} />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <WhatsAppButton />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
