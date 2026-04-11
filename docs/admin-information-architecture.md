# Admin Information Architecture

## Goal

Design the Rebase admin around staff tasks rather than database tables.

Every module should answer a real operator question such as:

- what do we need to publish today
- which GeekDaily episode is being edited
- which jobs are currently live
- which contributors belong to which role

## Primary Users

- super administrators
- content editors
- GeekDaily editors
- hiring editors
- event editors
- community editors
- auditors

## Top-Level Navigation

Recommended top-level modules:

- Dashboard
- GeekDaily
- Who-Is-Hiring
- Articles
- Events
- Contributors
- Pages and Navigation
- Media Library
- Staff and Permissions
- Audit Logs

## Dashboard

Purpose:

- show what needs attention today
- expose recent changes and publishing health

Recommended widgets:

- draft counts by content type
- latest published GeekDaily, article, job, and event
- stale drafts that have not been updated recently
- content missing required fields
- system health summary
- quick actions for new episode, new job, new article, and new event

## GeekDaily Module

Purpose:

- make daily episode authoring fast and hard to misuse

Views:

- episode list
- new episode editor
- episode detail and preview
- archive import tools

List needs:

- filter by episode number, date, status, and keyword
- clearly show published vs draft
- quick links to preview and edit

Editor needs:

- episode number
- title with default `极客日报#{episode-number}`
- summary
- intro/body field
- published date
- tags
- ordered list of recommendation items

Episode item editor needs:

- item title
- recommender name
- source URL
- summary
- sort order

Operator affordances:

- duplicate last episode structure
- validate unique episode number before publish
- show final public URL
- markdown preview for intro/body
- import historical data from CSV-generated SQL or later import tools

## Who-Is-Hiring Module

Purpose:

- help staff publish readable, structured jobs instead of dumping raw text

Views:

- job list
- job editor
- archived jobs view

List needs:

- filter by status, location, work mode, remote support, and expiry
- quick visibility into whether a job is still live

Editor needs:

- company or team name
- role title
- slug
- salary
- remote support flag
- work mode
- location
- summary
- full description
- apply URL
- alternate contact label/value
- expiry date
- status

Validation affordances:

- require at least one of apply URL or alternate contact
- warn when a published job is expired
- show final public detail URL and feed presence expectations

## Articles Module

Purpose:

- support longer-form Rebase publishing with clean metadata and preview

Views:

- article list
- article editor
- preview link

List needs:

- filter by status, author, tag, and keyword
- show publish time, updated time, and slug

Editor needs:

- title
- slug
- summary
- body in Markdown
- authors
- tags
- cover image
- SEO title and description
- status

## Events Module

Purpose:

- manage public event listings and detail pages cleanly

Views:

- current events
- past events
- event editor

List needs:

- filter by status, date range, and city
- clear visual distinction between upcoming and past

Editor needs:

- title
- slug
- start time
- end time
- city
- location
- venue
- summary
- body in Markdown
- cover image
- registration mode
- external registration URL
- registration note
- status

Validation affordances:

- start time must be before end time
- external registration mode requires a URL
- event URL preview should include the date prefix

## Contributors Module

Purpose:

- manage people and role groupings without turning contributor maintenance into freeform text entry

Views:

- contributor list
- contributor editor
- contributor roles

Contributor editor needs:

- name
- slug
- avatar
- headline
- bio
- one or more roles
- social links such as Twitter, WeChat, Telegram
- sort order
- status

Role editor needs:

- role name
- role slug
- description
- sort order

## Pages and Navigation Module

Purpose:

- maintain singleton pages and global site settings with friendly section-based forms

Subsections:

- Home
- About
- Footer
- Social Links

Home editor should be organized as sections, not raw JSON:

- hero
- current signals
- home stats
- feed callout

About editor should support:

- page title
- page summary
- ordered body sections

Footer editor should support:

- social links
- supported projects
- media resources
- friendly links
- copyright

## Media Library Module

Purpose:

- centralize reusable media selection and metadata maintenance

Views:

- asset list
- upload flow
- asset detail drawer or panel

Recommended fields:

- filename
- mime type
- byte size
- asset purpose
- alt text
- visibility
- created time
- upload owner
- usage references later if needed

## Staff and Permissions Module

Purpose:

- control who can access the admin and what they can do

Views:

- staff accounts
- roles
- permission matrix summary

Staff needs:

- invite or create staff user
- assign one or more roles
- suspend or disable access
- leave notes when needed

Role needs:

- role code
- name
- description
- bound permissions
- system-role protection for critical roles

## Audit Logs Module

Purpose:

- make operational changes visible and reviewable

List needs:

- actor
- action
- target type
- target id
- timestamp
- request id if available

Filtering should support:

- actor
- module
- action type
- time range

## Shared UX Rules

Across all modules:

- keep labels in staff-friendly language
- hide raw schema details when they do not help the task
- make publish state obvious
- make validation messages specific and actionable
- keep preview links near the save and publish controls
- prefer dedicated repeated-item editors over raw JSON textareas
- preserve history through archive rather than hard delete

## First Release Workflow Goals

A staff member should be able to do each of the following without touching the database:

- publish a new GeekDaily episode
- post a new job and later archive it
- publish an article with a cover image
- publish an event with an external registration link
- add a contributor and assign one or more roles
- update the homepage and footer
- upload and reuse media
