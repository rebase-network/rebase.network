<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { contentStatusOptions, type AdminGeekDailyListItem } from '@rebase/shared';

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

onMounted(async () => {
  try {
    rows.value = await adminFetch<AdminGeekDailyListItem[]>('/api/admin/v1/geekdaily');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载 GeekDaily 列表。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>GeekDaily</h2>
        <p>以 episode 为核心维护每日推荐内容与公开归档页面。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/geekdaily/new">新增一期</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载 GeekDaily 列表…</p></div>

    <template v-else>
      <div class="panel filter-panel">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>搜索</span>
            <input v-model="filters.query" type="search" placeholder="搜索标题、episode 编号或 slug" />
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

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有 GeekDaily 内容。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table">
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
                  <div class="muted-row">episode {{ row.episodeNumber }}</div>
                </div>
              </td>
              <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
              <td>{{ row.itemCount }}</td>
              <td>{{ formatDateTime(row.publishedAt) }}</td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/geekdaily/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="`/geekdaily/episode-${row.episodeNumber}`" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
