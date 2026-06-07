import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildGeekDailyBodyMarkdown, buildGeekDailySummary, getGeekDailyEpisodeSlug } from '@rebase/shared';

export interface ImportedGeekDailyItem {
  title: string;
  authorName: string;
  sourceUrl: string;
  summary: string;
}

export interface ImportedGeekDailyEpisode {
  episodeNumber: number;
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  publishedAt: string;
  editors: string[];
  tags: string[];
  items: ImportedGeekDailyItem[];
}

const baselineGeekDailyTopics = [
  {
    episodeNumber: 1915,
    publishedAt: '2026-04-21T08:00:00.000Z',
    editors: ['Cedric', 'Harry'],
    tags: ['ai', 'tools', 'community'],
    items: [
      {
        title: 'AI 工具如何进入社区内容工作流',
        authorName: 'Cedric',
        sourceUrl: 'https://example.com/geekdaily/1915/ai-tools-community-workflow',
        summary: '围绕内容整理、摘要生成和人工复核，讨论社区日报可以如何更稳定地使用 AI 工具。',
      },
      {
        title: '开发者社区的长期档案设计',
        authorName: 'Harry',
        sourceUrl: 'https://example.com/geekdaily/1915/community-archive-design',
        summary: '从 URL、RSS、搜索和编辑节奏几个角度，梳理社区内容如何被长期保存和重新发现。',
      },
    ],
  },
  {
    episodeNumber: 1914,
    publishedAt: '2026-04-20T08:00:00.000Z',
    editors: ['Ruix'],
    tags: ['frontend', 'design'],
    items: [
      {
        title: '用更轻的界面承载高频社区更新',
        authorName: 'Ruix',
        sourceUrl: 'https://example.com/geekdaily/1914/light-community-interface',
        summary: '记录一组面向社区媒体站点的界面原则，包括信息密度、卡片层级和移动端阅读体验。',
      },
    ],
  },
  {
    episodeNumber: 1913,
    publishedAt: '2026-04-19T08:00:00.000Z',
    editors: ['Frozen'],
    tags: ['backend', 'rss'],
    items: [
      {
        title: 'RSS 仍然是社区内容分发的基础设施',
        authorName: 'Frozen',
        sourceUrl: 'https://example.com/geekdaily/1913/rss-community-distribution',
        summary: '介绍 RSS 在社区站点、个人阅读器和自动化归档中的实际价值。',
      },
    ],
  },
  {
    episodeNumber: 1912,
    publishedAt: '2026-04-18T08:00:00.000Z',
    editors: ['Shooter'],
    tags: ['events', 'community'],
    items: [
      {
        title: '小型线下活动如何留下可回看的记录',
        authorName: 'Shooter',
        sourceUrl: 'https://example.com/geekdaily/1912/offline-event-archive',
        summary: '从活动页面、照片、议题和会后整理几个环节，讨论线下活动归档的最低可行做法。',
      },
    ],
  },
  {
    episodeNumber: 1911,
    publishedAt: '2026-04-17T08:00:00.000Z',
    editors: ['Annie'],
    tags: ['hiring', 'community'],
    items: [
      {
        title: '社区招聘信息需要更明确的行动路径',
        authorName: 'Annie',
        sourceUrl: 'https://example.com/geekdaily/1911/hiring-action-path',
        summary: '对比投递链接、邮箱、Telegram 和纯文本联系方式，整理招聘详情页的操作语义。',
      },
    ],
  },
  {
    episodeNumber: 1910,
    publishedAt: '2026-04-16T08:00:00.000Z',
    editors: ['Cedric'],
    tags: ['open-source', 'tools'],
    items: [
      {
        title: '开源项目的公共路线图应该如何表达',
        authorName: 'Cedric',
        sourceUrl: 'https://example.com/geekdaily/1910/open-source-roadmap',
        summary: '讨论路线图、issue、里程碑和公开周报之间的关系，帮助参与者理解项目节奏。',
      },
    ],
  },
  {
    episodeNumber: 1909,
    publishedAt: '2026-04-15T08:00:00.000Z',
    editors: ['Harry'],
    tags: ['search', 'archive'],
    items: [
      {
        title: '站内搜索首屏结果为什么重要',
        authorName: 'Harry',
        sourceUrl: 'https://example.com/geekdaily/1909/search-first-render',
        summary: '从可复制 URL、无 JS 环境和搜索引擎抓取三个角度，解释服务端首屏搜索的价值。',
      },
    ],
  },
  {
    episodeNumber: 1908,
    publishedAt: '2026-04-14T08:00:00.000Z',
    editors: ['Ruix'],
    tags: ['ux', 'content'],
    items: [
      {
        title: '详情页不要重复同一组元信息',
        authorName: 'Ruix',
        sourceUrl: 'https://example.com/geekdaily/1908/detail-metadata',
        summary: '用文章和活动详情页为例，说明 hero、正文和侧栏应该各自承担不同任务。',
      },
    ],
  },
  {
    episodeNumber: 1907,
    publishedAt: '2026-04-13T08:00:00.000Z',
    editors: ['Frozen'],
    tags: ['testing', 'automation'],
    items: [
      {
        title: 'Smoke 测试应该验证真实路由而不是历史假设',
        authorName: 'Frozen',
        sourceUrl: 'https://example.com/geekdaily/1907/smoke-route-assumptions',
        summary: '整理一组让端到端测试更稳定的原则，包括固定 fixture、动态链接发现和短语义断言。',
      },
    ],
  },
  {
    episodeNumber: 1906,
    publishedAt: '2026-04-12T08:00:00.000Z',
    editors: ['Shooter'],
    tags: ['community', 'contributors'],
    items: [
      {
        title: '贡献者页面应该先让真实的人被看见',
        authorName: 'Shooter',
        sourceUrl: 'https://example.com/geekdaily/1906/contributor-page',
        summary: '讨论贡献者档案、参与路径和角色说明如何共同降低社区参与门槛。',
      },
    ],
  },
  {
    episodeNumber: 1905,
    publishedAt: '2026-04-11T08:00:00.000Z',
    editors: ['Annie'],
    tags: ['frontend', 'accessibility'],
    items: [
      {
        title: '筛选和分页需要保留真实链接',
        authorName: 'Annie',
        sourceUrl: 'https://example.com/geekdaily/1905/filter-pagination-links',
        summary: '说明为什么增强型前端交互仍然需要服务端可访问的 URL 和可聚焦的控件。',
      },
    ],
  },
  {
    episodeNumber: 1904,
    publishedAt: '2025-12-20T08:00:00.000Z',
    editors: ['Cedric'],
    tags: ['archive', 'community'],
    items: [
      {
        title: '把旧内容重新整理成可浏览的社区档案',
        authorName: 'Cedric',
        sourceUrl: 'https://example.com/geekdaily/1904/community-archive-baseline',
        summary: '记录一次最小归档建设方案：固定路径、稳定标题、摘要和订阅输出。',
      },
    ],
  },
];

export function getBaselineGeekDailyArchive(): ImportedGeekDailyEpisode[] {
  return baselineGeekDailyTopics.map((episode) => ({
    episodeNumber: episode.episodeNumber,
    slug: getGeekDailyEpisodeSlug(episode.episodeNumber),
    title: `极客日报#${episode.episodeNumber}`,
    summary: buildGeekDailySummary({ items: episode.items }),
    bodyMarkdown: buildGeekDailyBodyMarkdown({
      episodeNumber: episode.episodeNumber,
      editors: episode.editors,
      items: episode.items,
      bodyMarkdown: '',
    }),
    publishedAt: episode.publishedAt,
    editors: episode.editors,
    tags: episode.tags,
    items: episode.items,
  }));
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ',') {
      row.push(field);
      field = '';
      continue;
    }

    if (char === '\n') {
      row.push(field);
      rows.push(row);
      field = '';
      row = [];
      continue;
    }

    if (char === '\r') {
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim();
}

function parseDate(value: string) {
  const [year, month, day] = value.split('/').map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, 8, 0, 0)).toISOString();
}

export function loadGeekDailyArchive(sourceArg = 'geekdaily.csv'): ImportedGeekDailyEpisode[] {
  const sourcePath = resolve(sourceArg);
  const raw = readFileSync(sourcePath, 'utf8');
  const rows = parseCsv(raw);

  if (rows.length < 2) {
    return [];
  }

  const headers = rows[0].map(normalizeHeader);
  const records = rows
    .slice(1)
    .filter((row) => row.some((cell) => cell.trim() !== ''))
    .map((row) => {
      const record = Object.fromEntries(headers.map((header, index) => [header, row[index] ?? '']));
      return {
        episodeNumber: Number(String(record.episode).replace('#', '').trim()),
        publishedAt: String(record.time ?? '').trim(),
        title: String(record.title ?? '').trim(),
        authorName: String(record.author ?? '').trim(),
        sourceUrl: String(record.url ?? '').trim(),
        summary: String(record.introduce ?? '').trim(),
      };
    })
    .filter((record) => Number.isFinite(record.episodeNumber));

  const episodeMap = new Map<number, { publishedAt: string; items: ImportedGeekDailyItem[] }>();

  for (const record of records) {
    if (!episodeMap.has(record.episodeNumber)) {
      episodeMap.set(record.episodeNumber, {
        publishedAt: record.publishedAt,
        items: [],
      });
    }

    episodeMap.get(record.episodeNumber)?.items.push({
      title: record.title,
      authorName: record.authorName,
      sourceUrl: record.sourceUrl,
      summary: record.summary,
    });
  }

  return [...episodeMap.entries()]
    .map(([episodeNumber, episode]) => ({
      episodeNumber,
      slug: getGeekDailyEpisodeSlug(episodeNumber),
      title: `极客日报#${episodeNumber}`,
      summary: buildGeekDailySummary({ items: episode.items }),
      bodyMarkdown: buildGeekDailyBodyMarkdown({
        episodeNumber,
        editors: [],
        items: episode.items,
        bodyMarkdown: '',
      }),
      publishedAt: parseDate(episode.publishedAt),
      editors: [],
      tags: [],
      items: episode.items,
    }))
    .sort((left, right) => right.episodeNumber - left.episodeNumber);
}
