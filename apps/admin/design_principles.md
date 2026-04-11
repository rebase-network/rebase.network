# Admin Design Principles

Design principles for the Rebase admin workspace in `apps/admin`.

This file explains how the admin should feel and how operators should move through it.
It does not replace `apps/admin/DESIGN.md`, which holds the hard visual specification.

## Product Intent

The admin is a community operations workspace.

It should help staff:

- publish and edit content efficiently
- understand status quickly
- avoid mistakes in high-frequency workflows
- maintain community data without thinking in raw schema terms

It should not feel like:

- a generic headless CMS
- a database browser
- a visual builder
- a dashboard full of decorative emptiness

## Core Feeling

The admin should feel:

- compact
- clear
- controlled
- Chinese-first
- desktop-first
- operational rather than promotional

The admin should not feel:

- sparse in a way that wastes editing space
- schema-driven
- overloaded with helper copy
- split into too many side panels competing for attention

## Primary Principles

### Operator Efficiency First

- the primary task on each page should be obvious immediately
- high-frequency actions should sit close to the content they affect
- content lists should support scanning, filtering, and pagination without ceremony

### Compact, Not Claustrophobic

- reduce vertical waste aggressively
- preserve enough whitespace for readability and error prevention
- default toward denser layouts than the public site

### Primary Editor Area Must Win

- on editor pages, the main editing surface must remain visually dominant
- secondary metadata should not crowd out the body editor
- optional or rare settings should move into secondary blocks, tabs, or compact panels

### Task-Oriented Over Schema-Oriented

- think in jobs, GeekDaily, articles, contributors, assets, and staff tasks
- do not expose raw collections or raw relational thinking unless it truly helps operators
- labels should be operational, not developer-centric

### Inline When Possible

- filters should prefer inline or header-level presentation
- destructive actions should stay restrained and localized
- related controls should share one line where practical

## Admin Page-Type Guidance

### List Pages

Rules:

- pagination is mandatory for long lists
- search, counts, and filters should be compressed into a thin header area
- table headers can carry lightweight filters when it improves density
- if the list is empty under filters, preserve orientation and recovery paths

### Editor Pages

Rules:

- title, status, and main body should surface early
- avoid long stacks of low-value metadata before the main editor
- side information is acceptable only when it meaningfully supports publishing decisions
- destructive actions must never dominate the layout

### Settings / Utility Pages

Rules:

- group related settings into small panels
- avoid giant full-width destructive buttons
- use tabs or segmented modes when two workflows are easy to confuse

## Copy Guidance

- default to concise Chinese labels
- remove helper text that states the obvious
- do not write CMS-flavored explanation unless the workflow is unusual
- prefer action wording over descriptive wording

Good:

- `开放岗位`
- `状态`
- `回到招聘列表`
- `新增工作人员`
- `上传文件`

Avoid:

- long paragraphs above standard tables
- duplicate explanatory cards that repeat the page title
- technical jargon that operators do not need

## Interaction Rules

- hover states must reflect actual affordance
- keyboard focus must remain visible
- destructive actions must be visually restrained and confirmed
- tabs are appropriate when two nearby workflows are easy to confuse
- list pages should stay readable without needing side explanations

## Responsive Philosophy

- admin is desktop-first
- mobile admin support is not a priority in v1
- optimize for laptop and desktop editing comfort
- do not sacrifice desktop efficiency to maintain complex mobile admin layouts

## Anti-Patterns

Do not introduce these patterns into the admin by default:

- giant sidebar widths with large empty regions
- large hero-like headers on admin pages
- wide empty right rails with low-value metadata
- full-width destructive buttons inside dense forms
- filters split into separate giant blocks when inline filters will do
- list pages that require excessive scrolling before reaching the actual table
