/*
 * ⚠️ DRAFT — PENDING LEGAL REVIEW.
 * Working-draft Terms of Service so the store-required URL exists.
 * Before submission: replace or validate via a generator (e.g. Termly) and
 * fill the [BRACKETED] placeholders.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@benchhoard/shared";

export const metadata: Metadata = {
  title: `Terms of Service — ${glossary.brand.name}`,
};

export default function TermsPage() {
  return (
    <main className="legal">
      <p>
        <Link href="/">← Back to {glossary.brand.name}</Link>
      </p>
      <h1>Terms of Service</h1>
      <p className="legal-meta">Last updated: June 17, 2026</p>
      <p className="legal-draft">
        <strong>Working draft.</strong> These terms are pending legal review
        and will be finalized before public launch.
      </p>

      <h2>1. The agreement</h2>
      <p>
        By using {glossary.brand.name} (&ldquo;BH&rdquo;, &ldquo;the
        Service&rdquo;) you agree to these terms. If you do not agree, do not use
        the Service.
      </p>

      <h2>2. Eligibility</h2>
      <p>
        You must be able to form a binding contract to use the Service. If you
        are under 18, you may use {glossary.brand.name} only with the involvement
        of a parent or guardian. We do not knowingly allow children under 13.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>Browsing the map needs no account; signing in saves your hoard across devices.</li>
        <li>
          Don&rsquo;t impersonate others or create accounts to abuse the
          discovery points system.
        </li>
        <li>You are responsible for activity under your account.</li>
      </ul>

      <h2>4. Community conduct</h2>
      <ul>
        <li>
          Benches you add should describe real, publicly accessible seating — not
          private property, fabrications, or spam.
        </li>
        <li>
          Photos should show the bench and its surroundings, not identifiable
          people without their consent.
        </li>
        <li>No harassment, hate speech, threats, or commercial solicitation.</li>
        <li>
          Content can be reported in-app. We review reports and may remove
          benches, photos, reviews, or accounts at our discretion.
        </li>
      </ul>

      <h2>5. Content you submit</h2>
      <p>
        You retain ownership of your content. You grant BH a worldwide,
        non-exclusive, royalty-free license to host, display, and distribute it
        solely to operate the Service (e.g., showing a bench you added, and its
        photos, to other users). Bench data you contribute may be shown publicly
        on the map.
      </p>

      <h2>6. Cost</h2>
      <p>
        {glossary.brand.name} is free to use. There are no subscriptions or
        in-app purchases — the full map, compass, and bench details are available
        to everyone at no cost.
      </p>

      <h2>7. Termination</h2>
      <p>
        You may delete your account at any time in the app. We may suspend or
        terminate accounts that violate these terms. Sections 5, 8, and 9
        survive termination.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Service is provided &ldquo;as is&rdquo; without warranties of any
        kind. Bench data is community-contributed and drawn from OpenStreetMap;
        we make no guarantee that a bench exists, is accessible, or matches its
        description. Use your own judgment when heading somewhere new.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, BH&rsquo;s total liability
        arising from the Service is limited to $25, since the Service is free to
        use.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of [JURISDICTION]. Disputes will
        be resolved in the courts of [JURISDICTION].
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions or complaints:{" "}
        <strong>[SUPPORT_EMAIL — set before launch]</strong>.
      </p>
    </main>
  );
}
