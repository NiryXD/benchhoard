/*
 * ⚠️ DRAFT — PENDING LEGAL REVIEW.
 * Working-draft Terms of Service so the store-required URL exists.
 * Before Play submission: replace or validate via Termly (free tier, per
 * docs/plan/07-roadmap.md Phase 0) and fill the [BRACKETED] placeholders.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@ltb/shared";

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
      <p className="legal-meta">Last updated: June 12, 2026</p>
      <p className="legal-draft">
        <strong>Working draft.</strong> These terms are pending legal review
        and will be finalized before public launch.
      </p>

      <h2>1. The agreement</h2>
      <p>
        By creating an account on {glossary.brand.name} (&ldquo;LTB&rdquo;,
        &ldquo;the Service&rdquo;) you agree to these terms. If you do not
        agree, do not use the Service. The corporate-jargon presentation is
        satire; these terms are binding.
      </p>

      <h2>2. Eligibility — 18+ only</h2>
      <p>
        <strong>You must be at least 18 years old</strong> to create an
        account. You must also be legally able to enter this agreement and not
        be prohibited from using dating services under applicable law. We
        terminate accounts of users found to be under 18.
      </p>

      <h2>3. Your account</h2>
      <ul>
        <li>One account per person; your profile must be about you.</li>
        <li>
          Don&rsquo;t impersonate others or create accounts to abuse the
          discovery points system.
        </li>
        <li>You are responsible for activity under your account.</li>
      </ul>

      <h2>4. Code of conduct (the office dress code)</h2>
      <ul>
        <li>
          No harassment, hate speech, threats, or sexual content involving
          anyone without consent.
        </li>
        <li>No nudity or sexually explicit photos. Photo slots are labeled; follow the dress code.</li>
        <li>No commercial solicitation, spam, or scams.</li>
        <li>No impersonation of other people or employers.</li>
        <li>
          Violations can be reported in-app (block/report). We review reports
          and may remove content or accounts at our discretion.
        </li>
      </ul>

      <h2>5. Content you submit</h2>
      <p>
        You retain ownership of your content. You grant LTB a worldwide,
        non-exclusive, royalty-free license to host, display, and distribute
        it solely to operate the Service (e.g., showing your resume to other
        candidates). Endorsements and references you write about others must
        be truthful and respectful.
      </p>

      <h2>6. Purchases</h2>
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
        kind. We do not conduct background checks on users and make no
        guarantee about any user&rsquo;s identity, conduct, or compatibility.
        Exercise the same judgment you would with any stranger from the
        internet — meet in public, tell a colleague.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, LTB&rsquo;s total liability
        arising from the Service is limited to the amount you paid us in the
        twelve months before the claim, or $25 if you paid nothing.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of [JURISDICTION]. Disputes will
        be resolved in the courts of [JURISDICTION].
      </p>

      <h2>11. Contact</h2>
      <p>
        Questions, complaints, alignment calls:{" "}
        <strong>[SUPPORT_EMAIL — set before launch]</strong>.
      </p>
    </main>
  );
}
