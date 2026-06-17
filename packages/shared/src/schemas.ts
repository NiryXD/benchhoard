// [Opus 4.8] Benchhoard validation schemas — replaces the dating-app schemas.
import { z } from "zod";
import {
  AMENITIES,
  LIMITS,
  MATERIALS,
  NOISE_LEVELS,
  SEAT_TYPES,
  SIGHTLINES,
  SUN_EXPOSURE,
} from "./taxonomies";

/** WGS84 coordinate pair — the contract for everything the map writes. */
export const latitudeSchema = z.number().min(-90).max(90);
export const longitudeSchema = z.number().min(-180).max(180);

/**
 * A bench as submitted from the Add-a-Bench flow. The server turns lat/lng into
 * a PostGIS `POINT(lng lat)` exactly the way the old onboarding flow did.
 */
export const benchSchema = z.object({
  name: z.string().max(80).optional(),
  lat: latitudeSchema,
  lng: longitudeSchema,
  seatType: z.enum(SEAT_TYPES),
  material: z.enum(MATERIALS).optional(),
  sunExposure: z.enum(SUN_EXPOSURE).optional(),
  noise: z.enum(NOISE_LEVELS).optional(),
  sightline: z.enum(SIGHTLINES).optional(),
  amenities: z
    .array(z.enum(AMENITIES))
    .max(AMENITIES.length)
    .default([])
    .refine((a) => new Set(a).size === a.length, {
      message: "Amenities must be unique",
    }),
  capacity: z.number().int().min(1).max(20).optional(),
  notes: z.string().max(LIMITS.noteMaxChars).optional(),
});
export type BenchInput = z.infer<typeof benchSchema>;

/** A comfort review left on a bench (1 = unusable, 5 = perfect). */
export const benchReviewSchema = z.object({
  benchId: z.string().uuid(),
  comfort: z.number().int().min(1).max(5),
  note: z.string().max(LIMITS.reviewNoteMaxChars).optional(),
});
export type BenchReview = z.infer<typeof benchReviewSchema>;

/** Claiming ("hoarding") a bench, with an optional personal tag. */
export const hoardEntrySchema = z.object({
  benchId: z.string().uuid(),
  label: z.string().max(LIMITS.labelMaxChars).optional(),
});
export type HoardEntry = z.infer<typeof hoardEntrySchema>;

/** Map query for the nearest benches around a point. */
export const nearbyQuerySchema = z.object({
  lat: latitudeSchema,
  lng: longitudeSchema,
  radiusKm: z.number().int().min(1).max(LIMITS.nearbyRadiusKmMax).default(LIMITS.nearbyRadiusKmDefault),
  limit: z.number().int().min(1).max(LIMITS.nearbyLimit).default(LIMITS.nearbyLimit),
});
export type NearbyQuery = z.infer<typeof nearbyQuerySchema>;
