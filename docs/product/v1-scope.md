# Rebase Community Website V1 Scope

## Product Goal

Build a new Rebase community website and a maintainable Rebase-specific admin workspace in this repository.

V1 should establish a stable public-facing content platform plus a task-oriented internal tool for community staff.

The first release should prioritize:

- clear community positioning
- a community-media presentation style that surfaces ongoing activity
- strong mobile and desktop reading experience
- sustainable content publishing
- scalable handling of GeekDaily history
- an operator-friendly custom admin instead of a generic headless CMS
- room for future expansion without overbuilding V1

## Product Positioning

V1 is:

- a community website
- a content hub
- an operations-friendly publishing platform
- a community-media experience that helps readers discover what is happening inside Rebase
- a custom admin workspace for staff content maintenance

V1 is not:

- a full community member product
- a complex event operations platform
- a social product with accounts, comments, or feeds for readers

## Target Users

- public readers who browse Rebase content
- community operators who maintain content and site configuration
- future contributors who need a clear entry point into the community

## In Scope

### Public Pages

- home page
- about page
- who-is-hiring page
- hiring detail page
- GeekDaily list page
- GeekDaily detail page
- articles list page
- article detail page
- events list page
- event detail page
- contributors page
- global footer content

### Home Page

The home page should surface:

- a concise Rebase introduction
- recent articles
- recent events
- recent jobs
- the latest GeekDaily
- entry points into core community content

### Admin Capabilities

Staff should be able to manage:

- home page content
- about page content
- GeekDaily content
- articles
- events
- jobs
- contributors
- footer content
- media uploads
- staff roles and permissions
- audit visibility for sensitive changes

### Editorial Format

V1 content editing should use:

- structured fields for metadata, taxonomy, and page assembly
- Markdown for long-form body content

This applies to article bodies, About content, event detail content, hiring detail content, and GeekDaily episode body content when needed.

### GeekDaily Search

GeekDaily search is part of V1.

The first version should support search by:

- title
- summary
- tags
- episode number
- date
- recommendation item title

V1 search should optimize for practical discovery, not heavyweight full-text search quality.

The first implementation should use frontend search over a Rebase-owned search payload.

If future needs grow, the project may later integrate a third-party search service or plugin.

### RSS Feeds

RSS is part of V1.

The first version should include:

- a site-wide feed at `/rss.xml`
- a GeekDaily feed at `/geekdaily/rss.xml`
- an articles feed at `/articles/rss.xml`
- an events feed at `/events/rss.xml`
- a hiring feed at `/who-is-hiring/rss.xml`

The site-wide feed should aggregate recent public content from:

- GeekDaily episodes
- articles
- events
- jobs

GeekDaily RSS items should be episode-based rather than item-based.

Hiring RSS items should be job-based and link to public job detail pages.

Each V1 feed should default to the latest 3 published items.

## Out of Scope

The following items are explicitly excluded from V1:

- in-site event registration forms
- event registration data collection and admin review
- public user accounts
- member login
- comments
- likes, favorites, or notifications
- multilingual support
- complex editorial approval workflows
- advanced recommendation systems
- full-site unified search
- email subscription systems
- advanced feed distribution workflows
- member self-service profile editing

## Event Module Boundary

V1 event pages support:

- upcoming events
- past events
- event detail content
- external registration links
- registration instructions

V1 does not support:

- internal event registration forms
- registration management
- attendee exports

## Hiring Module Boundary

V1 hiring pages support:

- a public hiring list page
- public hiring detail pages
- hiring RSS output
- public apply links and hiring metadata

V1 does not support:

- in-site job application forms
- applicant tracking
- recruiter dashboards beyond staff content management

Suggested hiring detail content includes:

- company or team name
- role title
- salary
- remote support
- work mode
- work scope and responsibilities inside the main description
- work location
- contact or application method

## Admin Experience Boundary

V1 admin should support:

- login for staff
- task-oriented list and editor screens
- validation before publish
- media selection and upload
- draft, publish, and archive actions
- role-based access control
- audit visibility for sensitive operations

V1 admin does not need:

- realtime collaborative editing
- multi-step approval workflows
- low-code schema editing
- page-builder-style drag-and-drop composition

## Success Criteria

V1 is successful when:

- the core public pages are implemented
- the site works well on desktop and mobile
- staff can manage the main content types through the custom admin workspace
- GeekDaily history can be browsed and searched reliably
- media assets are managed through a stable storage solution
- the architecture supports long-term operation and expansion
