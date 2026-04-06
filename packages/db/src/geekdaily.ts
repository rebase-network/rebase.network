import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { getGeekDailyEpisodeSlug } from '@rebase/shared';

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
  tags: string[];
  items: ImportedGeekDailyItem[];
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

function buildSummary(items: ImportedGeekDailyItem[]) {
  const previewTitles = items.slice(0, 3).map((item) => item.title).join('、');
  const suffix = items.length > 3 ? ' 等内容。' : '。';
  return `本期收录 ${items.length} 条社区推荐，涉及 ${previewTitles}${suffix}`;
}

function buildBody(episodeNumber: number, items: ImportedGeekDailyItem[]) {
  const contributors = [...new Set(items.map((item) => item.authorName).filter(Boolean))];
  const intro = `极客日报#${episodeNumber} 收录了 ${items.length} 条来自社区的推荐${contributors.length > 0 ? `，推荐人包括 ${contributors.join('、')}` : ''}。`;
  const lines = items.map((item, index) => {
    const sourceLine = item.sourceUrl ? `\n来源：${item.sourceUrl}` : '';
    return `${index + 1}. ${item.title}\n推荐人：${item.authorName || 'unknown'}${sourceLine}\n摘要：${item.summary}`;
  });

  return [intro, ...lines].join('\n\n');
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
      summary: buildSummary(episode.items),
      bodyMarkdown: buildBody(episodeNumber, episode.items),
      publishedAt: parseDate(episode.publishedAt),
      tags: [],
      items: episode.items,
    }))
    .sort((left, right) => right.episodeNumber - left.episodeNumber);
}
