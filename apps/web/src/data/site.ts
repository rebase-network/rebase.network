import type { AboutSection, HomeSignal, HomeStat, SiteSettings } from '@rebase/types';

export const siteSettings: SiteSettings = {
  name: 'Rebase',
  tagline: 'A community media network for builders, researchers, and curious operators.',
  description:
    'Rebase is a community platform for GeekDaily, community writing, events, hiring signals, and contributor stories.',
  primaryDomain: 'https://rebase.network',
  secondaryDomain: 'https://rebase.community',
  mediaDomain: 'https://media.rebase.network',
  navigation: [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Who-Is-Hiring', href: '/who-is-hiring' },
    { label: 'GeekDaily', href: '/geekdaily' },
    { label: 'Articles', href: '/articles' },
    { label: 'Events', href: '/events' },
    { label: 'Contributors', href: '/contributors' },
  ],
  socialLinks: [
    { label: 'Twitter', href: 'https://x.com/rebase_network', handle: '@rebase_network' },
    { label: 'Telegram', href: 'https://t.me/rebase_network' },
    { label: 'Github', href: 'https://github.com/rebase-network' },
  ],
  footerGroups: [
    {
      title: 'Social',
      slug: 'social',
      links: [
        { label: 'Twitter', href: 'https://x.com/rebase_network' },
        { label: 'Telegram', href: 'https://t.me/rebase_network' },
        { label: 'Github', href: 'https://github.com/rebase-network' },
      ],
    },
    {
      title: 'Supported Projects',
      slug: 'supported-projects',
      links: [
        { label: 'GeekDaily', href: '/geekdaily' },
        { label: 'Who-Is-Hiring', href: '/who-is-hiring' },
        { label: 'Community Events', href: '/events' },
      ],
    },
    {
      title: 'Media Resources',
      slug: 'media-resources',
      links: [
        { label: 'Articles', href: '/articles' },
        { label: 'About Rebase', href: '/about' },
        { label: 'RSS', href: '/rss.xml' },
      ],
    },
    {
      title: 'Friendly Links',
      slug: 'friendly-links',
      links: [
        { label: 'TGO Network', href: 'https://tgo.network/' },
        { label: 'Rebase Github', href: 'https://github.com/rebase-network' },
      ],
    },
  ],
  copyright: 'Copyright © Rebase Community. All rights reserved.',
};

export const homeStats: HomeStat[] = [
  { value: '1809+', label: 'GeekDaily episodes mapped for migration' },
  { value: '5k+', label: 'Historic GeekDaily items in the archive' },
  { value: '5', label: 'Public RSS feeds in the first release' },
];

export const homeSignals: HomeSignal[] = [
  {
    eyebrow: 'latest daily',
    title: '极客日报每天持续发声，像社区的现场频道。',
    summary: '把最新的 builder 工具、研究论文、协议动向与社区洞察收束到同一个入口。',
    href: '/geekdaily',
    meta: 'episode-led archive',
  },
  {
    eyebrow: 'hiring board',
    title: 'Who-Is-Hiring 不只是职位列表，而是社区机会的雷达。',
    summary: '让求职者快速读懂岗位、团队、投递方式与工作模式。',
    href: '/who-is-hiring',
    meta: 'job detail + rss',
  },
  {
    eyebrow: 'community dispatch',
    title: '文章、活动、贡献者一起构成 Rebase 的公共记忆。',
    summary: '我们希望读者一进入首页，就知道社区最近在做什么、讨论什么、招什么人。',
    href: '/about',
    meta: 'media-style homepage',
  },
];

export const aboutIntro = {
  title: 'Rebase 是一个围绕 builder、community operator 和研究者展开的社区媒体网络。',
  summary:
    '我们把社区里的文章、GeekDaily、活动、招聘和贡献者信息放在同一个公共空间里，让信息流动更连续，也让参与路径更清晰。',
};

export const aboutSections: AboutSection[] = [
  {
    title: 'Why Rebase',
    body:
      '当社区信息散落在 issue、表单、微信群、社交媒体和一篇篇临时帖子里，很多有价值的内容很容易被时间冲淡。Rebase 想把这些信号整理成更容易浏览、检索和订阅的公共媒介。',
  },
  {
    title: 'What we organize',
    body:
      '我们会持续组织 GeekDaily、社区文章、Who-Is-Hiring、线下或线上活动，以及贡献者故事。它们不应该是彼此孤立的栏目，而应该共同构成社区的长期记录。',
  },
  {
    title: 'How people participate',
    body:
      '你可以投稿文章、发布招聘、参与活动、加入志愿协作，或者成为 GeekDaily 智囊团的一部分。这个网站会尽量把每一种参与方式都表达得更直接。',
  },
];
