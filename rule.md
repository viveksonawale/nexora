# Nexora Development & Design Rules

## Core Site Constraints
- Do not change the button design on the home page (`/`).
- Do not change any typography on the hero section and home sections.
- Do not use the em-dash character anywhere in text or across the entire website.

## Design Principles for Other Pages (Excluding Home & Hero Section)
For all new and existing pages, subpages, and views outside the Home page (`/`) and Hero section, follow these principles:

1. **Theme & Color System Consistency**:
   - Always adhere to the website theme and design tokens defined in [design.md](file:///home/duck/projects/nexora/design.md).
   - Use design tokens (`--bg-canvas`, `--bg-elevated`, `--bg-inverse`, `--text-primary`, `--text-secondary`, `--accent`, `--accent-soft`, `--border`) across both light and dark modes.
   - Do not introduce arbitrary color palettes, uncurated hex values, or generic AI styling.

2. **Strict Button Usage (`components/ui`)**:
   - Only use the pre-configured buttons from [components/ui](file:///home/duck/projects/nexora/components/ui):
     - [NorButton](file:///home/duck/projects/nexora/components/ui/nor-button.tsx) (`@/components/ui/nor-button`): Use for standard actions, regular navigation, and triggers.
     - [SaveButton](file:///home/duck/projects/nexora/components/ui/save-button.tsx) (`@/components/ui/save-button`): Use for saving, form submissions, and stateful feedback actions.
   - Do not create custom button components, raw HTML buttons, or unapproved button variations.

3. **Motion & Interactive Components (BeUI Motion)**:
   - Any animated components, interactive elements, or motion transitions must be picked directly from **https://beui.dev/components/motion** (implemented under `@/components/motion/*`).
   - Do not introduce arbitrary third-party motion libraries or inconsistent animation styles outside of this design collection.

4. **Typography & Layout**:
   - Maintain the editorial feel: General Sans for section headings and body, Fraunces for display headings, and mono fonts for data/tags/dates.
   - Keep layouts structured with subtle 1px borders, generous whitespace, and sharp-to-subtle rounded corners (6-8px radius).
