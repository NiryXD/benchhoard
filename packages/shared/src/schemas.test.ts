import { test } from "node:test";
import assert from "node:assert/strict";
import {
  benchReviewSchema,
  benchSchema,
  hoardEntrySchema,
  nearbyQuerySchema,
} from "./schemas";
import { LIMITS } from "./taxonomies";

const validBench = {
  name: "The willow bench",
  lat: 35.96,
  lng: -83.92,
  seatType: "true_bench",
  material: "wood",
  sunExposure: "full_shade",
  noise: "quiet",
  sightline: "water",
  amenities: ["backrest", "near_water_fountain"],
  capacity: 3,
  notes: "Best in the afternoon — shaded, faces the fountain.",
};

const A_UUID = "11111111-1111-4111-8111-111111111111";

test("benchSchema accepts a fully specified bench", () => {
  assert.ok(benchSchema.safeParse(validBench).success);
});

test("benchSchema accepts a minimal bench (location + seat type only)", () => {
  const minimal = { lat: 0, lng: 0, seatType: "leaning_rail" };
  const parsed = benchSchema.parse(minimal);
  assert.deepEqual(parsed.amenities, []); // defaults to empty
});

test("benchSchema rejects out-of-range coordinates", () => {
  assert.equal(benchSchema.safeParse({ ...validBench, lat: 95 }).success, false);
  assert.equal(benchSchema.safeParse({ ...validBench, lng: 181 }).success, false);
});

test("benchSchema rejects unknown enum values", () => {
  assert.equal(benchSchema.safeParse({ ...validBench, seatType: "hammock" }).success, false);
  assert.equal(benchSchema.safeParse({ ...validBench, sunExposure: "twilight" }).success, false);
});

test("benchSchema rejects duplicate amenities", () => {
  const dupes = { ...validBench, amenities: ["backrest", "backrest"] };
  assert.equal(benchSchema.safeParse(dupes).success, false);
});

test("benchSchema caps field notes at the shared limit", () => {
  const long = { ...validBench, notes: "x".repeat(LIMITS.noteMaxChars + 1) };
  assert.equal(benchSchema.safeParse(long).success, false);
});

test("benchReviewSchema only accepts a 1–5 comfort rating", () => {
  assert.ok(benchReviewSchema.safeParse({ benchId: A_UUID, comfort: 5 }).success);
  assert.equal(benchReviewSchema.safeParse({ benchId: A_UUID, comfort: 0 }).success, false);
  assert.equal(benchReviewSchema.safeParse({ benchId: A_UUID, comfort: 6 }).success, false);
});

test("hoardEntrySchema requires a bench uuid and caps the label", () => {
  assert.ok(hoardEntrySchema.safeParse({ benchId: A_UUID, label: "3 PM reading spot" }).success);
  assert.equal(hoardEntrySchema.safeParse({ benchId: "not-a-uuid" }).success, false);
  const long = { benchId: A_UUID, label: "x".repeat(LIMITS.labelMaxChars + 1) };
  assert.equal(hoardEntrySchema.safeParse(long).success, false);
});

test("nearbyQuerySchema clamps to defaults and rejects oversized radius", () => {
  const parsed = nearbyQuerySchema.parse({ lat: 35.96, lng: -83.92 });
  assert.equal(parsed.radiusKm, LIMITS.nearbyRadiusKmDefault);
  assert.equal(parsed.limit, LIMITS.nearbyLimit);
  assert.equal(
    nearbyQuerySchema.safeParse({ lat: 0, lng: 0, radiusKm: LIMITS.nearbyRadiusKmMax + 1 }).success,
    false,
  );
});
