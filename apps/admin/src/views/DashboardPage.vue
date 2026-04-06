<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { RouterLink } from 'vue-router';

import type { AdminDashboardStats } from '@rebase/shared';

import { adminFetch } from '../lib/api';

const stats = ref<AdminDashboardStats | null>(null);
const loading = ref(true);
const errorMessage = ref('');

const cards = computed(() => {
  const value = stats.value;
  if (!value) {
    return [];
  }

  return [
    { label: '文章', value: value.articles },
    { label: '招聘', value: value.jobs },
    { label: '活动', value: value.events },
    { label: '贡献者', value: value.contributors },
    { label: '极客日报', value: value.geekdailyEpisodes },
    { label: '审计日志', value: value.auditLogs },
  ];
});

const quickLinks = [
  { to: '/articles', title: '社区文章', detail: '草稿、发布、作者' },
  { to: '/jobs', title: '招聘信息', detail: '岗位与投递入口' },
  { to: '/events', title: '社区活动', detail: '时间、地点、报名' },
  { to: '/geekdaily', title: '极客日报', detail: '期数、条目、归档' },
  { to: '/contributors', title: '贡献者', detail: '角色、头像、社交' },
  { to: '/site', title: '站点页面', detail: '首页、关于页、页脚' },
  { to: '/assets', title: '媒体库', detail: '上传、路径、复用' },
  { to: '/staff', title: '工作人员', detail: '账号与权限' },
] as const;

const workflowInsights = computed(() => {
  const value = stats.value;
  if (!value) {
    return [];
  }

  return [
    {
      title: '内容生产',
      value: value.articles + value.geekdailyEpisodes,
      detail: '文章与极客日报库存',
    },
    {
      title: '机会流转',
      value: value.jobs + value.events,
      detail: '招聘与活动条目',
    },
    {
      title: '社区协作',
      value: value.contributors,
      detail: '公开贡献者档案',
    },
    {
      title: '操作留痕',
      value: value.auditLogs,
      detail: '审计记录总数',
    },
  ];
});

const guidanceItems = [
  {
    title: '每日内容节奏',
    detail: '优先检查极客日报、文章和招聘是否需要更新，再处理站点页面。',
  },
  {
    title: '站点维护入口',
    detail: '站点页面、媒体库和工作人员设置集中在后台即可完成，不需要跳多个系统。',
  },
  {
    title: '发布前检查',
    detail: '发布内容前，确认公开地址、摘要、标签与封面资源是否已经补齐。',
  },
] as const;

onMounted(async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const payload = await adminFetch<{ stats: AdminDashboardStats }>('/api/admin/v1/dashboard');
    stats.value = payload.stats;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载仪表盘数据。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>仪表盘</h2>
        <p>今日工作台</p>
      </div>

      <div class="page-actions">
        <RouterLink class="button-link" to="/site">编辑站点</RouterLink>
        <RouterLink class="button-link button-primary" to="/geekdaily/new">新增极客日报</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger">
      <p>{{ errorMessage }}</p>
    </div>

    <div v-else-if="loading" class="panel">
      <p>正在读取后台概览数据…</p>
    </div>

    <template v-else>
      <div class="panel-grid dashboard-stat-grid">
        <article v-for="item in cards" :key="item.label" class="panel stat-panel dashboard-stat-card">
          <span class="dashboard-stat-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
        </article>
      </div>

      <div class="dashboard-workspace-grid">
        <article class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>快捷入口</h3>
            <div class="panel-meta">常用模块</div>
          </div>

          <div class="dashboard-quick-links">
            <RouterLink v-for="item in quickLinks" :key="item.to" class="dashboard-quick-link" :to="item.to">
              <strong>{{ item.title }}</strong>
              <span>{{ item.detail }}</span>
            </RouterLink>
          </div>
        </article>

        <div class="stacked-gap">
          <article class="panel stacked-gap">
            <div class="panel-toolbar">
              <h3>工作提示</h3>
              <div class="panel-meta">值班节奏</div>
            </div>

            <div class="dashboard-guidance-list">
              <article v-for="item in guidanceItems" :key="item.title" class="insight-card">
                <strong>{{ item.title }}</strong>
                <p>{{ item.detail }}</p>
              </article>
            </div>
          </article>

          <article class="panel stacked-gap">
            <div class="panel-toolbar">
              <h3>内容概览</h3>
              <div class="panel-meta">核心模块分布</div>
            </div>

            <div class="dashboard-insight-grid">
              <article v-for="item in workflowInsights" :key="item.title" class="insight-card">
                <span class="compact-stat-label">{{ item.title }}</span>
                <strong>{{ item.value }}</strong>
                <p>{{ item.detail }}</p>
              </article>
            </div>
          </article>
        </div>
      </div>
    </template>
  </section>
</template>
