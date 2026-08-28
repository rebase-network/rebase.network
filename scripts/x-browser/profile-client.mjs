import { existsSync } from 'node:fs';
import { setTimeout as delay } from 'node:timers/promises';

import { Browser } from '@agent-infra/browser';

export const maxTweetCharacters = 280;

const navigationTimeoutMs = 45 * 1000;
const sessionCheckTimeoutMs = 20 * 1000;
const postTimeoutMs = 20 * 1000;

export const normalizeXHandle = (value) => String(value ?? '').trim().replace(/^@/, '').toLowerCase();
export const countTweetCharacters = (value) => Array.from(String(value ?? '')).length;

export const validateXOptions = ({ profilePath, expectedHandle }) => {
  if (!profilePath || !existsSync(profilePath)) throw new Error(`X Profile 不存在：${profilePath || '<empty>'}`);
  const handle = normalizeXHandle(expectedHandle);
  if (!/^[a-z0-9_]{1,15}$/.test(handle)) throw new Error('X handle 必须是 1-15 位字母、数字或下划线');
  return handle;
};

export const validateTweetText = (value) => {
  const text = String(value ?? '').trim();
  const length = countTweetCharacters(text);
  if (!text) throw new Error('推文内容不能为空');
  if (length > maxTweetCharacters) throw new Error(`推文长度 ${length} 超过 ${maxTweetCharacters} 字符`);
  return text;
};

const launchBrowser = async ({ profilePath, headless, chromePath }) => {
  const ignoreDefaultArgs = ['--enable-automation'];
  if (process.platform === 'darwin') ignoreDefaultArgs.push('--password-store=basic', '--use-mock-keychain');

  return Browser.create({
    launchOrConnect: {
      headless,
      userDataDir: profilePath,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled',
      ],
      // macOS needs Keychain-backed cookies; Linux keeps Puppeteer's stable basic password store.
      ignoreDefaultArgs,
      ...(chromePath ? { executablePath: chromePath } : {}),
    },
  });
};

const isElementVisible = async (element) => {
  try {
    return await element.evaluate((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
    });
  } catch {
    return false;
  }
};

const firstVisible = async (page, selectors) => {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (!element) continue;
    if (await isElementVisible(element)) return element;
    await element.dispose();
  }
  return null;
};

const isLoggedIn = async (page) => {
  if (!page.url().includes('x.com/home')) return false;
  const element = await firstVisible(page, [
    '[data-testid="tweetTextarea_0"]',
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="AppTabBar_Home_Link"]',
    'a[href="/home"]',
  ]);
  if (!element) return false;
  await element.dispose();
  return true;
};

const waitForSession = async (page) => {
  const deadline = Date.now() + sessionCheckTimeoutMs;
  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) return true;
    await delay(500);
  }
  return false;
};

const readCurrentHandle = async (page) => {
  const accountButton = await firstVisible(page, ['[data-testid="SideNav_AccountSwitcher_Button"]']);
  if (accountButton) {
    const text = await accountButton.evaluate((node) => node.textContent ?? '');
    await accountButton.dispose();
    const match = text.match(/@([A-Za-z0-9_]{1,15})/);
    if (match) return normalizeXHandle(match[1]);
  }

  const profileLink = await firstVisible(page, [
    '[data-testid="AppTabBar_Profile_Link"]',
    'a[href^="/"][aria-label*="Profile"]',
  ]);
  if (!profileLink) return null;

  const href = await profileLink.getProperty('href');
  const value = await href.jsonValue().catch(() => '');
  await profileLink.dispose();
  try {
    const path = new URL(String(value)).pathname.replace(/^\//, '');
    return /^[A-Za-z0-9_]{1,15}$/.test(path) ? normalizeXHandle(path) : null;
  } catch {
    return null;
  }
};

const openSession = async (options) => {
  const expectedHandle = validateXOptions(options);
  const browser = await launchBrowser(options);
  try {
    const activeTab = browser.getActiveTab();
    if (!activeTab) throw new Error('Chrome 没有可用标签页');
    const page = activeTab.page;
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
    if (!(await waitForSession(page))) {
      throw new Error('X Profile 尚未登录；请先用普通 Chrome 完成人工登录并正常关闭浏览器');
    }
    const actualHandle = await readCurrentHandle(page);
    if (!actualHandle) throw new Error(`无法确认当前 X 账号，请确认已登录 @${expectedHandle}`);
    if (actualHandle !== expectedHandle) throw new Error(`当前 X 账号是 @${actualHandle}，预期为 @${expectedHandle}`);
    return { browser, page, handle: actualHandle };
  } catch (error) {
    await browser.close();
    throw error;
  }
};

const openComposer = async (page) => {
  const existing = await firstVisible(page, [
    '[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][role="textbox"]',
  ]);
  if (existing) return existing;

  const composeButton = await firstVisible(page, [
    '[data-testid="SideNav_NewTweet_Button"]',
    '[data-testid="AppTabBar_ComposeButton"]',
    '[aria-label*="Post"]',
    '[aria-label*="Tweet"]',
  ]);
  if (!composeButton) throw new Error('找不到 X 发帖入口，可能是页面结构已变化');
  await composeButton.click();
  await composeButton.dispose();

  const composer = await firstVisible(page, [
    '[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][role="textbox"]',
  ]);
  if (!composer) throw new Error('打开编辑器后找不到文本输入框');
  return composer;
};

const extractTweetId = (payload) => {
  const candidates = [
    payload?.data?.create_tweet?.tweet_results?.result?.rest_id,
    payload?.data?.create_tweet?.tweet_results?.result?.legacy?.id_str,
  ];
  return candidates.find((value) => typeof value === 'string' && /^\d+$/.test(value));
};

export const checkXProfile = async (options) => {
  const session = await openSession(options);
  try {
    return { handle: session.handle };
  } finally {
    await session.browser.close();
  }
};

export const publishTweetWithProfile = async (options) => {
  const text = validateTweetText(options.text);
  const session = await openSession(options);
  try {
    const composer = await openComposer(session.page);
    await composer.click();
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await session.page.keyboard.down(modifier);
    await session.page.keyboard.press('a');
    await session.page.keyboard.up(modifier);
    await session.page.keyboard.press('Backspace');
    await composer.type(text, { delay: 10 });
    await composer.dispose();

    const postButton = await firstVisible(session.page, [
      '[data-testid="tweetButtonInline"]',
      '[data-testid="tweetButton"]',
      'button[data-testid*="tweetButton"]',
    ]);
    if (!postButton) throw new Error('找不到 X 发布按钮，可能是页面结构已变化');
    const disabled = await postButton.evaluate((node) => node.getAttribute('aria-disabled') === 'true' || node.disabled === true);
    if (disabled) {
      await postButton.dispose();
      throw new Error('X 发布按钮当前不可用，请检查内容或账号状态');
    }

    const responsePromise = session.page.waitForResponse(
      (response) => /\/CreateTweet(?:$|\?|\/)/.test(response.url()) && response.request().method() === 'POST',
      { timeout: postTimeoutMs },
    ).catch(() => null);
    await postButton.click();
    await postButton.dispose();

    const response = await responsePromise;
    if (!response?.ok()) throw new Error('X 发布结果不确定，请检查账号主页后再决定是否重试');
    const tweetId = extractTweetId(await response.json().catch(() => null));
    if (!tweetId) throw new Error('X 发布成功但未能解析 tweet id，请检查账号主页');
    return { tweetId, url: `https://x.com/${session.handle}/status/${tweetId}` };
  } finally {
    await session.browser.close();
  }
};
