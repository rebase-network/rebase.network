interface GeekDailyWechatItemInput {
  title: string;
  authorName: string;
  sourceUrl: string;
  summary: string;
}

interface GeekDailyWechatTemplatePayload {
  title1: string;
  url1: string;
  author1: string;
  introduce1: string;
  title2: string;
  url2: string;
  author2: string;
  introduce2: string;
  title3: string;
  url3: string;
  author3: string;
  introduce3: string;
}

export interface GeekDailyWechatInput {
  episodeNumber: number;
  editorName: string;
  bodyMarkdown: string;
  items: GeekDailyWechatItemInput[];
}

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const normalizeVisibleText = (value: string) =>
  value
    .replace(/\u00a0/g, ' ')
    .replace(/\u3000/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const normalizeUrlText = (value: string) =>
  value
    .replace(/\u00a0/g, '')
    .replace(/\u3000/g, '')
    .replace(/\s+/g, '')
    .trim();

const compactWechatHtml = (value: string) =>
  value
    .replace(/\r?\n+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/>\s+([^<])/g, '>$1')
    .replace(/([^>])\s+</g, '$1<')
    .replace(/\s{2,}/g, ' ')
    .trim();

const isFilled = (value: string) => value.trim().length > 0;
const hasCompleteItem = (item: GeekDailyWechatItemInput) =>
  isFilled(item.title) && isFilled(item.authorName) && isFilled(item.sourceUrl) && isFilled(item.summary);

function renderWechatTemplate(content: string, dx: GeekDailyWechatTemplatePayload) {
  return `
    <div>${content} </div>

    <br/>
    <br/>

    <div class="rich_media_content" style="visibility: visible; margin: 5px 8px;">
      <h2 style="margin-bottom: 14px;font-size: 22px;line-height: 1.4;font-family: -apple-system-font, system-ui, &quot;Helvetica Neue&quot;, &quot;PingFang SC&quot;, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei UI&quot;, &quot;Microsoft YaHei&quot;, Arial, sans-serif;letter-spacing: 0.544px;text-align: start;white-space: normal;background-color: rgb(255, 255, 255);">
          <span style="margin: 5px 8px; font-size: 15px;">微信不支持外部链接，可以点击文章底部的<strong data-darkmode-bgcolor="rgb(36, 36, 36)" data-darkmode-color="rgb(150, 162, 172)" data-style="max-width: 100%; background-color: rgb(255, 255, 255); color: rgb(61, 70, 77); font-family: suxingme, &quot;Open Sans&quot;, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, STHeiti, &quot;WenQuanYi Micro Hei&quot;, SimSun, sans-serif; letter-spacing: 0.544px; text-align: start; box-sizing: border-box !important; overflow-wrap: break-word !important;" class="js_darkmode__1" style="font-size: 15px;max-width: 100%;letter-spacing: 0.544px;color: rgb(61, 70, 77);font-family: suxingme, &quot;Open Sans&quot;, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, STHeiti, &quot;WenQuanYi Micro Hei&quot;, SimSun, sans-serif;visibility: visible;box-sizing: border-box !important;overflow-wrap: break-word !important;">阅读原文</strong><span data-darkmode-bgcolor="rgb(36, 36, 36)" data-darkmode-color="rgb(150, 162, 172)" data-style="max-width: 100%; background-color: rgb(255, 255, 255); color: rgb(61, 70, 77); font-family: suxingme, &quot;Open Sans&quot;, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, STHeiti, &quot;WenQuanYi Micro Hei&quot;, SimSun, sans-serif; letter-spacing: 0.544px; text-align: start;" class="js_darkmode__2" style="max-width: 100%;letter-spacing: 0.544px;color: rgb(61, 70, 77);font-family: suxingme, &quot;Open Sans&quot;, Arial, &quot;Hiragino Sans GB&quot;, &quot;Microsoft YaHei&quot;, STHeiti, &quot;WenQuanYi Micro Hei&quot;, SimSun, sans-serif;visibility: visible;box-sizing: border-box !important;overflow-wrap: break-word !important;">
          ，方便阅读文中的链接，也可通过 https://daily.rebase.network/ 浏览每期日报内容。</span></span></h2>

          <blockquote style="margin: 2em 8px; -webkit-tap-highlight-color: transparent; font-size: 14px; white-space: normal; text-align: left; color: rgba(0, 0, 0, 0.5); line-height: 1.75; font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif; border-left: none; padding: 1em; border-radius: 8px; background: rgb(247, 247, 247);" data-mpa-powered-by="yiban.io">
          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong>
              <span style="color: rgb(0, 0, 0);">
                ${dx.title1}
              </span>
            </strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong><span style="color: rgb(0, 0, 0);"><br></span></strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            ${dx.url1}
            <br>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <em style="color: rgba(0, 0, 0, 0.5);"><br></em>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <span style="color: rgb(0, 0, 0);font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif;letter-spacing: 1.4px;text-align: left;background-color: rgb(247, 247, 247);">
              <strong>${dx.author1}</strong>:
            </span>

            <span style="color: rgb(0, 0, 0);">
              ${dx.introduce1}
            </span>

            <span style="color: rgb(179, 144, 144);font-size: 1em;letter-spacing: 0.1em;"></span>
          </p>
        </blockquote>

        <!--  -->
        <blockquote style="margin: 2em 8px; -webkit-tap-highlight-color: transparent; font-size: 14px; white-space: normal; text-align: left; color: rgba(0, 0, 0, 0.5); line-height: 1.75; font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif; border-left: none; padding: 1em; border-radius: 8px; background: rgb(247, 247, 247);" data-mpa-powered-by="yiban.io">
          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong>
              <span style="color: rgb(0, 0, 0);">
                ${dx.title2}
              </span>
            </strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong><span style="color: rgb(0, 0, 0);"><br></span></strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            ${dx.url2}
            <br>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <em style="color: rgba(0, 0, 0, 0.5);"><br></em>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <span style="color: rgb(0, 0, 0);font-size: 16px;">
              <span style="color: rgb(0, 0, 0);font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif;letter-spacing: 1.4px;text-align: left;background-color: rgb(247, 247, 247);">
                <strong>${dx.author2}</strong>:
              </span>
            </span>

            <span style="color: rgb(0, 0, 0);">
              ${dx.introduce2}
            </span>

            <span style="color: rgb(179, 144, 144);font-size: 1em;letter-spacing: 0.1em;"></span>
          </p>
        </blockquote>

        <!--  -->
        <blockquote style="margin: 2em 8px; -webkit-tap-highlight-color: transparent; font-size: 14px; white-space: normal; text-align: left; color: rgba(0, 0, 0, 0.5); line-height: 1.75; font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif; border-left: none; padding: 1em; border-radius: 8px; background: rgb(247, 247, 247);" data-mpa-powered-by="yiban.io">
          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong>
              <span style="color: rgb(0, 0, 0);">
                ${dx.title3}
              </span>
            </strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <strong><span style="color: rgb(0, 0, 0);"><br></span></strong>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            ${dx.url3}
            <br>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <em style="color: rgba(0, 0, 0, 0.5);"><br></em>
          </p>

          <p style="-webkit-tap-highlight-color: transparent;color: rgb(80, 80, 80);line-height: 1.75;font-size: 1em;letter-spacing: 0.1em;">
            <span style="color: rgb(0, 0, 0);font-size: 16px;">
              <span style="color: rgb(0, 0, 0);font-family: Optima-Regular, Optima, PingFangSC-light, PingFangTC-light, &quot;PingFang SC&quot;, Cambria, Cochin, Georgia, Times, &quot;Times New Roman&quot;, serif;letter-spacing: 1.4px;text-align: left;background-color: rgb(247, 247, 247);">
                <strong>${dx.author3}</strong>:
              </span>
            </span>

            <span style="color: rgb(0, 0, 0);">
              ${dx.introduce3}
            </span>

            <span style="color: rgb(179, 144, 144);font-size: 1em;letter-spacing: 0.1em;"></span>
          </p>
        </blockquote>

      <p style="max-width: 100%;min-height: 1em;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <hr style="max-width: 100%;border-style: solid;border-right-width: 0px;border-bottom-width: 0px;border-left-width: 0px;border-color: rgba(0, 0, 0, 0.098);transform-origin: 0px 0px 0px;transform: scale(1, 0.5);box-sizing: border-box !important;overflow-wrap: break-word !important;">
      <p style="max-width: 100%;min-height: 1em;color: rgb(53, 53, 53);font-size: 14px;text-align: start;letter-spacing: 0.544px;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <p style="max-width: 100%;min-height: 1em;letter-spacing: 0.544px;color: rgb(53, 53, 53);font-size: 14px;text-align: start;box-sizing: border-box !important;overflow-wrap: break-word !important;"><span style="max-width: 100%;font-size: 15px;box-sizing: border-box !important;overflow-wrap: break-word !important;"><strong style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;">Web3 极客日报是为 Web3 时代的极客们准备的日常读物，由一群极客协作完成，每天更新，每期包含三个推荐内容，都来自极客们各自关注的领域。每晚由 Rebase 志愿者整理发出。若有意参与内容贡献，请添加微信 ljyxxzj 并注明日报贡献。</span></p>
      <p style="max-width: 100%;min-height: 1em;letter-spacing: 0.544px;color: rgb(53, 53, 53);font-size: 14px;text-align: start;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <p style="max-width: 100%;min-height: 1em;letter-spacing: 0.544px;color: rgb(53, 53, 53);font-size: 14px;text-align: start;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <hr style="max-width: 100%;border-style: solid;border-right-width: 0px;border-bottom-width: 0px;border-left-width: 0px;border-color: rgba(0, 0, 0, 0.098);transform-origin: 0px 0px 0px;transform: scale(1, 0.5);box-sizing: border-box !important;overflow-wrap: break-word !important;">
      <p style="max-width: 100%;min-height: 1em;text-align: center;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <p style="max-width: 100%;min-height: 1em;text-align: center;box-sizing: border-box !important;overflow-wrap: break-word !important;"><span style="max-width: 100%;font-size: 15px;box-sizing: border-box !important;overflow-wrap: break-word !important;"><strong style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;">网站:</strong><strong style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;">https://rebase.network</strong></span></p>
      <p style="max-width: 100%;min-height: 1em;text-align: center;box-sizing: border-box !important;overflow-wrap: break-word !important;"><span style="max-width: 100%;font-size: 15px;box-sizing: border-box !important;overflow-wrap: break-word !important;"><strong style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;">公众号:</strong><strong style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;">rebase_network</strong></span></p>
      <p style="max-width: 100%;min-height: 1em;box-sizing: border-box !important;overflow-wrap: break-word !important;"><br style="max-width: 100%;box-sizing: border-box !important;overflow-wrap: break-word !important;"></p>
      <p style="max-width: 100%;min-height: 1em;color: rgb(53, 53, 53);font-size: 14px;text-align: center;letter-spacing: 0.544px;box-sizing: border-box !important;overflow-wrap: break-word !important;"><img class="rich_pages img_loading" data-ratio="1" data-s="300,640" data-type="png" data-w="372" data-src="https://mmbiz.qpic.cn/mmbiz_png/dQFmOEibdOIKVOj71RpnXzn8Tr4FaCggj0LDicic24267jickINQpwKjNSWo92oMn7M5phnyIuV5FIcbKzicMje0ZHw/640?wx_fmt=png" style="box-sizing: border-box !important; overflow-wrap: break-word !important; visibility: visible !important; width: 223px !important; height: 223px !important;" _width="223px" src="data:image/gif;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGBgAAAABQABh6FO1AAAAABJRU5ErkJggg==" crossorigin="anonymous"></p>
    </div>
  `;
}

const buildWechatIntroHtml = (_input: GeekDailyWechatInput) => '';

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

  const [first, second, third] = input.items;

  return compactWechatHtml(
    renderWechatTemplate(buildWechatIntroHtml(input), {
      title1: escapeHtml(normalizeVisibleText(first.title)),
      url1: escapeHtml(normalizeUrlText(first.sourceUrl)),
      author1: escapeHtml(normalizeVisibleText(first.authorName)),
      introduce1: escapeHtml(normalizeVisibleText(first.summary)),
      title2: escapeHtml(normalizeVisibleText(second.title)),
      url2: escapeHtml(normalizeUrlText(second.sourceUrl)),
      author2: escapeHtml(normalizeVisibleText(second.authorName)),
      introduce2: escapeHtml(normalizeVisibleText(second.summary)),
      title3: escapeHtml(normalizeVisibleText(third.title)),
      url3: escapeHtml(normalizeUrlText(third.sourceUrl)),
      author3: escapeHtml(normalizeVisibleText(third.authorName)),
      introduce3: escapeHtml(normalizeVisibleText(third.summary)),
    }),
  );
}
