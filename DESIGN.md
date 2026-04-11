# DESIGN.md

Design guidance for developers building new pages and features in the Rebase website and admin workspace.

This file records the visual and interaction decisions that have been converged in the current implementation.

When adding new UI, follow these rules by default.

## Purpose

- keep the public site visually consistent as a community media website
- keep the admin workspace task-oriented, compact, and operator-friendly
- avoid future pages drifting back into generic CMS or generic marketing-site patterns
- provide a shared baseline for designers, frontend developers, and coding agents

## Product Tone

Rebase is not a corporate brochure site and not a generic SaaS admin.

The product tone should feel like:

- a living developer community
- a media-like public surface for ongoing community activity
- a practical operations workspace for staff

The product tone should not feel like:

- a luxury brand landing page
- a VC portfolio page
- a schema-first headless CMS
- an over-explained dashboard full of helper copy

## Global Principles

### 1. Content first

- pages should help users reach content quickly
- visual structure should support reading, browsing, and publishing
- decorative elements should never block scanning or primary actions

### 2. Compact over spacious

- prefer dense but readable layouts
- avoid large empty regions that do not carry information
- reduce repeated headings, duplicated metadata, and filler descriptions

### 3. One clear job per block

- every panel should have an obvious purpose
- if a block only restates what the page already says, remove or compress it
- if a section title and description do not add decision value, replace them with a lighter toolbar or label

### 4. Interaction should match expectation

- if a card has hover affordance, it should usually be clickable
- if an action looks destructive, it must be visually restrained and require confirmation
- if a filter looks inline, it should behave inline without opening unnecessary secondary layouts

### 5. Preserve module consistency

- new pages should follow the established pattern of their module
- do not redesign a single page in isolation unless the whole module is intentionally being updated
- if a module already has a compact list pattern, continue using it

## Public Site Guidelines

### Public Visual Direction

- visual direction: community media
- atmosphere: warm, editorial, active, human
- style: content-led, not promo-led
- layout: structured, compact, readable

Use:

- soft layered backgrounds
- restrained decorative watermarks or labels
- strong typography hierarchy
- cards and toolbars that support scanning

Avoid:

- oversized marketing claims repeated across multiple sections
- very tall hero areas on archive or detail pages
- glassmorphism for its own sake
- heavy animation or motion that slows reading

### Public Information Density

- homepage can be more expressive than internal list pages
- archive pages should be tighter and more utilitarian
- detail pages should prioritize the content body and immediate metadata
- supporting sections should be compressed when they are secondary

Rule of thumb:

- homepage: expressive
- archive pages: direct
- detail pages: readable and minimal

### Public Page Patterns

#### Homepage

- should introduce Rebase quickly
- should surface current activity
- should feel alive and community-driven
- can use more expressive composition than other pages

#### Archive Pages

Examples:

- GeekDaily list
- Who-Is-Hiring list
- articles list
- events list

Pattern:

- a compact hero with one clear title and one concise summary
- a small number of signal cards if they help orientation
- a thin toolbar before the list if the section only needs a label and one or two actions
- the list itself should dominate the page

Avoid:

- repeating long explanatory copy above every list
- using large section headers when a toolbar is enough
- stacking multiple layers of title, subtitle, description, and helper text for the same list

#### Detail Pages

Pattern:

- concise hero
- immediate access to main body content
- a compact side panel only when it helps action or metadata
- related content sections should be lightweight

Avoid:

- repeating the same metadata in both hero and body
- large "continue reading" or "more items" headers with paragraphs that restate obvious next steps
- burying the body below decorative content

### Public Component Rules

#### Hero

- hero copy should be short and purposeful
- archive heroes should be smaller than homepage heroes
- if the hero already explains the page, do not repeat that explanation directly below it
- signal cards should be compact when used for orientation only

#### Cards

- cards should scan quickly
- cards should emphasize title first, then the most decision-relevant metadata
- cards should not contain low-value tags or repeated metadata unless they help selection
- hover state implies clickability

#### Toolbars

- use a toolbar instead of a heavy section header when the user only needs:
  - section name
  - count
  - one or two lightweight actions

Typical toolbar pattern:

- left: section name plus count
- right: secondary action such as RSS or back-to-list

#### RSS

- RSS is valuable but secondary
- keep RSS visible but low emphasis
- do not let RSS compete with the main reading or browsing action

#### Footer

- footer should be clear and useful, not busy
- use recognizable social icons
- avoid exposing internal technical hostnames unless they are useful to readers

## Admin Workspace Guidelines

### Admin Product Direction

The admin is a community operations workspace.

It is not a generic content model browser.

The admin should feel:

- Chinese-first
- compact
- clear
- operational
- safe for non-technical staff

It should not feel:

- schema-driven
- table-first for every task
- overloaded with side panels, helper copy, and redundant status blocks

### Admin Layout Principles

#### Compact density

- reduce vertical waste aggressively
- forms should keep primary editing areas large
- sidebars should be narrow and only exist when they provide high-value controls

#### Desktop-first

- admin mobile support is not a priority
- optimize for laptop and desktop operators
- avoid spending layout budget on mobile admin compromises

#### Chinese UI by default

- labels, navigation, and primary operations should be Chinese
- keep terminology consistent across modules
- use English only when it is a product name, brand name, or technical term that should stay in English

### Admin Navigation

- navigation should be narrow and efficient
- avoid excessive horizontal padding in the sidebar
- navigation labels should be readable, not tiny
- version information belongs at the lower left under logout

### Admin Lists

- lists should be paginated
- default page size is 20
- search and summary controls should be compact and usually sit on one line
- status filters should prefer inline or header-level patterns over large standalone filter panels
- when a list is empty under current filters, keep table structure visible if possible

### Admin Editors

- the primary content field must stay visually dominant
- metadata should not crowd out the body editor
- remove or hide fields that are low-value in the current workflow
- optional or infrequent structures should move into secondary views when possible

Examples already converged:

- article editing should prioritize title, summary, author, body, and status
- event editing should prioritize core event content over SEO-style fields
- GeekDaily editing should prioritize episode, entries, and generated output
- contributor role management can live in a separate view from contributor maintenance

### Admin Safety Rules

- destructive actions must be visually restrained
- destructive actions must not occupy full-width layouts by default
- destructive actions should require confirmation
- if two workflows are easily confused, separate them with tabs or explicit modes

Examples:

- upload vs edit in media
- create account vs manage staff

## Interaction and Accessibility Rules

- keyboard focus must remain visible
- clickable cards and buttons should have matching hover and focus behavior
- labels should stay close to inputs
- avoid placing critical meaning in color alone
- support desktop and mobile for the public site
- support desktop reliability first for the admin

## Content and Copy Rules

- keep copy concise
- avoid placeholder-sounding helper text
- do not explain obvious UI states unless the workflow is unusual
- prefer practical action language over product-marketing language

Good:

- `开放岗位`
- `回到招聘列表`
- `订阅 RSS`

Avoid:

- long paragraphs explaining obvious archive behavior
- multiple stacked lines that all mean "this is the list"

## Implementation Rules for Developers

Before adding a new page or major block, check:

- does this page belong to homepage, archive, detail, or admin workflow patterns
- can an existing pattern be reused instead of inventing a new one
- is there duplicated metadata or duplicated explanation that can be removed
- does hover imply clickability
- is the main action visually obvious
- does the main content area get enough space

## Validation Expectations

For meaningful UI changes:

- inspect the page in a browser
- verify desktop layout first
- verify mobile layout for the public site
- use Playwright or equivalent checks when interaction or layout regressions are possible

Check especially:

- pagination and filters
- card click behavior
- overflow and wrapping
- sticky side panels
- editor layout density
- empty states

## When To Intentionally Break The Pattern

Break existing patterns only when:

- the whole module is being redesigned together
- a repeated user pain point has been identified
- the current pattern blocks a critical workflow

If you do break a pattern:

- update this file
- explain the new default in the relevant PR or commit
