<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { AdminAuditRecord } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatDateTime } from '../lib/format';

const rows = ref<AdminAuditRecord[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const query = ref('');

const filteredRows = computed(() => {
  const value = query.value.trim().toLowerCase();

  return rows.value.filter((row) => {
    if (!value) {
      return true;
    }

    return [row.action, row.targetType, row.summary, row.actorDisplayName ?? '', row.actorEmail ?? ''].some((item) =>
      item.toLowerCase().includes(value),
    );
  });
});

onMounted(async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    rows.value = await adminFetch<AdminAuditRecord[]>('/api/admin/v1/audit');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载审计日志。';
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header">
      <div>
        <h2>审计日志</h2>
        <p>关键操作记录</p>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-else-if="loading" class="panel"><p>正在加载审计日志…</p></div>

    <template v-else>
      <div class="panel filter-panel">
        <label class="field compact-search-field">
          <span>搜索</span>
          <input v-model="query" type="search" placeholder="搜索动作、目标类型、摘要或操作者" />
        </label>
      </div>

      <div v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前没有匹配的审计记录。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>动作</th>
              <th>目标</th>
              <th>操作者</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>{{ formatDateTime(row.createdAt) }}</td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.action }}</strong>
                  <div class="muted-row">{{ row.targetId ?? '—' }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.targetType }}</strong>
                  <div class="muted-row">{{ row.targetId ?? '未绑定目标 id' }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.actorDisplayName ?? 'system' }}</strong>
                  <div class="muted-row">{{ row.actorEmail ?? '—' }}</div>
                </div>
              </td>
              <td>{{ row.summary }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
