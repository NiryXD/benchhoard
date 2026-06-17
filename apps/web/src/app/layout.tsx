import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { glossary } from "@benchhoard/shared";
import "./globals.css";

// Franklin Gothic's open-source descendant — the most corporate-Americana
// sans available for free. The deadpan demands it.
const franklin = Libre_Franklin({
  subsets: ["latin"],
  display: "swap",
});

const description =
  "Find the public benches near you, see what each one is actually like — flat or boxed-in, sun or shade, quiet or loud — and let a compass point you to the nearest place to sit down.";

export const metadata: Metadata = {
  metadataBase: new URL("https://benchhoard.pages.dev"),
  title: `${glossary.brand.name} — ${glossary.brand.tagline}`,
  description,
  openGraph: {
    title: `${glossary.brand.name} — ${glossary.brand.tagline}`,
    description,
    url: "/",
    siteName: glossary.brand.name,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `${glossary.brand.name} — ${glossary.brand.tagline}`,
    description,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={franklin.className}>
      <body>{children}</body>
    </html>
  );
}
