# Public Website DESIGN.md

Hard visual specification for `apps/web`.

Use this file for concrete styling and component decisions.
Use `apps/web/design_principles.md` for the product and interaction rationale behind these choices.

## 1. Visual Theme & Atmosphere

The public Rebase website is a community-media interface with editorial warmth.

The visual system should feel like:

- a living archive of developer community activity
- soft but intentional
- content-led rather than promo-led
- crafted, but not precious

Key characteristics:

- warm paper-like background field with layered radial color washes
- glass-soft cards with restrained blur and visible borders
- serif display typography for narrative emphasis
- sans-serif body typography for scanning and utility
- compact archive and detail layouts with limited decorative overhead
- light watermark labels only when they reinforce section identity

## 2. Color Palette & Roles

### Core Tokens

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Page background | `--page-bg` | `#f8f1e2` | overall warm site tone |
| Surface | `--surface` | `rgba(255, 255, 255, 0.88)` | cards and floating panels |
| Strong surface | `--surface-strong` | `#fffdf8` | brighter surface moments |
| Primary text | `--text` | `#1f2933` | headings, body text, default button fill |
| Secondary text | `--muted` | `#5c6b73` | summaries, metadata, helper text |
| Accent | `--accent` | `#0f766e` | highlight tint, active accents |
| Accent strong | `--accent-strong` | `#115e59` | pills, eyebrow text, active states |
| Accent soft | `--accent-soft` | `#d9f1ea` | soft background emphasis |
| Border line | `--line` | `rgba(31, 41, 51, 0.12)` | card borders, separators |

### Supporting Background Washes

Use these as atmospheric accents, not semantic UI colors:

- mint wash: `rgba(209, 236, 228, 0.92)`
- warm apricot wash: `rgba(255, 220, 184, 0.68)`
- sky wash: `rgba(125, 211, 252, 0.18)`

### Functional Rules

- accent colors should guide attention, not dominate large surfaces
- muted text should still remain readable against light surfaces
- cards should stay lighter than the page background
- public pages should not introduce harsh black or saturated neon colors without a deliberate redesign

## 3. Typography Rules

### Font Families

- Display: `Iowan Old Style`, `Palatino Linotype`, `Book Antiqua`, `Georgia`, serif
- Body/UI: `Avenir Next`, `Segoe UI`, `Helvetica Neue`, sans-serif
- Monospace when needed: project default monospace or browser fallback only

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Hero title | Display | `clamp(2.8rem, 6vw, 5.8rem)` | 700-ish serif default | `0.92` | strong narrative headline |
| Detail hero title | Display | `clamp(2.2rem, 4.5vw, 3.8rem)` | 700-ish serif default | `0.94` | tighter detail variant |
| Hero summary | Body | `1.05rem` | 400 | `1.8` | limit to readable width |
| Card title | Display/body mixed by component | `1.32rem` to `1.45rem` | 700 | `1.05` to `1.1` | prioritize scanability |
| Body text | Body | `1rem` | 400 | `1.7` to `1.8` | long-form reading |
| Metadata label | Body | `0.72rem` to `0.78rem` | 800 | `1.2` to `1.4` | uppercase utility labels |
| Button text | Body | `0.9rem` to `1rem` | 700 | `1.2` | compact, strong |

### Typography Rules

- serif is reserved for moments of narrative emphasis: hero titles and certain section headings
- sans-serif handles summaries, metadata, navigation, and actions
- uppercase utility labels are acceptable when they remain short
- never use overly light display weights on the public site; Rebase should feel grounded, not fragile

## 4. Component Stylings

### Buttons

- default shape: pill
- primary button: dark text-color fill with white text
- secondary button: transparent or surface-backed with border
- hover: slight vertical lift and soft shadow
- do not create oversized CTA blocks for archive flows

### Cards

- base card uses `--surface`, border, blur, and `--shadow`
- cards may lift slightly on hover if they are clickable
- clickable cards must remain fully operable across the full intended hit area
- metadata should be concise and placed after title importance is established

### Hero Panels

- hero panels can use subtle gradients and watermark labels
- archive heroes should remain compact
- hero should orient the user once; lower sections should not repeat its explanation

### Toolbars

- use for list labels, counts, and one lightweight action
- left side: label + count
- right side: RSS, back-to-list, or equivalent secondary action
- keep toolbar thinner than section-header blocks

### Navigation

- navigation uses body font, compact pills, and muted defaults
- active nav item should gain background tint and stronger text
- avoid oversized header height on desktop and mobile

### Footer

- footer is a structured utility block, not a marketing close
- social links should prefer recognizable icons
- link groups should remain easy to scan
- avoid mixing technical infrastructure labels into reader-facing footer copy

## 5. Layout Principles

### Spacing Scale

Preferred spacing rhythm for the public site:

- `0.3rem`
- `0.45rem`
- `0.55rem`
- `0.75rem`
- `0.9rem`
- `1rem`
- `1.2rem`
- `1.4rem`
- `1.6rem`
- `1.8rem`

### Containers and Grid

- main content width token: `--content-width: 1180px`
- shell width: `min(calc(100% - 2rem), 1180px)`
- default page hero grid: `1.5fr / 1fr`
- archive grids typically use 2-column or 3-column card layouts on desktop

### Whitespace Philosophy

- give long-form content enough breathing room to read
- compress support sections when they are not the main purpose of the page
- prefer denser archive layouts over large decorative whitespace bands

### Radius Scale

| Token | Value | Use |
|------|-------|-----|
| `--radius-lg` | `32px` | large shells, feature frames |
| `--radius-md` | `20px` | cards and panels |
| `--radius-sm` | `14px` | tighter cards and internal items |
| pill | `999px` | buttons, status pills, metadata chips |

## 6. Depth & Elevation

| Level | Treatment | Use |
|------|-----------|-----|
| Background | layered radial gradients + subtle grid mask | overall atmosphere |
| Card base | `--shadow` and thin border | default content containers |
| Card hover | `--shadow-strong` or custom hover shadow | clickable surfaces |
| Highlight | gradient overlays or soft tint pills | section identity and active accents |

Rules:

- use blur and shadow lightly; surfaces should feel airy, not glossy
- depth should separate content blocks, not create a dashboard aesthetic
- avoid dark shadow stacks that feel enterprise-heavy

## 7. Do's and Don'ts

### Do

- use warm layered backgrounds
- keep archive pages compact
- use serif display type for major headings
- make hover states meaningful
- compress related-content and archive labels into toolbars when possible
- keep RSS visible but secondary

### Don't

- don't repeat hero explanations below the hero
- don't use giant empty sections between archive modules
- don't overload cards with decorative tags
- don't use high-saturation accent backgrounds as default surfaces
- don't make non-clickable cards look clickable

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Expected Behavior |
|------|-------|-------------------|
| Mobile | `<720px` | single-column reading, tighter spacing |
| Tablet / small desktop | `<960px` | collapse hero and detail side layouts to one column |
| Desktop | `>=960px` | multi-column lists and hero/detail support layouts |

### Responsive Rules

- public site must support mobile and desktop
- list grids collapse before text scales down aggressively
- detail sidebars should become inline sections on smaller screens
- keep button hit areas comfortable on touch devices
- preserve readable line lengths and do not shrink body text below comfortable reading size

## 9. Agent Prompt Guide

### Quick Token Summary

- background: `#f8f1e2`
- surface: `rgba(255, 255, 255, 0.88)`
- text: `#1f2933`
- muted text: `#5c6b73`
- accent: `#0f766e`
- accent strong: `#115e59`
- radius: `14px / 20px / 32px`
- container width: `1180px`
- display font: `Iowan Old Style` stack
- body font: `Avenir Next` stack

### Prompt Pattern

Use prompts like:

- "Design a Rebase archive page with a compact editorial hero, warm paper-like background washes, serif headline, scan-friendly card grid, and one thin toolbar above the list."
- "Build a Rebase detail page where the body content appears early, metadata is compact, and related content uses a lightweight toolbar instead of a verbose header block."
- "Create a Rebase card using a soft translucent surface, 20px radius, thin border, gentle lift on hover, and concise metadata under a strong title."

### Guardrail Reminder

When in doubt:

1. reduce repeated explanation
2. preserve content density
3. keep hover and click behavior aligned
4. make archive pages feel useful before making them feel decorative
