import { test } from "node:test";
import assert from "node:assert/strict";
import { glossary } from "./glossary";
import { AMENITIES, SEAT_TYPES, SIGHTLINES } from "./taxonomies";

/**
 * The pivot away from the dating/hiring domain must be total — none of the old
 * vocabulary may leak into Benchhoard's user-facing copy.
 */
const BANNED =
  /\b(match|matches|matched|swipe|swipes|swiped|candidate|candidates|resume|recruiter|headhunt|inmail|linkedin|dating)\b/i;

const collectStrings = (node: unknown, path: string): Array<[string, string]> => {
  if (typeof node === "string") return [[path, node]];
  if (typeof node === "function") {
    // Exercise copy factories with representative args so their output is scanned too.
    return [[`${path}(…)`, String((node as (...a: never[]) => string)(...([3] as never[])))]];
  }
  if (Array.isArray(node)) {
    return node.flatMap((v, i) => collectStrings(v, `${path}[${i}]`));
  }
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) =>
      collectStrings(v, path ? `${path}.${k}` : k),
    );
  }
  return [];
};

test("no user-facing copy carries over dating/hiring vocabulary", () => {
  for (const [path, value] of collectStrings(glossary, "")) {
    const hit = value.match(BANNED);
    assert.equal(hit, null, `glossary.${path} contains banned word "${hit?.[0]}"`);
  }
});

test("every seat type has a label and a hostility blurb", () => {
  for (const seat of SEAT_TYPES) {
    assert.ok(glossary.seatTypes[seat], `missing seat label for "${seat}"`);
    assert.ok(glossary.hostility.blurb[seat], `missing hostility blurb for "${seat}"`);
  }
});

test("every amenity and sightline has a human label", () => {
  for (const amenity of AMENITIES) {
    assert.ok(glossary.amenities[amenity], `missing amenity label for "${amenity}"`);
  }
  for (const sightline of SIGHTLINES) {
    assert.ok(glossary.sightlines[sightline], `missing sightline label for "${sightline}"`);
  }
});

test("the four primary tabs are named", () => {
  assert.deepEqual(Object.keys(glossary.tabs), ["map", "compass", "hoard", "you"]);
});
