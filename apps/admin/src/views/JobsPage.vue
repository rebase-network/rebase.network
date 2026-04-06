<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import { contentStatusOptions, type AdminJobListItem } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatBoolean, formatContentStatus, formatDateTime } from '../lib/format';

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
        <h2>Who-Is-Hiring</h2>
        <p>维护社区内招聘岗位、投递方式和到期状态。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/jobs/new">新增招聘</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载招聘列表…</p></div>

    <template v-else>
      <div class="panel filter-panel">
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
      </div>

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有招聘信息。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table">
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
                  <a class="table-link" :href="`/who-is-hiring/${row.slug}`" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
