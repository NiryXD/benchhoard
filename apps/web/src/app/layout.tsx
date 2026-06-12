import type { Metadata } from "next";
import { Libre_Franklin } from "next/font/google";
import { glossary } from "@ltb/shared";
import "./globals.css";

// Franklin Gothic's open-source descendant — the most corporate-Americana
// sans available for free. The deadpan demands it.
const franklin = Libre_Franklin({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: `${glossary.brand.name} — ${glossary.brand.tagline}`,
  description:
    "A dating app that runs like a hiring process: structured screens, formal offers, and rejection letters with dignity. Strictly 18+.",
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
