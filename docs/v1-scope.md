# Rebase Community Website V1 Scope

## Product Goal

Build a new Rebase community website in this repository.

V1 should establish a stable public-facing content platform with a maintainable admin workflow.

The first release should prioritize:

- clear community positioning
- strong mobile and desktop reading experience
- sustainable content publishing
- scalable handling of GeekDaily history
- room for future expansion without overbuilding V1

## Product Positioning

V1 is:

- a community website
- a content hub
- an operations-friendly publishing platform

V1 is not:

- a full community member product
- a complex event operations platform
- a custom-built CMS

## Target Users

- public readers who browse Rebase content
- community operators who maintain content and site configuration
- future contributors who need a clear entry point into the community

## In Scope

### Public Pages

- home page
- about page
- who-is-hiring page
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

Admins should be able to manage:

- home page content
- about page content
- GeekDaily content
- articles
- events
- jobs
- contributors
- footer content
- media uploads

### GeekDaily Search

GeekDaily search is part of V1.

The first version should support search by:

- title
- summary
- tags
- episode number
- date

V1 search should optimize for practical discovery, not heavyweight full-text search quality.

### RSS Feeds

RSS is part of V1.

The first version should include:

- a site-wide feed at `/rss.xml`
- a GeekDaily feed at `/geekdaily/rss.xml`
- an articles feed at `/articles/rss.xml`
- an events feed at `/events/rss.xml`

The site-wide feed should aggregate recent public content from:

- GeekDaily episodes
- articles
- events

GeekDaily RSS items should be episode-based rather than item-based.

## Out of Scope

The following items are explicitly excluded from V1:

- in-site event registration forms
- event registration data collection and admin review
- public user accounts
- member login
- comments
- likes, favorites, or notifications
- multilingual support
- custom-built admin dashboard
- complex editorial approval workflows
- advanced recommendation systems
- full-site unified search
- email subscription systems
- advanced feed distribution workflows

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

## Success Criteria

V1 is successful when:

- the core public pages are implemented
- the site works well on desktop and mobile
- admins can manage the main content types through the CMS
- GeekDaily history can be browsed and searched reliably
- media assets are managed through a stable storage solution
- the architecture supports long-term operation and expansion
