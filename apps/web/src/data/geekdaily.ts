import type { GeekDailyEpisode } from '@rebase/types';

export const geekdailyEpisodes: GeekDailyEpisode[] = [
  {
    slug: 'episode-1915',
    episodeNumber: 1915,
    title: '极客日报#1915',
    summary: '从 TurboQuant 到本地 AI SDK，再到市场份额报告，这一期聚焦工具链、推理优化和市场结构。',
    publishedAt: '2026-04-04T08:00:00.000Z',
    tags: ['ai tooling', 'quant', 'market'],
    body: '这一期围绕推理优化、本地 AI 应用框架以及市场结构研究展开，适合关注模型效率、开发者体验和加密市场流动性的读者。',
    items: [
      {
        title: 'turboquant_plus',
        author: 'Cedric',
        sourceUrl: 'https://github.com/TheTom/turboquant_plus',
        summary: '一个实验性仓库，聚焦 TurboQuant 在 llama.cpp 相关场景中的实现与研究。',
      },
      {
        title: 'Lemonade',
        author: 'Harry',
        sourceUrl: 'https://github.com/lemonade-sdk/lemonade',
        summary: '面向本地 GPU 与 NPU 的生成式 AI 应用框架，覆盖 LLM、语音和图像模型。',
      },
      {
        title: '2026年Q1加密货币市场份额研究报告',
        author: 'Harry',
        sourceUrl: 'https://www.coinglass.com/en/learn/2026-q1-mktshare-report-en',
        summary: '报告总结了 2026 年第一季度加密市场的结构变化、头部交易平台的集中度和去中心化协议的新进展。',
      },
    ],
  },
  {
    slug: 'episode-1914',
    episodeNumber: 1914,
    title: '极客日报#1914',
    summary: '这期内容穿过量化分析师学习路径与 AIOS 操作系统，观察金融知识图谱和 agent system 的连接。',
    publishedAt: '2026-04-03T08:00:00.000Z',
    tags: ['quant', 'agent', 'systems'],
    body: '我们把一条偏量化学习路径和一条偏 AI 代理操作系统路线放在同一期里，能感受到“工具如何变成工作流”的共同主题。',
    items: [
      {
        title: '如何成为一名量化分析师',
        author: 'Harry L',
        sourceUrl: 'https://x.com/gemchange_ltd/status/2028904166895112617',
        summary: '从数学基础、随机过程到面试和行业薪酬，给出了完整的量化分析进阶路线图。',
      },
      {
        title: 'AIOS',
        author: 'Cedric',
        sourceUrl: 'https://github.com/agiresearch/AIOS',
        summary: '一个把 LLM 嵌入操作系统、支持 AI agent 部署和运行的开源系统。',
      },
      {
        title: 'The future of agent-native software',
        author: 'Ruix',
        sourceUrl: 'https://example.com/agent-native-software',
        summary: '一篇关于 agent-native 产品界面、记忆层和任务执行反馈机制的长文。',
      },
    ],
  },
  {
    slug: 'episode-1913',
    episodeNumber: 1913,
    title: '极客日报#1913',
    summary: '关注研究笔记、开发者工具体验以及 community tooling 在日常工作里的变化。',
    publishedAt: '2026-04-02T08:00:00.000Z',
    tags: ['builder workflow', 'research', 'community'],
    body: '这一期更像一张工作台快照：研究记录、开发者工具的细节改进，以及社区工具如何逐步形成自己的产品语言。',
    items: [
      {
        title: 'Composable research notes',
        author: 'Annie',
        sourceUrl: 'https://example.com/composable-research-notes',
        summary: '讨论研究笔记如何从散乱文档演化成可以被团队复用的知识组件。',
      },
      {
        title: 'Developer tools as calm products',
        author: 'Cedric',
        sourceUrl: 'https://example.com/developer-tools-calm-products',
        summary: '认为好的开发者工具应该减少噪音，增强长期工作流中的可预测性。',
      },
      {
        title: 'Community tooling checklist',
        author: 'Ruix',
        sourceUrl: 'https://example.com/community-tooling-checklist',
        summary: '为社区型站点整理的内容、搜索、订阅、招聘和归档能力清单。',
      },
    ],
  },
];
