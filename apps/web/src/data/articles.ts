import type { Article } from '@rebase/types';

export const articles: Article[] = [
  {
    slug: 'building-rebase-in-public',
    title: '把 Rebase 做成一个持续更新的社区媒体站点',
    summary: '为什么我们不只想做一个静态官网，而是想把社区日常真正组织成可阅读、可订阅、可回看的公共空间。',
    publishedAt: '2026-04-05T10:00:00.000Z',
    readingTime: '7 min read',
    authors: [{ name: 'Ruix', role: 'Community steward' }],
    tags: ['community', 'product', 'media'],
    coverAccent: 'linear-gradient(135deg, #efc37b 0%, #0f766e 100%)',
    body: `## 重新定义社区站点\n\n传统社区官网往往更像公告栏，而不是一个持续更新的信息场。\n\nRebase 新站希望把 **GeekDaily、文章、活动、招聘、贡献者** 放到同一个阅读流里，让读者能在一次访问中看到社区最近发生了什么。\n\n## 为什么要重做\n\n- 旧结构无法很好承接持续更新的内容\n- GeekDaily 的历史规模已经足够大，需要新的信息架构\n- Who-Is-Hiring 需要比 issue 更稳定的公开落点\n\n## 我们想保留什么\n\n我们并不是想把社区变成一套复杂产品，而是想让内容更容易发现、传播与回看。`,
  },
  {
    slug: 'signal-over-noise',
    title: '社区信息不是越多越好，而是越有组织越好',
    summary: '在高频更新的内容环境里，真正重要的是信息架构，而不是堆更多入口。',
    publishedAt: '2026-04-02T08:30:00.000Z',
    readingTime: '5 min read',
    authors: [{ name: 'Cedric', role: 'Contributor' }],
    tags: ['information architecture', 'editorial'],
    coverAccent: 'linear-gradient(135deg, #f7b267 0%, #f4845f 100%)',
    body: `## Signal over noise\n\n社区运营并不是简单地发布更多内容，而是把内容组织成可以连续阅读的结构。\n\n当一个网站同时承接文章、招聘、活动和日报时，首页应该扮演 **signal desk** 的角色。\n\n## 一个好首页的标准\n\n1. 让新读者在 10 秒内理解 Rebase 是什么\n2. 让老读者快速看到今天的变化\n3. 让运营同学不需要手动维护太多重复内容`,
  },
  {
    slug: 'community-archives-should-stay-readable',
    title: '社区档案不该只存在于 issue 和聊天记录里',
    summary: '当内容积累到一定规模，归档、搜索和订阅就不再是“加分项”，而是基础设施。',
    publishedAt: '2026-03-28T12:00:00.000Z',
    readingTime: '6 min read',
    authors: [{ name: 'Harry', role: 'Editor' }],
    tags: ['archives', 'rss', 'search'],
    coverAccent: 'linear-gradient(135deg, #5cc8ff 0%, #4361ee 100%)',
    body: `## 档案感\n\n很多社区都拥有大量高质量内容，但这些内容往往缺乏统一的入口。\n\nRebase 新站会把历史 GeekDaily、公开文章和招聘信息重新组织成可搜索、可浏览、可订阅的结构。\n\n## 这意味着什么\n\n- URL 需要稳定\n- 搜索需要可用\n- RSS 需要成为标准输出\n- 旧内容也应该被新的访问者看见`,
  },
];
