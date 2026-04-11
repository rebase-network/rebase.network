# Admin Workspace DESIGN.md

Hard visual specification for `apps/admin`.

Use this file for exact styling and component decisions.
Use `apps/admin/design_principles.md` for the workflow and product rationale behind these choices.

## 1. Visual Theme & Atmosphere

The admin workspace is a compact editorial operations tool.

It should feel like:

- a focused workspace for community staff
- warm but controlled
- dense, efficient, and legible
- quieter than the public site

Key characteristics:

- muted warm background with subtle grid texture
- slim sidebar and compact workspace shell
- tight spacing rhythm and restrained panels
- Chinese-first navigation and labels
- rounded surfaces, but with smaller radii than the public site
- utility-oriented typography with limited ornamental display usage

## 2. Color Palette & Roles

### Core Tokens

| Role | Token | Value | Use |
|------|-------|-------|-----|
| Page background | `--page-bg` | `#efe7d7` | admin canvas |
| Surface | `--surface` | `rgba(255, 252, 246, 0.94)` | primary panels |
| Strong surface | `--surface-strong` | `#fffdf8` | brighter cards or overlays |
| Accent surface | `--surface-accent` | `rgba(14, 73, 68, 0.08)` | active utility backgrounds |
| Danger surface | `--surface-danger` | `rgba(167, 52, 32, 0.08)` | destructive warning panels |
| Success surface | `--surface-success` | `rgba(30, 120, 83, 0.08)` | success panels |
| Primary text | `--text` | `#19312d` | all default text |
| Secondary text | `--muted` | `#5f6c68` | helper copy and metadata |
| Border line | `--line` | `rgba(25, 49, 45, 0.14)` | inputs, panels, rows |
| Strong line | `--line-strong` | `rgba(25, 49, 45, 0.24)` | selected or emphasized separators |
| Accent | `--accent` | `#0f6d64` | active nav, primary buttons, focus accents |
| Accent strong | `--accent-strong` | `#0a4f49` | emphasis text and links |
| Accent soft | `--accent-soft` | `#dff1eb` | soft accent fills |
| Danger | `--danger` | `#a73420` | destructive text and states |
| Success | `--success` | `#1e7853` | success text and states |

### Functional Rules

- accent green is the primary operational highlight
- danger red should remain restrained and reserved for risky actions
- backgrounds should stay warm and light, not sterile white
- panel emphasis should come from tint and border change more often than from strong shadows

## 3. Typography Rules

### Font Families

- UI/body: `IBM Plex Sans`, `Noto Sans SC`, `Segoe UI`, sans-serif
- Monospace: `IBM Plex Mono`, `SFMono-Regular`, monospace

### Type Hierarchy

| Role | Font | Size | Weight | Line Height | Notes |
|------|------|------|--------|-------------|-------|
| Page title | IBM Plex Sans | app-specific, around `1.5rem` to `2rem` | 700 | `1.2` to `1.3` | compact section emphasis |
| Nav item | IBM Plex Sans | `0.98rem` | 750 | `1.2` | readable, compact, Chinese-first |
| Body | IBM Plex Sans | `1rem` | 400 | `1.5` | default workspace text |
| Helper/meta | IBM Plex Sans | `0.92rem` or smaller | 400 | `1.4` to `1.5` | muted explanatory copy |
| Utility label | IBM Plex Sans | `0.72rem` | 800 | `1.2` | uppercase accent labels when needed |
| Button | IBM Plex Sans | `0.8rem` to `0.9rem` | 700 | `1.2` | compact but strong |
| Code/meta chips | IBM Plex Mono | `0.68rem` to `0.88em` | 400 | compact | version, small inline code |

### Typography Rules

- admin typography should optimize for scanning and data maintenance, not drama
- Chinese labels should remain comfortable at compact sizes
- metadata can be small, but navigation must not feel tiny
- uppercase utility labels are acceptable in small doses for status and eyebrow text

## 4. Component Stylings

### Sidebar

- narrow default width
- brand area small and practical
- nav links are compact rounded rectangles
- active nav state uses accent tint, stronger border, and a left indicator bar
- version info sits below account and logout area

### Panels

- panels use light surfaces, border, and restrained blur
- panels should feel stable and quiet, not floating like marketing cards
- destructive panels use tinted danger surfaces rather than loud fills

### Buttons

- default shape: pill
- primary button: green gradient fill with white text
- secondary button: surface-backed with border
- danger button: text or border emphasis before strong fills
- compact button variant is preferred inside dense tables and editors

### Inputs

- default input background is soft white
- focus state uses accent border and outer glow ring
- form controls should align tightly with labels and surrounding actions
- avoid oversized textarea wrappers when the field is secondary

### Tables and List Toolbars

- list toolbar should usually fit in one thin row on desktop
- table links are text-like, not pill buttons
- status filters can live inline or in header-level UI when density improves
- pagination is mandatory for long datasets

### Tabs and Split Modes

- use tabs when two workflows are easy to confuse
- tabs should stay visually quiet and compact
- do not create giant duplicated panels for mutually exclusive workflows

### Destructive Actions

- never full-width by default inside dense pages
- smaller size, reduced emphasis, explicit confirmation
- keep them away from primary publish actions

## 5. Layout Principles

### Spacing Scale

Preferred admin spacing rhythm:

- `0.14rem`
- `0.22rem`
- `0.3rem`
- `0.38rem`
- `0.45rem`
- `0.55rem`
- `0.7rem`
- `0.84rem`
- `1rem`

### Shell and Grid

- app shell columns: `142px` sidebar + main workspace
- app shell outer padding: `0.44rem`
- sidebar/workspace gap: about `0.78rem`
- workspace shell should feel like one compact tray, not many disconnected layers

### Radius Scale

| Token | Value | Use |
|------|-------|-----|
| `--radius-lg` | `18px` | workspace panels and major shells |
| `--radius-md` | `14px` | standard panels and cards |
| `--radius-sm` | `10px` | controls and tighter blocks |
| pill | `999px` | buttons, chips, filters |

### Whitespace Philosophy

- minimize dead space between sidebar and workspace
- reduce vertical waste in list pages and editors
- preserve enough rhythm for error prevention and visual grouping
- admin should feel denser than the public site at every comparable layer

## 6. Depth & Elevation

| Level | Treatment | Use |
|------|-----------|-----|
| Canvas | warm gradient background + subtle grid mask | overall app field |
| Workspace shell | light translucent tray with inset highlight | primary frame |
| Panel | surface + border + `--shadow` | content blocks |
| Active item | tint + border + small inset or hover lift | nav/filter/button active state |
| Focus | accent border + 4px outer ring | input focus treatment |

Rules:

- rely more on tint, border, and shell nesting than heavy shadow stacks
- admin depth should stay controlled and legible
- blur is acceptable, but it should support polish rather than dominate the UI

## 7. Do's and Don'ts

### Do

- keep admin pages compact and readable
- let primary editing regions dominate editor layouts
- use one-line toolbars for search, counts, and lightweight actions when possible
- keep navigation narrow and legible
- use explicit but restrained danger styling
- write Chinese-first labels for operator workflows

### Don't

- don't create large empty meta areas beside editors
- don't use huge section headers for ordinary list pages
- don't scatter related controls across multiple disconnected rows without need
- don't style destructive actions like primary CTAs
- don't regress into raw CMS collection vocabulary when task vocabulary exists
- don't enlarge the sidebar just because extra space exists

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Expected Behavior |
|------|-------|-------------------|
| Compact laptop and below | implementation-defined | workspace can stack or simplify only if necessary |
| Primary target | desktop/laptop | optimize for stable desktop editing |

### Responsive Rules

- admin is desktop-first and does not need full mobile parity in v1
- prioritize laptop readability and editing efficiency over touch layouts
- if layouts collapse, preserve the editor and table usability first
- do not spend complexity budget on mobile-specific admin patterns unless explicitly required

## 9. Agent Prompt Guide

### Quick Token Summary

- background: `#efe7d7`
- surface: `rgba(255, 252, 246, 0.94)`
- text: `#19312d`
- muted text: `#5f6c68`
- accent: `#0f6d64`
- accent strong: `#0a4f49`
- danger: `#a73420`
- success: `#1e7853`
- radius: `10px / 14px / 18px`
- primary font: `IBM Plex Sans` + `Noto Sans SC`
- monospace: `IBM Plex Mono`

### Prompt Pattern

Use prompts like:

- "Design a compact Chinese-first admin list page with a narrow left sidebar, one-line toolbar, paginated table, muted helper text, and restrained green accent states."
- "Build a Rebase admin editor where the main content area dominates, secondary metadata is compact, destructive actions are small and confirmed, and panels use soft warm surfaces."
- "Create an admin sidebar using 142px width, dense navigation links, accent-tinted active state, and compact account/version blocks at the bottom."

### Guardrail Reminder

When in doubt:

1. compress before adding more panels
2. keep the operator's primary task visible
3. prefer inline filters and compact toolbars
4. never let decorative UI outrank the editing surface
