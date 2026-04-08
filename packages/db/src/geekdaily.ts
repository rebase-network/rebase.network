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
