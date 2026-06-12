import { test } from "node:test";
import assert from "node:assert/strict";
import {
  coverLetterSchema,
  educationSchema,
  experienceSchema,
  photoSchema,
  preferencesSchema,
  profileSchema,
} from "./schemas";
import { LIMITS } from "./taxonomies";

/** Birthdate of someone turning `years` old roughly `years` years ago, with a safety margin. */
const birthdateAged = (years: number) => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  d.setDate(d.getDate() - 1); // avoid same-day boundary flake
  return d.toISOString().slice(0, 10);
};

const validExperience = {
  title: "Staff Engineer",
  industry: "Tech",
  startYear: 2019,
  endYear: null,
};

const validProfile = {
  firstName: "Alex",
  headline: "Synergy-driven individual contributor",
  openToWork: "committed",
  birthdate: birthdateAged(28),
  gender: "woman",
  experience: [validExperience],
  education: [],
  behavioralAnswers: [],
};

test("profileSchema accepts a valid profile", () => {
  assert.ok(profileSchema.safeParse(validProfile).success);
});

test("profileSchema rejects under-18 birthdates (store-required age gate)", () => {
  const minor = { ...validProfile, birthdate: birthdateAged(17) };
  assert.equal(profileSchema.safeParse(minor).success, false);
});

test("profileSchema accepts an 18+ birthdate near the boundary", () => {
  const adult = { ...validProfile, birthdate: birthdateAged(18) };
  assert.ok(profileSchema.safeParse(adult).success);
});

test("profileSchema enforces LIMITS.maxExperienceEntries", () => {
  const padded = {
    ...validProfile,
    experience: Array(LIMITS.maxExperienceEntries + 1).fill(validExperience),
  };
  assert.equal(profileSchema.safeParse(padded).success, false);
});

test("experienceSchema allows endYear === null (Present) and endYear === startYear", () => {
  assert.ok(experienceSchema.safeParse(validExperience).success);
  assert.ok(
    experienceSchema.safeParse({ ...validExperience, endYear: 2019 }).success,
  );
});

test("experienceSchema rejects endYear before startYear", () => {
  const flipped = { ...validExperience, startYear: 2020, endYear: 2018 };
  assert.equal(experienceSchema.safeParse(flipped).success, false);
});

test("experienceSchema caps the one-liner at the shared limit", () => {
  const long = {
    ...validExperience,
    oneLiner: "x".repeat(LIMITS.experienceOneLinerMaxChars + 1),
  };
  assert.equal(experienceSchema.safeParse(long).success, false);
});

test("educationSchema allows class years a few years into the future", () => {
  const grad = {
    school: "State University",
    degreeLevel: "Bachelor's",
    classYear: new Date().getFullYear() + 4,
  };
  assert.ok(educationSchema.safeParse(grad).success);
});

test("coverLetterSchema defaults isHeadhunt to false and caps body length", () => {
  const base = {
    toUserId: "user_abc123",
    annotatedItem: { kind: "photo", id: "headshot" },
    body: "Your org chart has a you-shaped vacancy.",
  };
  const parsed = coverLetterSchema.parse(base);
  assert.equal(parsed.isHeadhunt, false);

  const tooLong = { ...base, body: "x".repeat(LIMITS.coverLetterMaxChars + 1) };
  assert.equal(coverLetterSchema.safeParse(tooLong).success, false);
});

test("preferencesSchema rejects age ranges below 18", () => {
  const prefs = {
    ageRange: { value: [17, 35] as [number, number], isDealbreaker: false },
    maxDistanceKm: 50,
    genders: { value: ["man"], isDealbreaker: false },
  };
  assert.equal(preferencesSchema.safeParse(prefs).success, false);
  assert.ok(
    preferencesSchema.safeParse({
      ...prefs,
      ageRange: { value: [21, 35], isDealbreaker: true },
    }).success,
  );
});

test("photoSchema only accepts defined photo slots", () => {
  const photo = { slot: "headshot", storagePath: "u/1/headshot.jpg", position: 0 };
  assert.ok(photoSchema.safeParse(photo).success);
  assert.equal(
    photoSchema.safeParse({ ...photo, slot: "gym_mirror" }).success,
    false,
  );
});
