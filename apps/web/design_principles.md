# Web Design Principles

Design principles for the public Rebase website in `apps/web`.

This file explains the public product intent and interaction philosophy.
It does not replace `apps/web/DESIGN.md`, which holds the hard visual specification.

## Product Intent

The public website is a community media surface.

It should help readers:

- understand what Rebase is quickly
- discover current community activity
- browse archives efficiently
- read long-form content without friction
- move between related content with minimal explanation

It should not feel like:

- a corporate brochure site
- a VC portfolio page
- a generic content farm
- a maximalist landing page full of growth copy

## Core Feeling

The public site should feel:

- warm
- editorial
- active
- human
- structured
- trustworthy

The public site should not feel:

- cold
- luxury-minimal for its own sake
- overly promotional
- over-designed relative to the content

## Primary Principles

### Content First

- reading and browsing outrank decoration
- the main content block should be obvious immediately
- decorative texture should support atmosphere, not compete for attention

### Community Media Over Marketing

- show signs of ongoing activity
- let articles, GeekDaily, jobs, and events speak for the community
- avoid repeating the same positioning statement in multiple blocks on the same page

### Compact, Not Cramped

- archive pages should be tight and scan-friendly
- detail pages should be focused and readable
- remove redundant section copy when the next action is already obvious

### One Clear Purpose Per Block

- a hero should orient
- a toolbar should label and route
- a card should summarize and invite entry
- a sidebar should either help action or help interpretation

If a block does not clearly help one of those jobs, compress it or remove it.

### Interaction Must Match Affordance

- if a card lifts on hover, it should usually be clickable
- if an action is secondary, style it as secondary
- if RSS is available, keep it visible but low-emphasis

## Page-Type Guidance

### Homepage

- may be the most expressive page
- should establish the Rebase mood and value quickly
- should feel like a living snapshot of the community
- should not become a dense wall of equal-weight modules

### Archive Pages

Examples:

- GeekDaily list
- jobs list
- articles list
- events list

Rules:

- hero should be concise
- support blocks should be thin
- list content should dominate the page
- use toolbars when a full section header is unnecessary

### Detail Pages

Rules:

- put the main content body near the top
- do not repeat the same metadata in both hero and body unless it changes user decision-making
- keep related-content sections lightweight
- keep action sidebars compact and readable

## Copy Guidance

- use concise, direct labels
- prefer practical language over brand-slogan language
- avoid filler descriptions that restate obvious page structure
- keep section labels short enough to scan quickly

Good:

- `开放岗位`
- `更多岗位`
- `回到招聘列表`
- `订阅 RSS`

Avoid:

- long archive descriptions above already-visible lists
- headers that repeat what the hero just said
- helper text that explains obvious UI behavior

## Public Interaction Rules

- hover implies action
- focus must stay visible
- navigational cards should usually be single-click targets
- destructive or risky actions are rare on the public site and should not be visually prominent

## Responsive Philosophy

- public pages must work on both desktop and mobile
- on desktop, support scanning through grid density
- on mobile, preserve reading clarity before preserving decorative composition
- collapse layout complexity before reducing text readability

## Anti-Patterns

Do not introduce these patterns into the public site by default:

- giant archive heroes with low informational value
- three layers of title plus eyebrow plus subtitle plus helper copy for simple lists
- repeated metrics that do not change user choice
- CMS-like form language on public-facing content
- decorative tags with little browsing value
- interaction cues that do not lead anywhere
