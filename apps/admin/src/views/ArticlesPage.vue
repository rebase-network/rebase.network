<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { contentStatusOptions, type AdminArticleListItem } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatContentStatus, formatDateTime } from '../lib/format';

const rows = ref<AdminArticleListItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const filters = reactive({
  query: '',
  status: 'all',
});

const filteredRows = computed(() => {
  const query = filters.query.trim().toLowerCase();
  return rows.value.filter((row) => {
    const matchesQuery = query.length === 0 || [row.title, row.slug, ...row.authorNames].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = filters.status === 'all' || row.status === filters.status;
    return matchesQuery && matchesStatus;
  });
});

const articleStats = computed(() => [
  {
    label: '文章总数',
    value: rows.value.length,
    detail: '全部内容',
  },
  {
    label: '筛选结果',
    value: filteredRows.value.length,
    detail: '当前列表',
  },
  {
    label: '已发布',
    value: rows.value.filter((row) => row.status === 'published').length,
    detail: '对外可见',
  },
  {
    label: '草稿中',
    value: rows.value.filter((row) => row.status === 'draft').length,
    detail: '待继续编辑',
  },
]);

onMounted(async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    rows.value = await adminFetch<AdminArticleListItem[]>('/api/admin/v1/articles');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载文章列表。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>社区文章</h2>
        <p>文章列表</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/articles/new">新建文章</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载文章列表…</p></div>

    <template v-else>
      <div class="compact-stat-grid compact-stat-grid-4">
        <article v-for="item in articleStats" :key="item.label" class="compact-stat-card">
          <span class="compact-stat-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.detail }}</small>
        </article>
      </div>

      <div class="panel filter-panel">
        <div class="panel-toolbar">
          <h3>筛选</h3>
          <div class="panel-meta">{{ filteredRows.length }} 篇文章</div>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>搜索</span>
            <input v-model="filters.query" type="search" placeholder="搜索标题、slug 或作者" />
          </label>
          <label class="field">
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>
      </div>

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有文章。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table">
          <thead>
            <tr>
              <th>标题</th>
              <th>状态</th>
              <th>作者</th>
              <th>发布时间</th>
              <th>更新时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.title }}</strong>
                  <div class="muted-row">/{{ row.slug }}</div>
                </div>
              </td>
              <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
              <td>{{ row.authorNames.join('、') || '未填写作者' }}</td>
              <td>{{ formatDateTime(row.publishedAt) }}</td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/articles/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="`/articles/${row.slug}`" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
