<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import { defaultAdminPageSize, type AdminAuditRecord, type PaginatedMeta } from '@rebase/shared';

import PaginationBar from '../components/PaginationBar.vue';
import { adminFetchWithMeta } from '../lib/api';
import { formatAuditAction, formatAuditSummary, formatAuditTargetType, formatDateTime } from '../lib/format';

const rows = ref<AdminAuditRecord[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const query = ref('');
const page = ref(1);

const auditStats = computed(() => {
  const today = new Date().toDateString();
  const actorCount = new Set(rows.value.map((row) => row.actorEmail ?? row.actorDisplayName ?? 'system')).size;

  return [
    {
      label: '日志总数',
      value: pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? rows.value.length,
      detail: '全部审计记录',
    },
    {
      label: '筛选结果',
      value: pagination.value?.totalItems ?? rows.value.length,
      detail: '当前搜索结果',
    },
    {
      label: '当前页',
      value: rows.value.length,
      detail: `第 ${pagination.value?.page ?? 1} 页`,
    },
    {
      label: '本页操作者',
      value: actorCount,
      detail: rows.value.filter((row) => new Date(row.createdAt).toDateString() === today).length ? '含今日记录' : '当前页统计',
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

const buildRequestPath = () => {
  const params = new URLSearchParams({
    page: String(page.value),
    pageSize: String(defaultAdminPageSize),
  });

  if (query.value.trim()) {
    params.set('query', query.value.trim());
  }

  return `/api/admin/v1/audit?${params.toString()}`;
};

const loadRows = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await adminFetchWithMeta<AdminAuditRecord[], PaginatedMeta>(buildRequestPath());
    rows.value = response.data;
    pagination.value = response.meta ?? null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载审计日志。';
  } finally {
    loading.value = false;
  }
};

const goToPage = (nextPage: number) => {
  page.value = nextPage;
};

watch(query, () => {
  if (page.value === 1) {
    void loadRows();
    return;
  }

  page.value = 1;
});

watch(page, () => {
  void loadRows();
});

onMounted(() => {
  void loadRows();
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
      <div class="panel-grid panel-grid-2">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>日志概览</h3>
              <div class="panel-meta">查看操作密度与涉及账号</div>
            </div>
            <div class="panel-meta">{{ pagination?.totalItems ?? rows.length }} 条记录</div>
          </div>

          <div class="compact-stat-grid compact-stat-grid-4">
            <article v-for="item in auditStats" :key="item.label" class="compact-stat-card">
              <span class="compact-stat-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.detail }}</small>
            </article>
          </div>
        </section>

        <section class="panel filter-panel">
          <div class="panel-toolbar">
            <h3>筛选</h3>
            <div class="panel-meta">{{ pagination?.totalItems ?? rows.length }} 条记录</div>
          </div>
          <label class="field compact-search-field">
            <span>搜索</span>
            <input v-model="query" type="search" placeholder="搜索动作、目标类型、摘要或操作者" />
          </label>
          <div class="panel-meta">建议优先搜索动作关键词、目标类型或操作者邮箱。</div>
        </section>
      </div>

      <div v-if="rows.length === 0" class="stacked-gap">
        <div class="panel empty-state-card">
          <p>{{ pagination?.totalAllItems === 0 ? '当前还没有审计记录。' : '当前没有匹配的审计记录。' }}</p>
        </div>

        <div class="panel-grid panel-grid-3">
          <article v-for="item in emptyGuides" :key="item.title" class="insight-card">
            <strong>{{ item.title }}</strong>
            <p>{{ item.detail }}</p>
          </article>
        </div>
      </div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table admin-list-table admin-list-table-secondary admin-list-table-secondary-wide">
          <colgroup>
            <col class="admin-col-audit-time" />
            <col class="admin-col-audit-action" />
            <col class="admin-col-audit-target" />
            <col class="admin-col-audit-actor" />
            <col />
          </colgroup>
          <thead>
            <tr>
              <th class="admin-col-audit-time">时间</th>
              <th class="admin-col-audit-action">动作</th>
              <th class="admin-col-audit-target">目标</th>
              <th class="admin-col-audit-actor">操作者</th>
              <th>摘要</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td class="admin-list-date-cell"><time class="admin-list-date" :datetime="row.createdAt">{{ formatDateTime(row.createdAt) }}</time></td>
              <td>
                <div class="table-cell-stack admin-list-primary">
                  <strong class="admin-list-title">{{ formatAuditAction(row.action) }}</strong>
                  <div class="muted-row admin-list-subtitle">{{ row.action }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack admin-list-primary">
                  <strong class="admin-list-title">{{ formatAuditTargetType(row.targetType) }}</strong>
                  <div class="muted-row admin-list-subtitle">{{ row.targetId ?? '未绑定目标 id' }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack admin-list-primary">
                  <strong class="admin-list-title">{{ row.actorDisplayName ?? '系统' }}</strong>
                  <div class="muted-row admin-list-subtitle">{{ row.actorEmail ?? '—' }}</div>
                </div>
              </td>
              <td><div class="admin-list-summary">{{ formatAuditSummary(row.summary) }}</div></td>
            </tr>
          </tbody>
        </table>

        <PaginationBar :meta="pagination" :current-count="rows.length" item-label="条" :loading="loading" @change-page="goToPage" />
      </div>
    </template>
  </section>
</template>
