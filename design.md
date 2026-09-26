# Nexora — Homepage Design Spec

Scope: homepage only (hero + CTA). Frontend only, no backend wiring yet.
Goal: premium, editorial feel — not a generic AI-generated SaaS landing page.

---

## 1. Anti-Slop Checklist (check against this before shipping)

Reject the design if it has any of these:
- Inter or Poppins as the only font
- A floating glass orb / gradient blob as the hero visual
- Purple-to-blue gradient background
- Generic rounded-full pill buttons with a soft drop shadow
- Center-aligned hero text with a stock-photo-style 3D render behind it
- Emoji used as section icons

If it looks like it could be any AI hackathon startup's homepage, it's wrong.

---

## 2. Typography

Claude's actual site fonts (Styrene, Tiempos) are commercially licensed — do not
embed them without a license. Use these open equivalents instead, same effect:

| Role | Font | Source | Notes |
|---|---|---|---|
| Display / Hero headline | Fraunces (weight 300–400, optical size "soft") | Google Fonts | Serif warmth, avoid bold weights — light weight is what reads "premium" |
| Section headings | General Sans (500–600) | Fontshare | Humanist sans, not geometric like Poppins |
| Body text | General Sans (400) | Fontshare | 16–17px base, 1.6 line-height minimum |
| Mono accents (dates, IDs, code, countdown) | JetBrains Mono or Geist Mono | Google Fonts / Vercel | Use for anything that reads as "data" — team codes, timers |

Rule: max 2 font families + 1 mono. Never mix in a third.

---

## 3. Color System

Two full token sets, switched via a `data-theme` attribute or class on `<html>`.
Do NOT hardcode hex values in components — reference tokens only.

```css
:root[data-theme="light"] {
  --bg-canvas: #faf8f4;
  --bg-elevated: #f1ede4;
  --bg-inverse: #14130f;
  --text-primary: #14130f;
  --text-secondary: #5c584d;
  --text-inverse: #faf8f4;
  --accent: #c2542f;
  --accent-soft: #f3e2d8;
  --border: #e3ddd0;
}

:root[data-theme="dark"] {
  --bg-canvas: #121110;
  --bg-elevated: #1c1a17;
  --bg-inverse: #faf8f4;
  --text-primary: #f1ede4;
  --text-secondary: #a39e8f;
  --text-inverse: #14130f;
  --accent: #e07a4f;
  --accent-soft: #2b1f18;
  --border: #2a2722;
}
```

Notes:
- Accent is a warm clay/rust tone, not the default purple/blue every AI product uses.
- Only ONE saturated accent color. Everything else is neutral warm gray, not cool gray.

---

## 4. Spline Hero Strategy

Constraint (see note above): one Spline scene must work in both modes for today's
45-min build. Upgrade path noted below.

**Today's approach:**
- Pick a wireframe / isometric / low-poly scene from spline.design/community —
  not a glass orb, not a gradient blob. Something with geometric/structural
  character (fits "hackathon = building things").
- Place it as a full hero background, but render it under a CSS overlay:
  ```css
  .hero-spline-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 0%, var(--bg-canvas) 90%);
    pointer-events: none;
  }
  ```
- This overlay lets the scene sit legibly under both light and dark text without
  needing two separate exports.

**Later upgrade (not today):** export a light-scene and dark-scene pair from
Spline, swap the embed's scene URL on theme toggle instead of relying on the
overlay trick.

Performance: test on throttled 3G / low-end mobile before demo day. A full-bleed
Spline scene is the heaviest thing on this page — lazy-load it after the
above-the-fold text renders, don't block first paint on it.

---

## 5. Layout — Hero + CTA (minimal scope)

```
[ Nav: logo | theme toggle | CTA button ]

[ Hero ]
  - Eyebrow label (mono, small, uppercase, accent color) — e.g. "FINAL YEAR PROJECT / PERN STACK"
  - Headline (Fraunces, light weight, large, max ~2 lines)
  - Subheadline (General Sans, secondary text color, 1 sentence)
  - Primary CTA button + secondary text link
  - Spline scene as background layer, overlay as above

[ Footer strip ]
  - Minimal: team name / module count / GitHub link
```

No feature grid, no stats section, no testimonials — out of scope per this spec.

---

## 6. Components

- **Buttons:** sharp-ish corners (6–8px radius, not full-pill), solid accent fill
  for primary, 1px border + transparent bg for secondary. No heavy drop shadows —
  use a 1px border + subtle inset highlight instead.
- **Theme toggle:** icon-only (sun/moon), top-right nav, instant switch (no
  animation delay longer than 150ms).
- **Nav:** transparent over hero, background solid on scroll.

---

## 7. Motion

- Hero text: single fade+rise on load, 400–600ms, no bounce/spring easing.
- No parallax scroll effects, no scroll-jacking.
- Spline scene: whatever idle motion is baked into the chosen community scene —
  don't add extra JS-driven motion on top of it.

---

## 8. Open Items (decide before building further pages)

- Whether module overview / stats sections get added later (explicitly out of
  scope for this homepage build)
- Whether the Spline dual-scene light/dark upgrade happens before or after viva
