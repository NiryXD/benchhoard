"use client";

import { useState, type FormEvent } from "react";

// TODO(backend): docs/plan/08-backend-contracts.md defines the Edge Functions
// and none of them is a waitlist intake yet. Add a `join-waitlist` contract
// there, deploy it (Supabase Edge Function, free tier), and point this
// constant at the deployed URL. Until then every submission takes the
// graceful-failure path below — by design.
const WAITLIST_ENDPOINT = "/api/join-waitlist"; // placeholder — not provisioned

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "ok" | "err";

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email) || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  }

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <div className="form-card-head">
        <strong>Request for Early Access</strong>
        <span className="form-no">Form LTB‑001 · Rev. A</span>
      </div>
      <div className="form-card-body">
        <div className="form-row">
          <input
            type="email"
            name="email"
            required
            placeholder="Work-appropriate email address"
            aria-label="Email address"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!EMAIL_RE.test(email) || status === "submitting"}
          >
            {status === "submitting" ? "Routing for approval…" : "Submit for Consideration"}
          </button>
        </div>
        <p className="form-hint">
          Employee Referral Bonus in effect: refer a colleague and you both
          move up the list. Hiring is who you know.
        </p>
        {status === "ok" && (
          <p className="form-status ok" role="status">
            Application received. Expect a response within 3–5 business
            heartbeats.
          </p>
        )}
        {status === "err" && (
          <p className="form-status err" role="status">
            We&rsquo;ll circle back. Your enthusiasm has been noted in your
            permanent file.
          </p>
        )}
      </div>
    </form>
  );
}
