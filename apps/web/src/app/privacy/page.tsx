/*
 * ⚠️ DRAFT — PENDING LEGAL REVIEW.
 * This is a working-draft privacy policy so the store-required URL exists.
 * Before submission: replace or validate via a generator (e.g. Termly), fill
 * the [BRACKETED] placeholders, and confirm the processor list matches what
 * actually ships.
 */
import type { Metadata } from "next";
import Link from "next/link";
import { glossary } from "@benchhoard/shared";

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
      <p className="legal-meta">Last updated: June 17, 2026</p>
      <p className="legal-draft">
        <strong>Working draft.</strong> This policy is pending legal review
        and will be finalized before public launch.
      </p>

      <h2>Who we are</h2>
      <p>
        {glossary.brand.name} (&ldquo;BH&rdquo;, &ldquo;we&rdquo;) is an app for
        finding public benches. This document describes what data we collect and
        how we handle it.
      </p>

      <h2>Children&rsquo;s privacy</h2>
      <p>
        {glossary.brand.name} is for a general audience. We do not knowingly
        collect personal data from children under 13. If you believe a child has
        provided us data, contact us and we will delete it.
      </p>

      <h2>Data we collect</h2>
      <ul>
        <li>
          <strong>Account data (optional):</strong> browsing is anonymous. If
          you sign in to save benches, we store an email address and
          authentication credentials, managed by our sign-in provider (Clerk),
          and an optional display name.
        </li>
        <li>
          <strong>Location:</strong> your device location is used on-device to
          show benches near you and power the compass. We store coordinates only
          for benches you choose to add to the map.
        </li>
        <li>
          <strong>Contributions you make:</strong> benches you add (location,
          qualities, optional photos and notes), benches you hoard with their
          optional tags, and comfort reviews you leave.
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
        (database, storage, realtime), PostHog (analytics), Sentry (crash
        reporting), Expo (app infrastructure and push notifications), and
        Cloudflare (this website&rsquo;s hosting). We do not sell your personal
        data. Bench locations also draw on OpenStreetMap data, contributed by its
        community under the Open Database License.
      </p>

      <h2>What others can see</h2>
      <p>
        Benches you add to the map — including their location, qualities, and any
        photos or notes — are public to all users. Your hoard (your saved
        benches and their tags) is private to you. Comfort reviews are shown on a
        bench without identifying you.
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
