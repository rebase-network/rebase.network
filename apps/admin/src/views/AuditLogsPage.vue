<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import type { AdminAuditRecord } from '@rebase/shared';

import { adminFetch } from '../lib/api';
import { formatAuditAction, formatAuditSummary, formatAuditTargetType, formatDateTime } from '../lib/format';

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

const auditStats = computed(() => {
  const today = new Date().toDateString();
  const actorCount = new Set(rows.value.map((row) => row.actorEmail ?? row.actorDisplayName ?? 'system')).size;

  return [
    {
      label: '日志总数',
      value: rows.value.length,
      detail: '全部审计记录',
    },
    {
      label: '筛选结果',
      value: filteredRows.value.length,
      detail: '当前搜索结果',
    },
    {
      label: '今日操作',
      value: rows.value.filter((row) => new Date(row.createdAt).toDateString() === today).length,
      detail: '当天新增记录',
    },
    {
      label: '操作人员',
      value: actorCount,
      detail: '涉及账号数',
    },
  ];
});

const emptyGuides = [
  {
    title: '会记录什么',
    detail: '内容发布、更新、工作人员账号变更等关键后台操作都会进入审计日志。',
  },
  {
    title: '如何使用',
    detail: '先按动作或目标类型搜索，再结合操作者和时间快速定位问题来源。',
  },
  {
    title: '当前为空时',
    detail: '说明当前样例数据没有操作历史；一旦后台发生写入动作，这里会逐步累积记录。',
  },
] as const;

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
      <div class="compact-stat-grid compact-stat-grid-4">
        <article v-for="item in auditStats" :key="item.label" class="compact-stat-card">
          <span class="compact-stat-label">{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small>{{ item.detail }}</small>
        </article>
      </div>

      <div class="panel filter-panel">
        <div class="panel-toolbar">
          <h3>筛选</h3>
          <div class="panel-meta">{{ filteredRows.length }} 条记录</div>
        </div>
        <label class="field compact-search-field">
          <span>搜索</span>
          <input v-model="query" type="search" placeholder="搜索动作、目标类型、摘要或操作者" />
        </label>
      </div>

      <div v-if="filteredRows.length === 0" class="stacked-gap">
        <div class="panel empty-state-card">
          <p>{{ rows.length === 0 ? '当前还没有审计记录。' : '当前没有匹配的审计记录。' }}</p>
        </div>

        <div class="panel-grid panel-grid-3">
          <article v-for="item in emptyGuides" :key="item.title" class="insight-card">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table">
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
                  <strong>{{ formatAuditAction(row.action) }}</strong>
                  <div class="muted-row">{{ row.action }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ formatAuditTargetType(row.targetType) }}</strong>
                  <div class="muted-row">{{ row.targetId ?? '未绑定目标 id' }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.actorDisplayName ?? '系统' }}</strong>
                  <div class="muted-row">{{ row.actorEmail ?? '—' }}</div>
                </div>
              </td>
              <td>{{ formatAuditSummary(row.summary) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </section>
</template>
