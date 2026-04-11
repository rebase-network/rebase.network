# DESIGN.md

This repository uses a split design-document structure.

The root `DESIGN.md` is an index, not the full design system.

Use the app-specific files below when building or reviewing UI.

## Structure

### Public Website

- `apps/web/design_principles.md`
  - public-site design intent
  - community-media tone
  - content hierarchy
  - interaction and copy principles
- `apps/web/DESIGN.md`
  - hard visual spec for the public site
  - colors, typography, spacing, components, responsive rules, and agent prompts

### Admin Workspace

- `apps/admin/design_principles.md`
  - admin UX intent
  - operator workflow priorities
  - density, safety, and information hierarchy rules
- `apps/admin/DESIGN.md`
  - hard visual spec for the admin workspace
  - colors, typography, spacing, components, responsive rules, and agent prompts

## How To Use These Files

- start with the relevant `design_principles.md` to understand the product and interaction intent
- then use the matching app `DESIGN.md` for exact visual and component decisions
- if a new design direction becomes the default, update both the principles file and the hard-spec file for that app

## Update Rules

- do not mix public-site rules into admin files, or admin rules into public-site files
- prefer updating app-local files instead of expanding this index
- if a rule is only true for one surface, keep it in that surface's documents
- if a component changes in implementation and the change becomes the new standard, update the matching app `DESIGN.md`

## Related Files

- `README.md` for the project-wide documentation index
- `AGENTS.md` for repository workflow rules
- `example.md` as a local reference example for DESIGN.md structure and depth
