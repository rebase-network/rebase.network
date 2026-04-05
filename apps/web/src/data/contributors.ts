import type { Contributor, ContributorRole } from '@rebase/types';

export const contributorRoles: ContributorRole[] = [
  {
    slug: 'volunteers',
    name: '志愿者',
    description: '推动活动、内容和社区协调工作的人。',
  },
  {
    slug: 'geekdaily-advisors',
    name: '极客日报智囊团',
    description: '持续提供选题、推荐和行业感知的朋友们。',
  },
];

export const contributors: Contributor[] = [
  {
    slug: 'ruix',
    name: 'Ruix',
    avatarSeed: 'ruix',
    headline: 'community steward',
    bio: '负责社区网站、信息架构和长期内容组织。',
    roleSlugs: ['volunteers'],
    twitterUrl: 'https://x.com/ruix',
    telegram: '@ruix',
  },
  {
    slug: 'cedric',
    name: 'Cedric',
    avatarSeed: 'cedric',
    headline: 'research curator',
    bio: '长期关注 protocol tooling 和 AI infrastructure。',
    roleSlugs: ['geekdaily-advisors'],
    twitterUrl: 'https://x.com/cedric',
  },
  {
    slug: 'harry',
    name: 'Harry',
    avatarSeed: 'harry',
    headline: 'editor and signal hunter',
    bio: '负责跟进市场、研究和日报中的高质量线索。',
    roleSlugs: ['volunteers', 'geekdaily-advisors'],
    wechat: 'harry-rebase',
  },
  {
    slug: 'annie',
    name: 'Annie',
    avatarSeed: 'annie',
    headline: 'community producer',
    bio: '参与活动组织、投稿协调和合作伙伴沟通。',
    roleSlugs: ['volunteers'],
    telegram: '@annie_rebase',
  },
];
