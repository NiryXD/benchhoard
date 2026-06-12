import { test } from "node:test";
import assert from "node:assert/strict";
import { glossary } from "./glossary";
import { PIPELINE_STAGES } from "./taxonomies";

/**
 * The bit is the product. Dating-app vocabulary and trademarked terms must
 * never leak into user-facing copy (see the glossary header comment).
 */
const BANNED = /\b(like|likes|liked|match|matches|matched|swipe|swipes|swiped|linkedin|inmail)\b/i;

const collectStrings = (node: unknown, path: string): Array<[string, string]> => {
  if (typeof node === "string") return [[path, node]];
  if (typeof node === "function") {
    return [[`${path}(…)`, (node as (n: string) => string)("Alex")]];
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

test("no user-facing copy breaks character (banned vocabulary)", () => {
  for (const [path, value] of collectStrings(glossary, "")) {
    const hit = value.match(BANNED);
    assert.equal(hit, null, `glossary.${path} contains banned word "${hit?.[0]}"`);
  }
});

test("pipeline stage labels stay in sync with PIPELINE_STAGES", () => {
  assert.equal(glossary.pipeline.stages.length, PIPELINE_STAGES.length);
  // Labels are the Title Case rendering of the snake_case stage keys.
  PIPELINE_STAGES.forEach((stage, i) => {
    const expected = stage
      .split("_")
      .map((w) => w[0]!.toUpperCase() + w.slice(1))
      .join(" ");
    assert.equal(glossary.pipeline.stages[i], expected);
  });
});

test("rejection letter template addresses the candidate by name", () => {
  const letter = glossary.rejectionLetterTemplate("Jordan");
  assert.ok(letter.startsWith("Dear Jordan,"));
});
