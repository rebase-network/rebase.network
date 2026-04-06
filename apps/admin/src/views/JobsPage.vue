<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { contentStatusOptions, type AdminJobListItem } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatBoolean, formatContentStatus, formatDateTime } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

const rows = ref<AdminJobListItem[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const filters = reactive({ query: '', status: 'all' });

const filteredRows = computed(() => {
  const query = filters.query.trim().toLowerCase();
  return rows.value.filter((row) => {
    const matchesQuery = query.length === 0 || [row.companyName, row.roleTitle, row.slug].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = filters.status === 'all' || row.status === filters.status;
    return matchesQuery && matchesStatus;
  });
});

const jobStats = computed(() => [
  {
    label: '招聘总数',
    value: rows.value.length,
    detail: '全部岗位',
  },
  {
    label: '筛选结果',
    value: filteredRows.value.length,
    detail: '当前列表',
  },
  {
    label: '支持远程',
    value: rows.value.filter((row) => row.supportsRemote).length,
    detail: '可远程协作',
  },
  {
    label: '已发布',
    value: rows.value.filter((row) => row.status === 'published').length,
    detail: '对外可见',
  },
]);

onMounted(async () => {
  try {
    rows.value = await adminFetch<AdminJobListItem[]>('/api/admin/v1/jobs');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载招聘列表。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>招聘信息</h2>
        <p>Who-Is-Hiring 列表</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/jobs/new">新增招聘</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载招聘列表…</p></div>

    <template v-else>
      <div class="panel-grid panel-grid-2">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>岗位概览</h3>
              <div class="panel-meta">查看招聘库存与远程分布</div>
            </div>
            <div class="panel-meta">{{ rows.length }} 条招聘</div>
          </div>

          <div class="compact-stat-grid compact-stat-grid-4">
            <article v-for="item in jobStats" :key="item.label" class="compact-stat-card">
              <span class="compact-stat-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.detail }}</small>
            </article>
          </div>
        </section>

        <section class="panel filter-panel">
          <div class="panel-toolbar">
            <h3>筛选</h3>
            <div class="panel-meta">{{ filteredRows.length }} 条招聘</div>
          </div>
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>搜索</span>
              <input v-model="filters.query" type="search" placeholder="搜索团队、岗位或 slug" />
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

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有招聘信息。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table">
          <thead>
            <tr>
              <th>团队 / 岗位</th>
              <th>状态</th>
              <th>远程</th>
              <th>发布时间</th>
              <th>更新时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.companyName }}</strong>
                  <div class="muted-row">{{ row.roleTitle }}</div>
                </div>
              </td>
              <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
              <td>{{ formatBoolean(row.supportsRemote) }}</td>
              <td>{{ formatDateTime(row.publishedAt) }}</td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/jobs/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="getPublicSiteUrl(`/who-is-hiring/${row.slug}`)" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
