"use client";

import { useState } from "react";

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "0.8rem 1.1rem",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: "0.92rem",
  outline: "none",
  width: "100%",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const labelStyle: React.CSSProperties = {
  fontSize: "0.82rem",
  fontWeight: 600,
  color: "rgba(255,255,255,0.55)",
  display: "block",
  marginBottom: "0.35rem",
};

export function LeadForm() {
  const [fields, setFields] = useState({ name: "", email: "", phone: "", goal: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof fields>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState("");

  function set(key: keyof typeof fields) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFields(f => ({ ...f, [key]: e.target.value }));
      setErrors(e2 => ({ ...e2, [key]: undefined }));
    };
  }

  function validate() {
    const e: Partial<typeof fields> = {};
    if (!fields.name.trim()) e.name = "Please enter your name";
    if (!fields.email.trim()) { e.email = "Please enter your email"; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) { e.email = "Invalid email address"; }
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSubmitting(true);
    setServerError("");
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fields.name.trim(), email: fields.email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setServerError(data.error ?? "Submission failed. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--green)", fontWeight: 700, fontSize: "1.05rem" }}>
        ✓ Request sent! Dr. Bao will be in touch soon.
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
        <div>
          <label style={labelStyle}>Your Name *</label>
          <input type="text" placeholder="John Smith" value={fields.name} onChange={set("name")} style={inputStyle} />
          {errors.name && <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.3rem" }}>{errors.name}</p>}
        </div>
        <div>
          <label style={labelStyle}>Email Address *</label>
          <input type="email" placeholder="you@example.com" value={fields.email} onChange={set("email")} style={inputStyle} />
          {errors.email && <p style={{ color: "#ef4444", fontSize: "0.78rem", marginTop: "0.3rem" }}>{errors.email}</p>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
        <div>
          <label style={labelStyle}>Phone (optional)</label>
          <input type="tel" placeholder="+1 (555) 000-0000" value={fields.phone} onChange={set("phone")} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Primary Goal</label>
          <select value={fields.goal} onChange={set("goal")} style={{ ...inputStyle, appearance: "none" }}>
            <option value="">Select your goal…</option>
            <option>Reduce taxes</option>
            <option>Build retirement income</option>
            <option>College funding</option>
            <option>Grow wealth tax-free</option>
            <option>Start a family foundation</option>
            <option>All of the above</option>
          </select>
        </div>
      </div>
      <div>
        <label style={labelStyle}>Tell us about your situation</label>
        <textarea placeholder="What's your biggest financial challenge right now?" value={fields.message} onChange={set("message")} rows={4} style={{ ...inputStyle, resize: "vertical", minHeight: 110 }} />
      </div>
      {serverError && <p style={{ color: "#ef4444", fontSize: "0.82rem" }}>{serverError}</p>}
      <button
        type="submit"
        disabled={submitting}
        style={{ width: "100%", padding: "1.1rem 2rem", borderRadius: 11, background: submitting ? "rgba(34,197,94,0.5)" : "var(--green)", color: "#07090e", fontWeight: 800, fontSize: "1.05rem", border: "none", cursor: submitting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
      >
        {submitting ? "Sending…" : "Send My Request — It's Free →"}
      </button>
      <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)" }}>
        🔒 No credit card · No obligation · 100% free
      </p>
    </form>
  );
}
