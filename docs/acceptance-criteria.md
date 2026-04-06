# Acceptance Criteria

## Purpose

This document defines how Rebase website work should be reviewed and accepted during development.

Acceptance should not rely on a single visual pass.

Each feature batch should be checked from four perspectives:

- content model correctness
- public page behavior
- admin workspace and operations workflow
- release readiness

## Acceptance Levels

### Level 1: Content Model Acceptance

Use this level to confirm that the data shape supports real editorial work.

Questions to verify:

- does the data model match the intended public page structure
- are required fields present
- are field names clear and stable
- are status values consistent
- are media fields correctly separated from code assets
- do slug rules and URL rules support long-term stability

This level is complete only when the data model is strong enough to hold real content rather than placeholder assumptions.

### Level 2: Page Presentation Acceptance

Use this level to confirm that public pages render correctly with realistic content.

This level must include actual browser-based review.

Questions to verify:

- does the page show the correct content
- does the layout work on desktop and mobile
- do long titles, empty sections, and missing media degrade gracefully
- are links and calls to action understandable
- is the page hierarchy easy to scan

### Level 3: Operations Workflow Acceptance

Use this level to confirm that operators can maintain the site through the Rebase admin workspace.

Questions to verify:

- can staff log in
- can staff create, edit, publish, archive, and update content
- do published changes appear on the public site
- do unpublished or archived changes behave correctly
- do uploaded images appear correctly on the public site

### Level 4: Release Acceptance

Use this level before launch or before a significant release.

Questions to verify:

- do critical routes respond correctly
- do feeds render correctly
- do metadata and canonical URLs look right
- does the site handle the agreed domain strategy
- is the site acceptable on desktop and mobile

## Module Criteria

### Home Page

The home page is accepted when:

- the Rebase introduction is visible and readable
- recent articles are shown
- recent events are shown
- recent jobs are shown
- the latest GeekDaily is shown
- section ordering makes sense on desktop and mobile
- empty states do not break the layout

### About Page

The About page is accepted when:

- the core Rebase description is present
- the page supports long-form content cleanly
- typography remains readable on mobile
- metadata can be configured through the admin workspace

### Who-Is-Hiring List Page

The hiring list page is accepted when:

- jobs render from published admin data
- active jobs are clearly readable and scannable
- expired or archived jobs are not incorrectly shown as active
- filtering or search behavior works if implemented in the current batch
- the page links to public job detail pages

### Hiring Detail Page

The hiring detail page is accepted when:

- the page is available at `/who-is-hiring/{slug}`
- the title, company, location, work mode, and description render correctly
- the apply link is visible and functional
- the page remains readable even when some optional metadata is absent
- SEO metadata and social metadata can be populated

### GeekDaily List Page

The GeekDaily list page is accepted when:

- episodes render as episode-level records rather than item-level rows
- each episode links to `/geekdaily/geekdaily-{episode-number}`
- pagination or list chunking works if included in the batch
- the search entry point is visible and usable
- the layout remains readable with realistic episode counts

### GeekDaily Detail Page

The GeekDaily detail page is accepted when:

- the route matches the `geekdaily-{episode-number}` convention
- the episode metadata is shown correctly
- all items in the episode are rendered in the correct order
- source links work
- long summaries do not break the layout
- mobile reading remains comfortable

### GeekDaily Search

GeekDaily search is accepted when:

- users can search by episode number, title, summary, tags, or date
- result quality is practical for content discovery
- the UI clearly distinguishes empty results from loading or idle states
- result items link to the correct episode pages
- mobile search interaction is usable

### Articles List Page

The articles list page is accepted when:

- published articles appear in the correct order
- cards or rows display title, summary, date, and cover information correctly
- each item links to the matching detail page
- the page handles missing images gracefully

### Article Detail Page

The article detail page is accepted when:

- the article URL matches `/articles/{slug}`
- title, body, author information, and cover image render correctly
- rich content remains readable on desktop and mobile
- metadata can be configured through the admin workspace

### Events List Page

The events list page is accepted when:

- upcoming and past events are clearly distinguished
- events appear in the correct date order
- each event links to the matching detail page
- missing optional fields do not break the page

### Event Detail Page

The event detail page is accepted when:

- the URL matches `/events/{yyyy-mm-dd}-{slug}`
- date, time, location, and content render correctly
- external registration links or registration notes are clearly visible
- the page remains useful without an in-site registration form

### Contributors Page

The contributors page is accepted when:

- contributors are grouped by role
- the intended role ordering is respected
- contributor avatars, names, and bios render correctly
- the page handles contributors with partial profile information

### Footer

The footer is accepted when:

- social links are present
- supported projects are present
- media resources are present
- friendly links are present
- copyright text is present
- the layout remains readable on mobile

### RSS Feeds

RSS output is accepted when:

- `/rss.xml` is valid and returns recent public content
- `/geekdaily/rss.xml` returns episode-level entries
- `/articles/rss.xml` returns article entries
- `/events/rss.xml` returns event entries
- `/who-is-hiring/rss.xml` returns hiring entries
- every feed item has a stable title, link, description, and publication date
- hiring feed items point to public hiring detail pages

## Admin Workflow Criteria

The admin workflow is accepted when staff can complete the following flows successfully:

- create and publish an article
- create and publish a GeekDaily episode with multiple items
- create and publish a job entry
- create and publish an event
- create and publish a contributor
- update footer links
- upload media and reuse it in public content

## Release Gate

A feature batch is ready to merge or release when:

- the relevant data model is stable
- the relevant public pages pass browser review
- the related automated checks pass
- the admin workflow has been validated for the affected feature
- unresolved issues are either fixed or explicitly accepted
