const statusChoices = {
  choices: [
    { text: 'draft', value: 'draft' },
    { text: 'published', value: 'published' },
    { text: 'archived', value: 'archived' },
  ],
};

const eventStatusChoices = {
  choices: [
    { text: 'upcoming', value: 'upcoming' },
    { text: 'past', value: 'past' },
  ],
};

function uuidField({ hidden = true } = {}) {
  return {
    field: 'id',
    column: 'id uuid primary key default gen_random_uuid()',
    interface: 'input',
    special: 'uuid',
    options: { iconRight: 'vpn_key' },
    readonly: true,
    hidden,
    width: 'half',
    searchable: true,
  };
}

function singletonIdField() {
  return {
    field: 'id',
    column: 'id integer primary key default 1',
    interface: 'input',
    readonly: true,
    hidden: true,
    width: 'half',
    searchable: false,
  };
}

function statusField() {
  return {
    field: 'status',
    column: "status varchar(20) not null default 'draft'",
    interface: 'select-dropdown',
    options: statusChoices,
    required: true,
    width: 'half',
    searchable: true,
  };
}

function eventStatusField() {
  return {
    field: 'event_status',
    column: "event_status varchar(20) not null default 'upcoming'",
    interface: 'select-dropdown',
    options: eventStatusChoices,
    required: true,
    width: 'half',
    searchable: true,
  };
}

function sortField() {
  return {
    field: 'sort',
    column: 'sort integer',
    interface: 'input',
    readonly: true,
    hidden: true,
    width: 'half',
    searchable: false,
  };
}

function dateCreatedField() {
  return {
    field: 'date_created',
    column: 'date_created timestamptz',
    interface: 'datetime',
    special: 'date-created',
    readonly: true,
    hidden: true,
    width: 'half',
    searchable: false,
  };
}

function dateUpdatedField() {
  return {
    field: 'date_updated',
    column: 'date_updated timestamptz',
    interface: 'datetime',
    special: 'date-updated',
    readonly: true,
    hidden: true,
    width: 'half',
    searchable: false,
  };
}

function inputField(field, column, overrides = {}) {
  return {
    field,
    column,
    interface: 'input',
    width: 'full',
    searchable: true,
    ...overrides,
  };
}

function textField(field, column, overrides = {}) {
  return {
    field,
    column,
    interface: 'input-multiline',
    width: 'full',
    searchable: true,
    ...overrides,
  };
}

function jsonField(field, column, overrides = {}) {
  return {
    field,
    column,
    interface: 'input-code',
    options: { language: 'json', lineWrapping: true },
    width: 'full',
    searchable: false,
    ...overrides,
  };
}

function booleanField(field, column, overrides = {}) {
  return {
    field,
    column,
    interface: 'boolean',
    width: 'half',
    searchable: true,
    ...overrides,
  };
}

function datetimeField(field, column, overrides = {}) {
  return {
    field,
    column,
    interface: 'datetime',
    width: 'half',
    searchable: true,
    ...overrides,
  };
}

export const directusPolicy = {
  policyId: 'fcaec745-c67e-46aa-84d4-f8796ad89d5d',
  userId: '1c6dfb41-f23d-4034-b4b3-fc569e460ef8',
  accessId: '5546e593-7075-47c6-9d18-a06849439248',
  userEmail: 'website@rebase.network',
};

export const collections = [
  {
    name: 'site_settings',
    icon: 'settings',
    note: 'Global site configuration, homepage hero, footer links, and social metadata.',
    singleton: true,
    accountability: 'all',
    fields: [
      singletonIdField(),
      inputField('site_name', 'site_name varchar(120) not null', { required: true, width: 'half' }),
      inputField('tagline', 'tagline varchar(255) not null', { required: true, width: 'half' }),
      textField('description', 'description text not null', { required: true }),
      inputField('primary_domain', 'primary_domain varchar(255) not null', { required: true, width: 'half' }),
      inputField('secondary_domain', 'secondary_domain varchar(255) not null', { required: true, width: 'half' }),
      inputField('media_domain', 'media_domain varchar(255)', { width: 'half' }),
      textField('hero_title', 'hero_title text not null', { required: true }),
      textField('hero_summary', 'hero_summary text not null', { required: true }),
      inputField('hero_primary_cta_label', 'hero_primary_cta_label varchar(120) not null', { required: true, width: 'half' }),
      inputField('hero_primary_cta_url', 'hero_primary_cta_url varchar(255) not null', { required: true, width: 'half' }),
      inputField('hero_secondary_cta_label', 'hero_secondary_cta_label varchar(120) not null', { required: true, width: 'half' }),
      inputField('hero_secondary_cta_url', 'hero_secondary_cta_url varchar(255) not null', { required: true, width: 'half' }),
      jsonField('social_links', "social_links jsonb not null default '[]'::jsonb"),
      jsonField('footer_groups', "footer_groups jsonb not null default '[]'::jsonb"),
      jsonField('home_stats', "home_stats jsonb not null default '[]'::jsonb"),
      textField('copyright_text', 'copyright_text text not null', { required: true }),
      dateUpdatedField(),
    ],
    checks: ['constraint site_settings_singleton check (id = 1)'],
  },
  {
    name: 'about_page',
    icon: 'info',
    note: 'About page long-form introduction and structured sections.',
    singleton: true,
    accountability: 'all',
    fields: [
      singletonIdField(),
      textField('title', 'title text not null', { required: true }),
      textField('summary', 'summary text not null', { required: true }),
      jsonField('sections', "sections jsonb not null default '[]'::jsonb"),
      dateUpdatedField(),
    ],
    checks: ['constraint about_page_singleton check (id = 1)'],
  },
  {
    name: 'articles',
    icon: 'article',
    note: 'Community writing published by Rebase.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists articles_slug_key on public.articles (slug)',
      'create index if not exists articles_status_published_at_idx on public.articles (status, published_at desc)',
    ],
    fields: [
      uuidField(),
      statusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('slug', 'slug varchar(255) not null', { required: true }),
      inputField('title', 'title varchar(255) not null', { required: true }),
      textField('summary', 'summary text not null', { required: true }),
      textField('body', 'body text not null', { required: true }),
      datetimeField('published_at', 'published_at timestamptz', { width: 'half' }),
      inputField('reading_time', 'reading_time varchar(50)', { width: 'half' }),
      jsonField('authors', "authors jsonb not null default '[]'::jsonb"),
      jsonField('tags', "tags jsonb not null default '[]'::jsonb"),
      inputField('cover_image_url', 'cover_image_url text', { width: 'full' }),
      inputField('cover_accent', 'cover_accent varchar(255)', { width: 'full' }),
    ],
  },
  {
    name: 'jobs',
    icon: 'work',
    note: 'Community hiring opportunities.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists jobs_slug_key on public.jobs (slug)',
      'create index if not exists jobs_status_published_at_idx on public.jobs (status, published_at desc)',
    ],
    fields: [
      uuidField(),
      statusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('slug', 'slug varchar(255) not null', { required: true }),
      inputField('company_name', 'company_name varchar(255) not null', { required: true }),
      inputField('role_title', 'role_title varchar(255) not null', { required: true }),
      inputField('salary', 'salary varchar(255)', { width: 'half' }),
      booleanField('supports_remote', 'supports_remote boolean not null default false'),
      inputField('work_mode', 'work_mode varchar(120)', { width: 'half' }),
      inputField('location', 'location varchar(255)', { width: 'half' }),
      textField('summary', 'summary text not null', { required: true }),
      textField('description', 'description text not null', { required: true }),
      jsonField('responsibilities', "responsibilities jsonb not null default '[]'::jsonb"),
      inputField('apply_url', 'apply_url text', { width: 'full' }),
      textField('apply_note', 'apply_note text'),
      inputField('contact_label', 'contact_label varchar(120)', { width: 'half' }),
      inputField('contact_value', 'contact_value varchar(255)', { width: 'half' }),
      datetimeField('published_at', 'published_at timestamptz'),
      datetimeField('expires_at', 'expires_at timestamptz'),
      jsonField('tags', "tags jsonb not null default '[]'::jsonb"),
    ],
  },
  {
    name: 'events',
    icon: 'event',
    note: 'Community events with public detail pages and external registration links.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists events_slug_key on public.events (slug)',
      'create index if not exists events_status_start_at_idx on public.events (status, start_at desc)',
    ],
    fields: [
      uuidField(),
      statusField(),
      eventStatusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('slug', 'slug varchar(255) not null', { required: true }),
      inputField('title', 'title varchar(255) not null', { required: true }),
      textField('summary', 'summary text not null', { required: true }),
      textField('content', 'content text not null', { required: true }),
      datetimeField('start_at', 'start_at timestamptz not null', { required: true }),
      datetimeField('end_at', 'end_at timestamptz not null', { required: true }),
      inputField('location', 'location varchar(255)', { width: 'half' }),
      inputField('venue', 'venue varchar(255)', { width: 'half' }),
      inputField('city', 'city varchar(120)', { width: 'half' }),
      inputField('registration_url', 'registration_url text', { width: 'full' }),
      textField('registration_note', 'registration_note text'),
      inputField('cover_image_url', 'cover_image_url text', { width: 'full' }),
      jsonField('tags', "tags jsonb not null default '[]'::jsonb"),
    ],
  },
  {
    name: 'contributor_roles',
    icon: 'badge',
    note: 'Ordered contributor role groups such as volunteers and GeekDaily advisors.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists contributor_roles_slug_key on public.contributor_roles (slug)',
      'create index if not exists contributor_roles_status_sort_idx on public.contributor_roles (status, sort asc nulls last)',
    ],
    fields: [
      uuidField(),
      statusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('slug', 'slug varchar(255) not null', { required: true }),
      inputField('name', 'name varchar(255) not null', { required: true }),
      textField('description', 'description text not null', { required: true }),
    ],
  },
  {
    name: 'contributors',
    icon: 'groups',
    note: 'Public contributor profiles grouped by role slugs.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists contributors_slug_key on public.contributors (slug)',
      'create index if not exists contributors_status_sort_idx on public.contributors (status, sort asc nulls last)',
    ],
    fields: [
      uuidField(),
      statusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('slug', 'slug varchar(255) not null', { required: true }),
      inputField('name', 'name varchar(255) not null', { required: true }),
      inputField('avatar_url', 'avatar_url text', { width: 'full' }),
      inputField('avatar_seed', 'avatar_seed varchar(120)', { width: 'half' }),
      inputField('headline', 'headline varchar(255)', { width: 'full' }),
      textField('bio', 'bio text not null', { required: true }),
      jsonField('role_slugs', "role_slugs jsonb not null default '[]'::jsonb"),
      inputField('twitter_url', 'twitter_url text', { width: 'half' }),
      inputField('wechat', 'wechat varchar(120)', { width: 'half' }),
      inputField('telegram', 'telegram varchar(120)', { width: 'half' }),
    ],
  },
  {
    name: 'geekdaily_episodes',
    icon: 'newspaper',
    note: 'Episode-based GeekDaily archive and search source.',
    accountability: 'all',
    archiveField: 'status',
    archiveValue: 'archived',
    unarchiveValue: 'draft',
    sortField: 'sort',
    indexes: [
      'create unique index if not exists geekdaily_episodes_slug_key on public.geekdaily_episodes (slug)',
      'create unique index if not exists geekdaily_episodes_episode_number_key on public.geekdaily_episodes (episode_number)',
      'create index if not exists geekdaily_episodes_status_published_at_idx on public.geekdaily_episodes (status, published_at desc)',
    ],
    fields: [
      uuidField(),
      statusField(),
      sortField(),
      dateCreatedField(),
      dateUpdatedField(),
      inputField('episode_number', 'episode_number integer not null', { required: true, width: 'half' }),
      inputField('slug', 'slug varchar(255) not null', { required: true, width: 'half' }),
      inputField('title', 'title varchar(255) not null', { required: true }),
      textField('summary', 'summary text not null', { required: true }),
      textField('body', 'body text not null', { required: true }),
      datetimeField('published_at', 'published_at timestamptz not null', { required: true }),
      jsonField('tags', "tags jsonb not null default '[]'::jsonb"),
      jsonField('items', "items jsonb not null default '[]'::jsonb"),
    ],
  },
];
