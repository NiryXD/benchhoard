import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@ltb/shared";
import { ReferenceForm } from "@/components/ReferenceForm";

export const metadata: Metadata = {
  title: `Write a Professional Reference — ${glossary.brand.name}`,
  description:
    "Someone you know is on the market. Put in a good word — on the record.",
};

export default function ReferencePage() {
  return (
    <main className="ref-page">
      <div className="wrap">
        <p className="ref-back">
          <Link href="/">← {glossary.brand.name}</Link>
        </p>
        <span className="eyebrow">Reference Check</span>
        <h1>Someone you know is on the market.</h1>
        <p className="section-lede">
          They&rsquo;ve listed you as a professional reference — for dating.
          Say what you&rsquo;d actually say if HR called: keep it warm, keep
          it honest, keep it under 600 characters. They approve it before
          anyone sees it, so make them sweat a little.
        </p>
        <ReferenceForm />
      </div>
    </main>
  );
}
