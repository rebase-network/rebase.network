#!/usr/bin/env node

import { existsSync, mkdirSync } from 'node:fs';
import { dirname, isAbsolute, resolve } from 'node:path';

import { chromium } from '@playwright/test';

const defaultProfilePath = resolve('.local/x-rebase-profile');
const loginTimeoutMs = 5 * 60 * 1000;
const navigationTimeoutMs = 45 * 1000;
const postTimeoutMs = 20 * 1000;

const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const usage = () => {
  console.log(`Usage:
  pnpm x:prototype -- [options]

Options:
  --profile <path>  Dedicated Chrome user-data-dir (default: .local/x-rebase-profile)
  --text <text>     Tweet text; required with --publish
  --publish         Actually click the X publish button (default is login/check only)
  --headless        Run headless; first login must be completed in headed mode
  --help             Show this help

Examples:
  pnpm x:prototype
  pnpm x:prototype -- --profile .local/x-rebase-profile --publish --text "日报标题 https://rebase.network"
`);
};

const parseArgs = (argv) => {
  const options = { profile: defaultProfilePath, publish: false, headless: false, text: '' };

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
    if (arg === '--profile' || arg === '--text') {
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
  if (options.publish && !options.text.trim()) {
    throw new Error('--publish requires non-empty --text');
  }
  if (Array.from(options.text).length > 280) {
    throw new Error('--text exceeds 280 Unicode characters; shorten the prototype post');
  }

  return options;
};

const findChrome = () => chromeCandidates.find((candidate) => existsSync(candidate));

const visible = async (locator) => locator.isVisible().catch(() => false);

const firstVisible = async (page, selectors) => {
  for (const selector of selectors) {
    const locator = page.locator(selector).first();
    if (await visible(locator)) return locator;
  }
  return null;
};

const isLoggedIn = async (page) => Boolean(await firstVisible(page, [
  '[data-testid="tweetTextarea_0"]',
  '[data-testid="SideNav_NewTweet_Button"]',
  '[data-testid="AppTabBar_Home_Link"]',
  'a[href="/home"]',
]));

const waitForLogin = async (page) => {
  const deadline = Date.now() + loginTimeoutMs;
  console.log('请在打开的 Chrome 窗口中登录 RebaseCommunity 的 X 账号；脚本不会读取或保存密码。');

  while (Date.now() < deadline) {
    if (await isLoggedIn(page)) return;
    await page.waitForTimeout(1000);
  }

  throw new Error(`登录等待超时，当前页面：${page.url()}`);
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
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Backspace');
  await page.keyboard.insertText(text);

  const postButton = await firstVisible(page, [
    '[data-testid="tweetButtonInline"]',
    '[data-testid="tweetButton"]',
    'button[data-testid*="tweetButton"]',
  ]);
  if (!postButton) throw new Error('找不到 X 发布按钮，可能是页面结构已变化');
  if (!(await postButton.isEnabled().catch(() => false))) throw new Error('X 发布按钮当前不可用，请检查文本长度或账号状态');

  const createTweetResponse = page.waitForResponse(
    (response) => /\/CreateTweet(?:$|\?|\/)/.test(response.url()) && response.request().method() === 'POST',
    { timeout: postTimeoutMs },
  ).catch(() => null);

  await postButton.click();
  const response = await createTweetResponse;
  if (response?.ok()) {
    const payload = await response.json().catch(() => null);
    const tweetId = extractTweetId(payload);
    console.log(tweetId ? `发布成功，tweet id: ${tweetId}` : '发布请求成功，未能从响应中解析 tweet id');
    return;
  }

  const status = await firstVisible(page, ['[data-testid="toast"]', '[role="status"]']);
  const statusText = status ? (await status.textContent().catch(() => ''))?.trim() : '';
  if (/posted|sent|published|已发布|已发送/i.test(statusText ?? '')) {
    console.log(`发布成功：${statusText}`);
    return;
  }

  throw new Error('发布结果不确定。请先检查账号主页或通知，确认未发布后再重试，避免重复发帖。');
};

const main = async () => {
  const options = parseArgs(process.argv.slice(2));
  const chromePath = findChrome();
  if (!chromePath) {
    throw new Error('找不到 Google Chrome，请设置 CHROME_PATH 环境变量');
  }

  mkdirSync(dirname(options.profile), { recursive: true });
  console.log(`使用专用 Profile：${options.profile}`);
  console.log(`使用浏览器：${chromePath}`);

  const context = await chromium.launchPersistentContext(options.profile, {
    executablePath: chromePath,
    headless: options.headless,
    viewport: { width: 1440, height: 960 },
    timeout: navigationTimeoutMs,
  });

  try {
    const page = context.pages()[0] ?? await context.newPage();
    await page.goto('https://x.com/home', { waitUntil: 'domcontentloaded', timeout: navigationTimeoutMs });
    if (!(await isLoggedIn(page))) {
      if (options.headless) throw new Error('当前 Profile 尚未登录；请先不带 --headless 运行一次完成人工登录');
      await waitForLogin(page);
    }

    if (!options.publish) {
      console.log('登录会话有效。本次为检查模式，没有发布任何内容。');
      return;
    }

    await publish(page, options.text.trim());
  } finally {
    await context.close();
  }
};

main().catch((error) => {
  console.error(`[x:prototype] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
