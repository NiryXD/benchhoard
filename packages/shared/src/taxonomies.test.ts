import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AMENITIES,
  BADGES,
  DISCOVERY_POINTS,
  HOSTILITY_RANK,
  MATERIALS,
  NOISE_LEVELS,
  SEAT_TYPES,
  SIGHTLINES,
  SUN_EXPOSURE,
} from "./taxonomies";

const assertUnique = (name: string, values: readonly string[]) => {
  assert.equal(
    new Set(values).size,
    values.length,
    `${name} contains duplicate values`,
  );
};

test("taxonomy arrays contain no duplicates", () => {
  assertUnique("SEAT_TYPES", SEAT_TYPES);
  assertUnique("MATERIALS", MATERIALS);
  assertUnique("SUN_EXPOSURE", SUN_EXPOSURE);
  assertUnique("NOISE_LEVELS", NOISE_LEVELS);
  assertUnique("SIGHTLINES", SIGHTLINES);
  assertUnique("AMENITIES", AMENITIES);
  assertUnique(
    "BADGES keys",
    BADGES.map((b) => b.key),
  );
});

test("HOSTILITY_RANK covers every seat type with a 0–4 tier", () => {
  for (const seat of SEAT_TYPES) {
    const rank = HOSTILITY_RANK[seat];
    assert.ok(
      Number.isInteger(rank) && rank >= 0 && rank <= 4,
      `HOSTILITY_RANK missing or out of range for "${seat}"`,
    );
  }
  // No stale entries for removed seat types either.
  assert.equal(Object.keys(HOSTILITY_RANK).length, SEAT_TYPES.length);
});

test("a true bench is the most welcoming and a leaning rail the most hostile", () => {
  assert.equal(HOSTILITY_RANK.true_bench, 0);
  assert.equal(
    HOSTILITY_RANK.leaning_rail,
    Math.max(...SEAT_TYPES.map((s) => HOSTILITY_RANK[s])),
  );
});

test("every badge has a non-empty label and description", () => {
  for (const badge of BADGES) {
    assert.ok(badge.label.length > 0, `${badge.key} missing label`);
    assert.ok(badge.description.length > 0, `${badge.key} missing description`);
  }
});

test("every discovery-point award is a positive integer", () => {
  for (const [kind, points] of Object.entries(DISCOVERY_POINTS)) {
    assert.ok(
      Number.isInteger(points) && points > 0,
      `DISCOVERY_POINTS.${kind} must award positive points`,
    );
  }
});
