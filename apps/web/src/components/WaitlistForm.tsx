"use client";

import { useEffect, useState, type FormEvent } from "react";
import { WAITLIST_ENDPOINT } from "@/lib/endpoints";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Status = "idle" | "submitting" | "ok" | "err";

type WaitlistResult = {
  referralCode: string;
  position: number;
  alreadyOnList: boolean;
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<WaitlistResult | null>(null);
  const [ref, setRef] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ?ref=CODE arrives via shared referral links; static export, so read it
  // client-side rather than through routing
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref");
    if (code) setRef(code);
  }, []);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email) || status === "submitting") return;
    setStatus("submitting");
    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ref ? { email, ref } : { email }),
      });
      if (!res.ok) {
        setStatus("err");
        return;
      }
      setResult((await res.json()) as WaitlistResult);
      setStatus("ok");
    } catch {
      setStatus("err");
    }
  }

  async function copyReferralLink() {
    if (!result) return;
    const link = `${window.location.origin}/?ref=${result.referralCode}#waitlist`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // clipboard unavailable — the visible link is still selectable
    }
  }

  if (status === "ok" && result) {
    return (
      <div className="form-card">
        <div className="form-card-head">
          <strong>Application Received</strong>
          <span className="form-no">Form LTB‑001 · Filed</span>
        </div>
        <div className="form-card-body">
          <p className="form-result-lede">
            {result.alreadyOnList
              ? "You're already in the system — HR appreciates the follow-up."
              : "Welcome to the candidate pool."}{" "}
            You are <strong>#{result.position}</strong> in the queue.
          </p>
          <p className="form-hint">
            Employee Referral Bonus: every colleague who joins through your
            link moves you up.
          </p>
          <div className="ref-row">
            <code className="ref-chip">/?ref={result.referralCode}</code>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={copyReferralLink}
            >
              {copied ? "Copied ✓" : "Copy referral link"}
            </button>
          </div>
        </div>
      </div>
    );
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
          {ref
            ? "You were referred by a colleague — you both move up the list."
            : "Employee Referral Bonus in effect: refer a colleague and you both move up the list. Hiring is who you know."}
        </p>
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
