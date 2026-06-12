"use client";

import { useEffect, useState, type FormEvent } from "react";
import { REFERENCE_ENDPOINT } from "@/lib/endpoints";

// mirrors the server-side caps in supabase/functions/submit-reference
const MAX_BODY = 600;
const MAX_AUTHOR = 80;
const MAX_RELATIONSHIP = 60;

const RELATIONSHIPS = [
  "Former colleague",
  "Current colleague",
  "Friend (personal reference)",
  "Roommate (knows too much)",
  "Family (biased, full disclosure)",
  "Direct report of their heart",
];

type TokenState = "checking" | "missing" | "invalid" | "expired" | "ready";
type SubmitState = "idle" | "submitting" | "done" | "err";

export function ReferenceForm() {
  const [token, setToken] = useState("");
  const [tokenState, setTokenState] = useState<TokenState>("checking");
  const [authorName, setAuthorName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [body, setBody] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>("idle");

  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("token");
    if (!t) {
      setTokenState("missing");
      return;
    }
    setToken(t);
    fetch(`${REFERENCE_ENDPOINT}?token=${encodeURIComponent(t)}`)
      .then((res) => res.json())
      .then((data: { valid: boolean; reason?: string }) => {
        if (data.valid) setTokenState("ready");
        else setTokenState(data.reason === "expired" ? "expired" : "invalid");
      })
      // backend unreachable: let them write; submit will give the real answer
      .catch(() => setTokenState("ready"));
  }, []);

  const canSubmit =
    authorName.trim().length > 0 &&
    authorName.length <= MAX_AUTHOR &&
    body.trim().length > 0 &&
    body.length <= MAX_BODY &&
    submitState !== "submitting";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitState("submitting");
    try {
      const res = await fetch(REFERENCE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          authorName: authorName.trim(),
          relationship: relationship || undefined,
          body: body.trim(),
        }),
      });
      if (res.ok) {
        setSubmitState("done");
      } else if (res.status === 410) {
        setTokenState("expired");
      } else {
        setSubmitState("err");
      }
    } catch {
      setSubmitState("err");
    }
  }

  if (tokenState === "checking") {
    return <p className="ref-state">Pulling your file…</p>;
  }

  if (tokenState === "missing" || tokenState === "invalid" || tokenState === "expired") {
    return (
      <div className="ref-state">
        <h2>
          {tokenState === "expired"
            ? "This request has lapsed."
            : "No open request on file."}
        </h2>
        <p>
          {tokenState === "expired"
            ? "Reference requests expire after 14 days, or once a reference has been filed against them."
            : "Reference links are issued personally, from inside the app."}{" "}
          Ask your candidate to send you a fresh link — they know where the
          button is.
        </p>
      </div>
    );
  }

  if (submitState === "done") {
    return (
      <div className="ref-state">
        <h2>Reference filed.</h2>
        <p>
          Your statement has been entered into the record. The candidate
          reviews and approves all references before display — standard
          procedure, nothing personal.
        </p>
        <p>
          While you&rsquo;re here: <a href="/#waitlist">the candidate pool is
          accepting applications</a>.
        </p>
      </div>
    );
  }

  return (
    <form className="letter ref-letter" onSubmit={onSubmit}>
      <div className="letterhead">
        <span className="lh-brand">letstouchbase</span>
        <span className="lh-office">Professional Reference · Form LTB‑240</span>
      </div>

      <label className="ref-label" htmlFor="ref-author">
        Your full name
      </label>
      <input
        id="ref-author"
        type="text"
        maxLength={MAX_AUTHOR}
        placeholder="As it should appear on the record"
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
      />

      <label className="ref-label" htmlFor="ref-relationship">
        Working relationship <span className="ref-optional">(optional)</span>
      </label>
      <select
        id="ref-relationship"
        value={relationship}
        onChange={(e) => setRelationship(e.target.value)}
      >
        <option value="">Decline to specify</option>
        {RELATIONSHIPS.map((r) => (
          <option key={r} value={r.slice(0, MAX_RELATIONSHIP)}>
            {r}
          </option>
        ))}
      </select>

      <label className="ref-label" htmlFor="ref-body">
        Statement of reference
      </label>
      <textarea
        id="ref-body"
        rows={7}
        maxLength={MAX_BODY}
        placeholder="To whom it may concern: I have known this candidate for some time, and can confirm they answer texts within a reasonable SLA…"
        value={body}
        onChange={(e) => setBody(e.target.value)}
      />
      <div className="ref-counter" aria-live="polite">
        {body.length}/{MAX_BODY}
      </div>

      <div className="ref-actions">
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          {submitState === "submitting" ? "Filing…" : "File This Reference"}
        </button>
      </div>
      {submitState === "err" && (
        <p className="form-status err" role="status">
          The filing system is experiencing turnover. Please try again
          shortly.
        </p>
      )}
    </form>
  );
}
