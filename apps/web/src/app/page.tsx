import Link from "next/link";
import { BADGES, glossary, HOSTILITY_RANK, SEAT_TYPES, type SeatType } from "@benchhoard/shared";
import { WaitlistForm } from "@/components/WaitlistForm";

// [Opus 4.8] Benchhoard landing — a quiet field guide to public seating.
const FACTS = [
  "Benches mapped: growing daily",
  "Hostility Index: from true bench to leaning rail",
  "Compass: points you to the nearest place to sit",
  "Browsing is free, forever",
  "Built on OpenStreetMap + the benches you add",
  "Hoard your favorite spots",
  "A small act of reclaiming public space",
];

const hostilityLabel = (rank: number) =>
  rank <= 0 ? glossary.hostility.welcoming : rank <= 2 ? glossary.hostility.moderate : glossary.hostility.hostile;

export default function Home() {
  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link href="/" className="wordmark">
            <span className="wordmark-badge">{glossary.brand.shortName}</span>
            {glossary.brand.name}
          </Link>
          <nav className="topnav" aria-label="Primary">
            <a href="#qualities">The Qualities</a>
            <a href="#hoard">Hoarding</a>
            <a href="#pricing">Pricing</a>
          </nav>
          <a href="#waitlist" className="btn btn-primary">
            Get notified
          </a>
        </div>
      </header>

      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[...FACTS, ...FACTS].map((fact, i) => (
            <span key={i}>{fact}</span>
          ))}
        </div>
      </div>

      <main>
        <section className="wrap hero">
          <div>
            <span className="eyebrow rise rise-1">A field guide to sitting down</span>
            <h1 className="rise rise-2">{glossary.brand.tagline}</h1>
            <p className="sub rise rise-3">
              {glossary.brand.name} maps the public benches around you and tells you what each one is
              actually like — flat or boxed-in, sun or shade, quiet or loud, and what you&rsquo;ll be
              looking at. A compass points you to the nearest one.{" "}
              <strong>Find a place to pause, on your own terms.</strong>
            </p>
            <div className="hero-ctas rise rise-4">
              <a href="#waitlist" className="btn btn-primary">
                Get notified at launch
              </a>
              <a href="#qualities" className="btn btn-ghost">
                See what we track
              </a>
            </div>
            <p className="hero-fineprint rise rise-4">
              Browsing is free — no account needed. Sign in only to hoard benches and earn discovery
              points. <a href="#pricing">Pricing philosophy</a>.
            </p>
          </div>

          <div className="bench-card rise rise-5" aria-hidden="true">
            <span className="stamp">{glossary.hostility.welcoming}</span>
            <div className="bench-head">
              <div className="bench-avatar">🪑</div>
              <div>
                <div className="bench-name">The willow bench</div>
                <div className="bench-role">True bench · faces the fountain</div>
                <span className="tag">{glossary.sunExposure.full_shade}</span>
              </div>
            </div>
            <hr className="bench-rule" />
            <div className="bench-section-label">{glossary.bench.sightline}</div>
            <blockquote>&ldquo;{glossary.sightlines.water} — quiet enough to hear it.&rdquo;</blockquote>
            <hr className="bench-rule" />
            <div className="bench-section-label">{glossary.bench.amenities}</div>
            <blockquote>
              {glossary.amenities.backrest} · {glossary.amenities.near_water_fountain}
            </blockquote>
            <div className="bench-actions">
              <span className="btn btn-ghost">{glossary.bench.directions}</span>
              <span className="btn btn-primary">{glossary.hoard.claim}</span>
            </div>
          </div>
        </section>

        <section className="section" id="qualities">
          <div className="wrap">
            <span className="eyebrow">The Hostility Index</span>
            <h2>Not all seating wants you to stay.</h2>
            <p className="section-lede">
              Public space is increasingly designed to be subtly uncomfortable. {glossary.brand.name}{" "}
              grades every spot on how welcoming it actually is — from a flat bench you can lie down on
              to a leaning rail engineered to move you along.
            </p>
            <table className="glossary-table">
              <thead>
                <tr>
                  <th scope="col">Seat type</th>
                  <th scope="col">How welcoming</th>
                  <th scope="col">What it means</th>
                </tr>
              </thead>
              <tbody>
                {SEAT_TYPES.map((s) => (
                  <tr key={s}>
                    <td>{glossary.seatTypes[s]}</td>
                    <td>{hostilityLabel(HOSTILITY_RANK[s as SeatType])}</td>
                    <td>{glossary.hostility.blurb[s]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="process-grid">
              <div className="process-card">
                <div className="process-step">Exposure</div>
                <h3>{glossary.bench.sun}</h3>
                <p>Baked in full sun all afternoon, or shaded by a canopy. We tag it.</p>
              </div>
              <div className="process-card">
                <div className="process-step">Audio</div>
                <h3>{glossary.bench.noise}</h3>
                <p>Ten feet from four lanes of traffic, or a quiet brick courtyard.</p>
              </div>
              <div className="process-card">
                <div className="process-step">Sightlines</div>
                <h3>{glossary.bench.sightline}</h3>
                <p>A blank wall, prime people-watching, or a sunset over the water.</p>
              </div>
              <div className="process-card">
                <div className="process-step">Compass</div>
                <h3>{glossary.tabs.compass}</h3>
                <p>{glossary.compass.sub}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="hoard">
          <div className="wrap">
            <span className="eyebrow">The hoard</span>
            <h2>Build your private archive of the city.</h2>
            <p className="section-lede">
              Claim the spots you love and tag them for what they&rsquo;re good for — &ldquo;best place
              to read at 3 PM,&rdquo; &ldquo;quiet spot to decompress.&rdquo; Add benches nobody&rsquo;s
              mapped yet and earn discovery points and badges as your archive grows.
            </p>
            <div className="process-grid">
              {BADGES.slice(0, 4).map((b) => (
                <div className="process-card" key={b.key}>
                  <div className="process-step">Badge</div>
                  <h3>{b.label}</h3>
                  <p>{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="pricing">
          <div className="wrap">
            <span className="eyebrow">Pricing philosophy</span>
            <h2>Finding a place to sit should be free.</h2>
            <p className="section-lede">
              The whole map, the compass, and every bench&rsquo;s qualities are free and need no
              account. Signing in just lets your hoard and your discovery points follow you across
              devices.
            </p>
            <div className="pricing-card">
              <div className="pricing-tag">Free</div>
              <h3>{glossary.brand.name}</h3>
              <ul>
                <li>The full map of public benches near you</li>
                <li>{glossary.tabs.compass} to the nearest place to sit</li>
                <li>Hoard favorites, add benches, earn discovery points</li>
              </ul>
              <div className="policy-note">
                No paywalls. The incentive to explore is the reward — points, badges, and a city you
                know better than you did yesterday.
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="waitlist">
          <div className="wrap">
            <span className="eyebrow">Launching soon</span>
            <h2>Get notified when your city is mapped.</h2>
            <p className="section-lede">
              We&rsquo;re seeding one area at a time from OpenStreetMap and the benches early hoarders
              add. Leave your email and we&rsquo;ll let you know when yours is ready.
            </p>
            <WaitlistForm />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="wrap footer-inner">
          <div>
            <strong>{glossary.brand.name}</strong> — {glossary.brand.tagline}
            <div className="age-gate">Built for everyone who just needs to sit down.</div>
          </div>
          <nav aria-label="Legal">
            <Link href="/privacy/">Privacy Policy</Link>
            <Link href="/terms/">Terms of Service</Link>
            <Link href="/support/">Support</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
