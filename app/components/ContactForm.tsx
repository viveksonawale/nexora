"use client";

import { useState } from "react";
import { ShinyButton } from "./ShinyButton";
import { Send } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
    }, 600);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {submitted && (
        <div className="p-4 rounded-[8px] bg-[#F97316]/15 border border-[#F97316] text-[#F97316] text-sm font-sans flex items-center gap-2">
          <span>✓</span> Thank you! Your message has been received. Our team will get back to you shortly.
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          required
          type="text"
          placeholder="First Name"
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 outline-none focus:border-[#F97316] transition-colors"
        />
        <input
          required
          type="text"
          placeholder="Last Name"
          className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 outline-none focus:border-[#F97316] transition-colors"
        />
      </div>
      <input
        required
        type="email"
        placeholder="Email Address"
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 outline-none focus:border-[#F97316] transition-colors"
      />
      <textarea
        required
        placeholder="How can we help your team or hackathon?"
        rows={4}
        className="w-full bg-[var(--bg-elevated)] border border-[var(--border)] rounded-[8px] px-4 py-2.5 text-[var(--text-primary)] placeholder-[var(--text-secondary)]/60 outline-none focus:border-[#F97316] transition-colors resize-none"
      ></textarea>
      
      <div>
        <ShinyButton
          type="submit"
          disabled={loading}
          variant="primary"
          size="md"
          className="w-full sm:w-auto"
        >
          <span>{loading ? "Sending..." : "Send Message"}</span>
          <Send size={15} className="group-hover:translate-x-1 transition-transform" />
        </ShinyButton>
      </div>
    </form>
  );
}
