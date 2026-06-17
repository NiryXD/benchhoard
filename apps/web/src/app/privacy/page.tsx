/*
 * ⚠️ DRAFT — PENDING LEGAL REVIEW.
 * This is a working-draft privacy policy so the store-required URL exists.
 * Before Play submission: replace or validate via Termly (free tier, per
 * docs/plan/07-roadmap.md Phase 0), fill the [BRACKETED] placeholders, and
 * confirm the processor list matches what actually ships.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@ltb/shared";

export const metadata: Metadata = {
  title: `Privacy Policy — ${glossary.brand.name}`,
};

export default function PrivacyPage() {
  return (
    <main className="legal">
      <p>
        <Link href="/">← Back to {glossary.brand.name}</Link>
      </p>
      <h1>Privacy Policy</h1>
      <p className="legal-meta">Last updated: June 12, 2026</p>
      <p className="legal-draft">
        <strong>Working draft.</strong> This policy is pending legal review
        and will be finalized before public launch.
      </p>

      <h2>Who we are</h2>
      <p>
        {glossary.brand.name} (&ldquo;LTB&rdquo;, &ldquo;we&rdquo;) is a
        dating application. Despite the corporate humor throughout the
        product, this document is not a joke: it describes what data we
        collect and how we handle it.
      </p>

      <h2>You must be 18 or older</h2>
      <p>
        <strong>
          {glossary.brand.name} is strictly for adults aged 18 and over.
        </strong>{" "}
        We do not knowingly collect data from anyone under 18. Accounts found
        to belong to minors are deleted.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data:</strong> email address and authentication
          credentials, managed by our sign-in provider (Clerk).
        </li>
        <li>
          <strong>Profile data you provide:</strong> photos, name, age,
          headline, executive summary, career and education fields, behavioral
          question answers, optional resume PDF, location (city-level for
          discovery), and preferences (&ldquo;Hiring Criteria&rdquo;).
        </li>
        <li>
          <strong>Activity data:</strong> screens, matches, and messages you
          exchange inside the app.
        </li>
        <li>
          <strong>Purchase data:</strong> subscription and consumable purchase
          state, processed by Google Play and RevenueCat. We never see your
          payment card.
        </li>
        <li>
          <strong>Diagnostics &amp; analytics:</strong> crash reports (Sentry)
          and product usage events (PostHog).
        </li>
      </ul>

      <h2>Who processes it</h2>
      <p>
        Your data is stored and processed by the following service providers,
        each under their own privacy terms: Clerk (authentication), Supabase
        (database, storage, realtime), RevenueCat and Google Play (purchases),
        PostHog (analytics), Sentry (crash reporting), Expo (app
        infrastructure and push notifications), and Cloudflare (this
        website&rsquo;s hosting). We do not sell your personal data.
      </p>

      <h2>Who can see your profile</h2>
      <p>
        Your profile is visible to other users within your discovery settings.
        Your uploaded resume PDF is only downloadable by users you have
        matched with — and the app warns you to redact contact details before
        uploading. Messages are visible only to you and your match.
      </p>

      <h2>Account deletion</h2>
      <p>
        You can delete your account and associated data at any time from
        within the app (&ldquo;{glossary.you.title}&rdquo; →
        settings), or by emailing{" "}
        <strong>[SUPPORT_EMAIL — set before launch]</strong>. Deletion removes
        your profile, your hoard, and the benches you&rsquo;ve added from
        production systems; residual copies in encrypted backups expire on a
        rolling basis.
      </p>

      <h2>Data retention</h2>
      <p>
        We keep your data while your account is active. Reports submitted
        about other users (block/report) are retained as required for trust
        &amp; safety even after the reported content is deleted.
      </p>

      <h2>Your rights</h2>
      <p>
        Depending on your jurisdiction, you may have rights to access,
        correct, export, or erase your personal data. Contact us at
        <strong> [SUPPORT_EMAIL]</strong> to exercise them.
      </p>

      <h2>Changes</h2>
      <p>
        We will update this page and revise the date above when this policy
        changes materially.
      </p>

      <h2>Governing law</h2>
      <p>This policy is governed by the laws of [JURISDICTION].</p>
    </main>
  );
}
