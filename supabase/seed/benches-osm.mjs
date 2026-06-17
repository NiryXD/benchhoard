// Seed real benches from OpenStreetMap so the map is populated on day one.
// Run from the repo root:  node supabase/seed/benches-osm.mjs
// Uses the service key from .env (server-side only; bypasses RLS).
//
// Idempotent: rows are upserted on osm_id, so re-running picks up new OSM
// benches without duplicating existing ones. Override the area with a bounding
// box env var:  BENCH_BBOX="south,west,north,east"  (defaults to Knoxville, TN).
//
// The tag → taxonomy mapping mirrors supabase/functions/_shared/benches.ts,
// which is the unit-tested source of truth for that logic.

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env', 'utf8')
    .split(/\r?\n/)
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY);

// Default bbox: downtown Knoxville, TN (matches the dev seed's home region).
const BBOX = (env.BENCH_BBOX ?? '35.94,-83.95,35.98,-83.89')
  .split(',')
  .map((n) => Number(n.trim()));

const MATERIAL_MAP = {
  wood: 'wood', wooden: 'wood', timber: 'wood',
  stone: 'stone', granite: 'stone', marble: 'stone',
  metal: 'metal', steel: 'metal', iron: 'metal',
  concrete: 'concrete', plastic: 'plastic',
};

/** Mirror of osmTagsToBench in _shared/benches.ts (the tested source of truth). */
function mapTags(tags = {}) {
  const amenities = [];
  if (tags.backrest === 'yes') amenities.push('backrest');
  if (tags.covered === 'yes' || tags.shelter === 'yes') amenities.push('covered');
  if (tags.lit === 'yes') amenities.push('lit_at_night');
  if (tags.wheelchair === 'yes') amenities.push('wheelchair_accessible');

  const material = tags.material ? MATERIAL_MAP[tags.material.toLowerCase()] : null;
  const seats = Number.parseInt(tags.seats ?? '', 10);
  const capacity = Number.isInteger(seats) && seats > 0 ? Math.min(seats, 20) : null;

  return {
    name: tags.name?.trim() || null,
    seat_type: 'true_bench',
    material,
    amenities,
    capacity,
  };
}

async function fetchOsmBenches([south, west, north, east]) {
  const query = `[out:json][timeout:60];node["amenity"="bench"](${south},${west},${north},${east});out body;`;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!res.ok) throw new Error(`Overpass request failed: ${res.status} ${res.statusText}`);
  const json = await res.json();
  return (json.elements ?? []).filter((e) => e.type === 'node' && e.lat != null && e.lon != null);
}

async function main() {
  if (BBOX.length !== 4 || BBOX.some((n) => Number.isNaN(n))) {
    throw new Error('BENCH_BBOX must be "south,west,north,east" decimal degrees.');
  }
  console.log(`Querying OpenStreetMap for benches in [${BBOX.join(', ')}]…`);
  const nodes = await fetchOsmBenches(BBOX);
  console.log(`Found ${nodes.length} benches.`);
  if (nodes.length === 0) {
    console.warn('Nothing to import — try a larger bounding box via BENCH_BBOX.');
    return;
  }

  const rows = nodes.map((n) => ({
    osm_id: n.id,
    location: `POINT(${n.lon} ${n.lat})`,
    verified: true,
    ...mapTags(n.tags),
  }));

  // Upsert in chunks so a large city import doesn't exceed request limits.
  const CHUNK = 500;
  let imported = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const batch = rows.slice(i, i + CHUNK);
    const { error } = await supabase
      .from('benches')
      .upsert(batch, { onConflict: 'osm_id', ignoreDuplicates: true });
    if (error) throw error;
    imported += batch.length;
    process.stdout.write(`  upserted ${imported}/${rows.length}\r`);
  }

  console.log(`\nDone: ${rows.length} OpenStreetMap benches on the map.`);
}

main().catch((e) => {
  console.error('Bench seed failed:', e.message ?? e);
  process.exit(1);
});
