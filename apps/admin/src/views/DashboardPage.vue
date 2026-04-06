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
    { label: 'GeekDaily', value: value.geekdailyEpisodes },
    { label: '审计日志', value: value.auditLogs },
  ];
});

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
        <RouterLink class="button-link button-primary" to="/geekdaily/new">新增 GeekDaily</RouterLink>
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

      <article class="panel stacked-gap">
        <div class="panel-toolbar">
          <h3>快捷入口</h3>
          <div class="panel-meta">常用模块</div>
        </div>

        <div class="dashboard-quick-links">
          <RouterLink class="dashboard-quick-link" to="/articles">
            <strong>社区文章</strong>
            <span>草稿、发布、作者</span>
          </RouterLink>
          <RouterLink class="dashboard-quick-link" to="/jobs">
            <strong>Who-Is-Hiring</strong>
            <span>岗位与投递入口</span>
          </RouterLink>
          <RouterLink class="dashboard-quick-link" to="/events">
            <strong>社区活动</strong>
            <span>时间、地点、报名</span>
          </RouterLink>
          <RouterLink class="dashboard-quick-link" to="/contributors">
            <strong>贡献者</strong>
            <span>角色、头像、社交</span>
          </RouterLink>
          <RouterLink class="dashboard-quick-link" to="/staff">
            <strong>工作人员</strong>
            <span>账号与权限</span>
          </RouterLink>
          <RouterLink class="dashboard-quick-link" to="/audit-logs">
            <strong>审计日志</strong>
            <span>关键操作留痕</span>
          </RouterLink>
        </div>
      </article>
    </template>
  </section>
</template>
