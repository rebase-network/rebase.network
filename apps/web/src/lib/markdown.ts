import { marked } from 'marked';

marked.setOptions({
  breaks: true,
  gfm: true,
});

function escapeInlineHtml(content: string) {
  return content
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function renderMarkdown(content: string) {
  const raw = marked.parse(escapeInlineHtml(content)) as string;
  return raw.replaceAll('<a href=', '<a target="_blank" rel="noreferrer noopener" href=');
}
