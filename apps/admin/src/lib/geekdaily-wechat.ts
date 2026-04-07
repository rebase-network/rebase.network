interface GeekDailyWechatItemInput {
  title: string;
  authorName: string;
  sourceUrl: string;
  summary: string;
}

export interface GeekDailyWechatInput {
  episodeNumber: number;
  editorName: string;
  bodyMarkdown: string;
  items: GeekDailyWechatItemInput[];
}

const qrCodeImageUrl =
  'https://mmbiz.qpic.cn/mmbiz_png/dQFmOEibdOIKVOj71RpnXzn8Tr4FaCggj0LDicic24267jickINQpwKjNSWo92oMn7M5phnyIuV5FIcbKzicMje0ZHw/640?wx_fmt=png';

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const isFilled = (value: string) => value.trim().length > 0;
const hasCompleteItem = (item: GeekDailyWechatItemInput) =>
  isFilled(item.title) && isFilled(item.authorName) && isFilled(item.sourceUrl) && isFilled(item.summary);

const renderWechatLead = () => `
  <section style="margin: 0 0 24px;">
    <p style="margin: 0; color: #3d464d; font-size: 15px; line-height: 1.9; word-break: break-word;">
      微信不支持外部链接，可以点击文章底部的<strong>阅读原文</strong>，方便阅读文中的链接，也可通过
      <strong>https://daily.rebase.network/</strong> 浏览每期日报内容。
    </p>
  </section>
`.trim();

const renderWechatItem = (item: GeekDailyWechatItemInput) => `
  <blockquote
    style="margin: 0 0 28px; padding: 18px 16px; border-left: none; border-radius: 12px; background-color: #f7f7f7;"
  >
    <p style="margin: 0 0 16px; color: #111111; font-size: 17px; line-height: 1.75; word-break: break-word;">
      <strong>${escapeHtml(item.title.trim())}</strong>
    </p>
    <p style="margin: 0 0 16px; color: #747474; font-size: 15px; line-height: 1.8; word-break: break-all;">
      ${escapeHtml(item.sourceUrl.trim())}
    </p>
    <p style="margin: 0; color: #222222; font-size: 16px; line-height: 1.9; word-break: break-word;">
      <strong>${escapeHtml(item.authorName.trim())}:</strong>
      ${escapeHtml(item.summary.trim())}
    </p>
  </blockquote>
`.trim();

const renderWechatFooter = () => `
  <section style="margin-top: 30px; padding-top: 24px; border-top: 1px solid #e9e9e9;">
    <p style="margin: 0 0 18px; color: #353535; font-size: 15px; line-height: 1.95; word-break: break-word;">
      <strong>Web3 极客日报是为 Web3 时代的极客们准备的日常读物，由一群极客协作完成，每天更新，每期包含三个推荐内容，都来自极客们各自关注的领域。每晚由 Rebase 志愿者整理发出。若有意参与内容贡献，请添加微信 ljyxxzj 并注明日报贡献。</strong>
    </p>
    <p style="margin: 0 0 8px; color: #353535; font-size: 15px; line-height: 1.8; text-align: center;">
      <strong>网站:</strong><strong>https://rebase.network</strong>
    </p>
    <p style="margin: 0 0 18px; color: #353535; font-size: 15px; line-height: 1.8; text-align: center;">
      <strong>公众号:</strong><strong>rebase_network</strong>
    </p>
    <p style="margin: 0; text-align: center;">
      <img src="${qrCodeImageUrl}" data-src="${qrCodeImageUrl}" alt="Rebase Community" style="display: inline-block; width: 223px; max-width: 100%; height: auto;" />
    </p>
  </section>
`.trim();

function renderWechatTemplate(items: GeekDailyWechatItemInput[]) {
  return `
    <section style="margin: 0; color: #1f1f1f; font-size: 16px; line-height: 1.8;">
      ${renderWechatLead()}
      ${items.map((item) => renderWechatItem(item)).join('\n')}
      ${renderWechatFooter()}
    </section>
  `;
}

export const getGeekDailyWechatGenerationIssue = (input: GeekDailyWechatInput) => {
  if (input.episodeNumber <= 0) {
    return '请先填写有效的期数编号。';
  }

  if (input.items.length < 3) {
    return '当前模板仅支持 3 条推荐内容，请先补足 3 条。';
  }

  if (input.items.length > 3) {
    return '当前模板仅支持 3 条推荐内容，请移除多余条目后再生成。';
  }

  if (input.items.some((item) => !hasCompleteItem(item))) {
    return '请先填写完整的 3 条推荐内容后再生成微信稿。';
  }

  return null;
};

export function buildGeekDailyWechatHtml(input: GeekDailyWechatInput) {
  if (getGeekDailyWechatGenerationIssue(input)) {
    return '';
  }

  return renderWechatTemplate(input.items).trim();
}
