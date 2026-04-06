<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { contentStatusOptions, getGeekDailyEpisodePath, type AdminGeekDailyListItem } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatContentStatus, formatDateTime } from '../lib/format';

const rows = ref<AdminGeekDailyListItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const filters = reactive({ query: '', status: 'all' });

const filteredRows = computed(() => {
  const query = filters.query.trim().toLowerCase();
  return rows.value.filter((row) => {
    const matchesQuery = query.length === 0 || [row.title, row.slug, String(row.episodeNumber)].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = filters.status === 'all' || row.status === filters.status;
    return matchesQuery && matchesStatus;
  });
});

const geekdailyStats = computed(() => [
  {
    label: '期数总数',
    value: rows.value.length,
    detail: '全部期刊',
  },
  {
    label: '筛选结果',
    value: filteredRows.value.length,
    detail: '当前列表',
  },
  {
    label: '收录条目',
    value: rows.value.reduce((total, row) => total + row.itemCount, 0),
    detail: '累计推荐内容',
  },
  {
    label: '最新期数',
    value: rows.value.reduce((latest, row) => Math.max(latest, row.episodeNumber), 0),
    detail: '当前最高编号',
  },
]);

onMounted(async () => {
  try {
    rows.value = await adminFetch<AdminGeekDailyListItem[]>('/api/admin/v1/geekdaily');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载极客日报列表。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>极客日报</h2>
        <p>期刊列表</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/geekdaily/new">新增一期</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载极客日报列表…</p></div>

    <template v-else>
      <div class="panel-grid panel-grid-2">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>期刊概览</h3>
              <div class="panel-meta">查看期数库存与累计推荐条目</div>
            </div>
            <div class="panel-meta">{{ rows.length }} 期内容</div>
          </div>

          <div class="compact-stat-grid compact-stat-grid-4">
            <article v-for="item in geekdailyStats" :key="item.label" class="compact-stat-card">
              <span class="compact-stat-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.detail }}</small>
            </article>
          </div>
        </section>

        <section class="panel filter-panel">
          <div class="panel-toolbar">
            <h3>筛选</h3>
            <div class="panel-meta">{{ filteredRows.length }} 期内容</div>
          </div>
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>搜索</span>
              <input v-model="filters.query" type="search" placeholder="搜索标题、期数或 slug" />
            </label>
            <label class="field">
              <span>状态</span>
              <select v-model="filters.status">
                <option value="all">全部状态</option>
                <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
          </div>
        </section>
      </div>

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有极客日报内容。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table">
          <thead>
            <tr>
              <th>期数</th>
              <th>状态</th>
              <th>条目数</th>
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
                  <div class="muted-row">第 {{ row.episodeNumber }} 期</div>
                </div>
              </td>
              <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
              <td>{{ row.itemCount }}</td>
              <td>{{ formatDateTime(row.publishedAt) }}</td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/geekdaily/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="getGeekDailyEpisodePath(row.episodeNumber)" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
