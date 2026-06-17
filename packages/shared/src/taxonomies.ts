// [Opus 4.8] Benchhoard taxonomies — replaces the dating-app domain.
/**
 * Fixed taxonomies — single source of truth for bench detail pickers, map
 * filters, gamification, and analytics. Stored in the DB as the string values
 * below.
 */

/**
 * The Hostility Index spectrum — how welcoming a seat is, from a flat "true
 * bench" you can lie down on to a hostile leaning rail designed to move you
 * along. Ordered welcoming → hostile; the rank lives in HOSTILITY_RANK.
 */
export const SEAT_TYPES = [
  "true_bench",
  "picnic_table",
  "individual_seats",
  "divided_bench",
  "ledge",
  "leaning_rail",
] as const;
export type SeatType = (typeof SEAT_TYPES)[number];

/**
 * The Hostility Index: 0 = completely welcoming (lie down, spread out), 4 =
 * openly hostile (you cannot rest here). Drives marker color and the
 * "comfortable enough to sit" map filter, the way DEGREE_RANK drove the
 * "Bachelor's or higher" filter in the old domain.
 */
export const HOSTILITY_RANK: Record<SeatType, number> = {
  true_bench: 0,
  picnic_table: 0,
  individual_seats: 1,
  divided_bench: 2,
  ledge: 3,
  leaning_rail: 4,
};

export const MATERIALS = [
  "wood",
  "stone",
  "metal",
  "concrete",
  "plastic",
  "mixed",
] as const;
export type Material = (typeof MATERIALS)[number];

/** The Exposure Factor — baked in the sun, dappled, or fully shaded. */
export const SUN_EXPOSURE = ["full_sun", "partial_shade", "full_shade"] as const;
export type SunExposure = (typeof SUN_EXPOSURE)[number];

/** The Audio Profile — how loud the spot is. */
export const NOISE_LEVELS = ["quiet", "moderate", "loud"] as const;
export type NoiseLevel = (typeof NOISE_LEVELS)[number];

/** The Sightlines — what you're looking at while you sit. */
export const SIGHTLINES = [
  "people_watching",
  "nature",
  "water",
  "skyline",
  "street",
  "wall",
] as const;
export type Sightline = (typeof SIGHTLINES)[number];

/** Multi-select amenities near or built into the bench. Stored as text[]. */
export const AMENITIES = [
  "backrest",
  "covered",
  "lit_at_night",
  "near_water_fountain",
  "near_restroom",
  "near_trash",
  "wheelchair_accessible",
] as const;
export type Amenity = (typeof AMENITIES)[number];

/**
 * Discovery incentive — achievements a hoarder can unlock. Fixed list so the
 * badge wall stays curated and the unlock checks have a stable key to write to
 * `badges_earned.badge` (same shape rationale as the old PHOTO_SLOTS list).
 */
export const BADGES = [
  { key: "first_claim", label: "First Claim", description: "Hoard your first bench." },
  { key: "pathfinder", label: "Pathfinder", description: "Add your first bench to the map." },
  { key: "cartographer", label: "Cartographer", description: "Add ten benches to the map." },
  { key: "shade_seeker", label: "Shade Seeker", description: "Hoard a fully shaded bench." },
  { key: "night_owl", label: "Night Owl", description: "Hoard a bench that's lit at night." },
  { key: "people_watcher", label: "People Watcher", description: "Hoard a prime people-watching spot." },
  { key: "centurion", label: "Centurion", description: "Earn one hundred discovery points." },
  { key: "hoarder", label: "Certified Hoarder", description: "Claim twenty-five benches." },
] as const;
export type Badge = (typeof BADGES)[number]["key"];

/**
 * Points awarded for each contribution to the urban archive. Must match the
 * server-side award logic in the bh_* RPCs.
 */
export const DISCOVERY_POINTS = {
  addBench: 25,
  reviewBench: 10,
  firstVisit: 5,
  hoardBench: 2,
} as const;

/** Business rules shared by the client and the server-side RPCs. */
export const LIMITS = {
  addBenchMaxPerDay: 20,
  hoardMax: 200,
  nearbyRadiusKmDefault: 2,
  nearbyRadiusKmMax: 25,
  nearbyLimit: 50,
  photoMaxPerBench: 6,
  noteMaxChars: 280,
  labelMaxChars: 60,
  reviewNoteMaxChars: 200,
} as const;
