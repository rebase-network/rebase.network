import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const BASE_URL = new URL('https://rebase.network');

function escapeInlineHtml(content: string) {
  return content
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function escapeAttribute(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function isSafeUrl(value: string) {
  const href = value.trim();

  if (!href) {
    return false;
  }

  if (
    href.startsWith('/') ||
    href.startsWith('./') ||
    href.startsWith('../') ||
    href.startsWith('#') ||
    href.startsWith('?')
  ) {
    return true;
  }

  try {
    return SAFE_PROTOCOLS.has(new URL(href, BASE_URL).protocol);
  } catch {
    return false;
  }
}

function shouldOpenInNewTab(value: string) {
  if (!isSafeUrl(value)) {
    return false;
  }

  try {
    const url = new URL(value, BASE_URL);
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== BASE_URL.origin;
  } catch {
    return false;
  }
}

const renderer = new marked.Renderer();

renderer.heading = function ({ tokens, depth }) {
  const text = this.parser.parseInline(tokens);
  const normalizedDepth = Math.min(depth + 1, 6);

  return `<h${normalizedDepth}>${text}</h${normalizedDepth}>`;
};

renderer.link = function ({ href, title, tokens }) {
  const text = this.parser.parseInline(tokens);

  if (!href || !isSafeUrl(href)) {
    return text;
  }

  const attributes = [`href="${escapeAttribute(href)}"`];

  if (title) {
    attributes.push(`title="${escapeAttribute(title)}"`);
  }

  if (shouldOpenInNewTab(href)) {
    attributes.push('target="_blank"', 'rel="noreferrer noopener"');
  }

  return `<a ${attributes.join(' ')}>${text}</a>`;
};

renderer.image = function ({ href, title, text }) {
  if (!href || !isSafeUrl(href)) {
    return escapeInlineHtml(text);
  }

  const attributes = [
    `src="${escapeAttribute(href)}"`,
    `alt="${escapeAttribute(text)}"`,
  ];

  if (title) {
    attributes.push(`title="${escapeAttribute(title)}"`);
  }

  return `<img ${attributes.join(' ')}>`;
};

export function renderMarkdown(content: string) {
  return marked.parse(escapeInlineHtml(content), { renderer }) as string;
}
