// ─── [Opus 4.8] Benchhoard pure logic, extracted for unit testing ───────────
// OpenStreetMap tag → Benchhoard taxonomy mapping and discovery-point values.
// Kept free of any I/O so it can be tested without a network or DB (see
// benches.test.ts). The seeder (supabase/seed/benches-osm.mjs) mirrors this
// mapping; the values here mirror DISCOVERY_POINTS in packages/shared.

export type OsmTags = Record<string, string>;

export type MappedBench = {
  name?: string;
  seatType: string;
  material?: string;
  amenities: string[];
  capacity?: number;
};

/** OSM `material=*` values → our MATERIALS taxonomy. */
const MATERIAL_MAP: Record<string, string> = {
  wood: 'wood',
  wooden: 'wood',
  timber: 'wood',
  stone: 'stone',
  granite: 'stone',
  marble: 'stone',
  metal: 'metal',
  steel: 'metal',
  iron: 'metal',
  concrete: 'concrete',
  plastic: 'plastic',
};

/**
 * Map the tags of an OSM `amenity=bench` node onto a bench row. An OSM bench is,
 * by definition, a flat public bench — a "true bench" in the Hostility Index —
 * so the detail we can recover is its material, amenities, and seat count.
 */
export function osmTagsToBench(tags: OsmTags): MappedBench {
  const amenities: string[] = [];
  if (tags.backrest === 'yes') amenities.push('backrest');
  if (tags.covered === 'yes' || tags.shelter === 'yes') amenities.push('covered');
  if (tags.lit === 'yes') amenities.push('lit_at_night');
  if (tags.wheelchair === 'yes') amenities.push('wheelchair_accessible');

  const material = tags.material ? MATERIAL_MAP[tags.material.toLowerCase()] : undefined;

  const seats = Number.parseInt(tags.seats ?? '', 10);
  const capacity = Number.isInteger(seats) && seats > 0 ? Math.min(seats, 20) : undefined;

  return {
    name: tags.name?.trim() || undefined,
    seatType: 'true_bench',
    material,
    amenities,
    capacity,
  };
}

/** Discovery-point award per action. Mirrors DISCOVERY_POINTS in @benchhoard/shared. */
export const DISCOVERY_POINTS: Record<string, number> = {
  added: 25,
  reviewed: 10,
  first_visit: 5,
  hoarded: 2,
};

export function pointsFor(kind: string): number {
  return DISCOVERY_POINTS[kind] ?? 0;
}
