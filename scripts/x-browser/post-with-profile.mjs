#!/usr/bin/env node

import { mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';

import { Browser } from '@agent-infra/browser';

const defaultProfilePath = resolve('.local/x-rebase-profile');
const defaultHandle = 'RebaseCommunity';
const navigationTimeoutMs = 45 * 1000;
const sessionCheckTimeoutMs = 20 * 1000;
const postTimeoutMs = 20 * 1000;

const usage = () => {
  console.log(`Usage:
  pnpm x:prototype -- [options]

Options:
  --profile <path>  Dedicated Chrome user-data-dir (default: .local/x-rebase-profile)
  --handle <name>   Expected X account handle (default: RebaseCommunity)
  --text <text>     Tweet text; required with --publish
  --publish         Actually click the X publish button (default is login/check only)
  --headless        Run headless; first login must be completed in headed mode
  --help             Show this help

Examples:
  pnpm x:prototype -- --profile .local/x-rebase-profile
  pnpm x:prototype -- --handle RebaseCommunity --publish --text "日报标题 https://rebase.network"
`);
};

const normalizeHandle = (value) => value.trim().replace(/^@/, '').toLowerCase();

const parseArgs = (argv) => {
  const options = {
    profile: defaultProfilePath,
    handle: defaultHandle,
    publish: false,
    headless: false,
    text: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--') continue;
    if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    }
    if (arg === '--publish') {
      options.publish = true;
      continue;
    }
    if (arg === '--headless') {
      options.headless = true;
      continue;
    }
    if (arg === '--profile' || arg === '--handle' || arg === '--text') {
      const value = argv[index + 1];
      if (!value || value.startsWith('--')) {
        throw new Error(`${arg} requires a value`);
      }
      options[arg.slice(2)] = value;
      index += 1;
      continue;
    }
    throw new Error(`unknown option: ${arg}`);
  }

  options.profile = isAbsolute(options.profile) ? options.profile : resolve(options.profile);
  options.handle = normalizeHandle(options.handle);
  if (!/^[a-z0-9_]{1,15}$/.test(options.handle)) {
    throw new Error('--handle must contain 1-15 letters, numbers, or underscores');
  }
  if (options.publish && !options.text.trim()) {
    throw new Error('--publish requires non-empty --text');
  }
  if (Array.from(options.text).length > 280) {
    throw new Error('--text exceeds 280 Unicode characters; shorten the prototype post');
  }

  return options;
};

const launchBrowser = async ({ profile, headless }) => {
  const ignoreDefaultArgs = ['--enable-automation'];
  if (process.platform === 'darwin') {
    ignoreDefaultArgs.push('--password-store=basic', '--use-mock-keychain');
  }

  const launchOrConnect = {
    headless,
    userDataDir: profile,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
    ],
    // macOS needs Keychain-backed cookies; Linux keeps Puppeteer's stable basic password store.
    ignoreDefaultArgs,
  };

  if (process.env.CHROME_PATH?.trim()) {
    launchOrConnect.executablePath = process.env.CHROME_PATH.trim();
  }

  return Browser.create({ launchOrConnect });
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
    if (match) return normalizeHandle(match[1]);
  }

  const profileLink = await firstVisible(page, [
    '[data-testid="AppTabBar_Profile_Link"]',
    'a[href^="/"][aria-label*="Profile"]',
  ]);
  if (profileLink) {
    const href = await profileLink.getProperty('href');
    const value = await href.jsonValue().catch(() => '');
    await profileLink.dispose();
    try {
      const path = new URL(String(value)).pathname.replace(/^\//, '');
      if (/^[A-Za-z0-9_]{1,15}$/.test(path)) return normalizeHandle(path);
    } catch {
      return null;
    }
  }

  return null;
};

const verifyAccount = async (page, expectedHandle) => {
  const actualHandle = await readCurrentHandle(page);
  if (!actualHandle) {
    throw new Error(`无法确认当前 X 账号，请确认已登录 @${expectedHandle} 后再发布`);
  }
  if (actualHandle !== expectedHandle) {
    throw new Error(`当前登录账号是 @${actualHandle}，不是预期的 @${expectedHandle}`);
  }
  console.log(`已确认当前账号：@${actualHandle}`);
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

const publish = async (page, text) => {
  const composer = await openComposer(page);
  await composer.click();
  const selectAllModifier = process.platform === 'darwin' ? 'Meta' : 'Control';
  await page.keyboard.down(selectAllModifier);
  await page.keyboard.press('a');
  await page.keyboard.up(selectAllModifier);
  await page.keyboard.press('Backspace');
  await composer.type(text, { delay: 10 });
  await composer.dispose();

  const postButton = await firstVisible(page, [
    '[data-testid="tweetButtonInline"]',
    '[data-testid="tweetButton"]',
    'button[data-testid*="tweetButton"]',
  ]);
  if (!postButton) throw new Error('找不到 X 发布按钮，可能是页面结构已变化');

  const disabled = await postButton.evaluate((node) => node.getAttribute('aria-disabled') === 'true' || node.disabled === true);
  if (disabled) {
    await postButton.dispose();
    throw new Error('X 发布按钮当前不可用，请检查文本长度或账号状态');
  }

  const createTweetResponse = page.waitForResponse(
    (response) => /\/CreateTweet(?:$|\?|\/)/.test(response.url()) && response.request().method() === 'POST',
    { timeout: postTimeoutMs },
  ).catch(() => null);

  await postButton.click();
  await postButton.dispose();
  const response = await createTweetResponse;
  if (response?.ok()) {
    const payload = await response.json().catch(() => null);
    const tweetId = extractTweetId(payload);
    console.log(tweetId ? `发布成功，tweet id: ${tweetId}` : '发布请求成功，未能从响应中解析 tweet id');
    return;
  }

  const status = await firstVisible(page, ['[data-testid="toast"]', '[role="status"]']);
  const statusText = status ? (await status.evaluate((node) => node.textContent ?? '')).trim() : '';
  if (status) await status.dispose();
  if (/posted|sent|published|已发布|已发送/i.test(statusText)) {
    console.log(`发布成功：${statusText}`);
    return;
  }

  throw new Error('发布结果不确定。请先检查账号主页或通知，确认未发布后再重试，避免重复发帖。');
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  mkdirSync(dirname(options.profile), { recursive: true });
  console.log(`使用专用 Profile：${options.profile}`);

  const browser = await launchBrowser(options);
  try {
    const activeTab = browser.getActiveTab();
    if (!activeTab) throw new Error('浏览器没有可用标签页');
    const page = activeTab.page;

    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
    if (!(await waitForSession(page))) {
      throw new Error('当前 Profile 尚未登录；请先用普通 Chrome 打开该 Profile 完成人工登录并正常关闭浏览器');
    }

    if (!options.publish) {
      const currentHandle = await readCurrentHandle(page);
      console.log(currentHandle ? `登录会话有效，当前账号：@${currentHandle}` : '登录会话有效，但未能读取当前账号 handle');
      console.log('本次为检查模式，没有发布任何内容。');
      return;
    }

    await verifyAccount(page, options.handle);
    await publish(page, options.text.trim());
  } finally {
    await browser.close();
  }
};

main().catch((error) => {
  console.error(`[x:prototype] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
