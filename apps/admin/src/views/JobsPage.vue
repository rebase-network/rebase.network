<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  defaultAdminPageSize,
  type AdminJobListItem,
  type ContentStatus,
  type PaginatedMeta,
} from '@rebase/shared';

import PaginationBar from '../components/PaginationBar.vue';
import { adminFetchWithMeta } from '../lib/api';
import { formatBoolean, formatContentStatus, formatDateTime } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

const rows = ref<AdminJobListItem[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const page = ref(1);
const statusFilterOpen = ref(false);
const statusFilterRef = ref<HTMLElement | null>(null);

type JobStatusFilterValue = 'all' | ContentStatus;

const filters = reactive<{ query: string; status: JobStatusFilterValue }>({
  query: '',
  status: 'all',
});

const buildRequestPath = () => {
  const params = new URLSearchParams({
    page: String(page.value),
    pageSize: String(defaultAdminPageSize),
  });

  if (filters.query.trim()) {
    params.set('query', filters.query.trim());
  }

  if (filters.status !== 'all') {
    params.set('status', filters.status);
  }

  return `/api/admin/v1/jobs?${params.toString()}`;
};

const totalJobs = computed(() => pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? rows.value.length);
const filteredJobs = computed(() => pagination.value?.totalItems ?? rows.value.length);
const statusFilterOptions = computed(() => [
  { value: 'all' as JobStatusFilterValue, label: '全部' },
  ...contentStatusOptions.map((option) => ({
    value: option.value as JobStatusFilterValue,
    label: formatContentStatus(option.value),
  })),
]);
const activeStatusFilterLabel = computed(() =>
  filters.status === 'all' ? '' : formatContentStatus(filters.status),
);

const loadRows = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const response = await adminFetchWithMeta<AdminJobListItem[], PaginatedMeta>(buildRequestPath());
    rows.value = response.data;
    pagination.value = response.meta ?? null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载招聘列表。';
  } finally {
    loading.value = false;
  }
};

const goToPage = (nextPage: number) => {
  page.value = nextPage;
};

const setStatusFilter = (value: JobStatusFilterValue) => {
  filters.status = value;
  statusFilterOpen.value = false;
};

const toggleStatusFilter = () => {
  statusFilterOpen.value = !statusFilterOpen.value;
};

const closeStatusFilter = () => {
  statusFilterOpen.value = false;
};

const handlePointerDown = (event: PointerEvent) => {
  if (!statusFilterOpen.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (!statusFilterRef.value?.contains(target)) {
    closeStatusFilter();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeStatusFilter();
  }
};

watch([() => filters.query, () => filters.status], () => {
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
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleEscape);
  void loadRows();
});

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', handlePointerDown);
  document.removeEventListener('keydown', handleEscape);
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
      <section class="panel list-toolbar-panel">
        <div class="list-toolbar-row">
          <div class="list-toolbar-summary">
            <span class="list-toolbar-label">内容概览</span>
            <div class="panel-meta">共 {{ totalJobs }} 条 / 当前 {{ filteredJobs }} 条 / 第 {{ pagination?.page ?? 1 }} 页</div>
          </div>

          <label class="list-toolbar-search" for="job-search">
            <span class="list-toolbar-label">搜索</span>
            <input id="job-search" v-model="filters.query" type="search" placeholder="搜索团队、岗位或 slug" />
          </label>
        </div>
      </section>

      <div class="panel table-panel">
        <table class="data-table dense-table">
          <thead>
            <tr>
              <th>团队 / 岗位</th>
              <th>编辑</th>
              <th class="status-filter-column">
                <div ref="statusFilterRef" class="table-filter-menu">
                  <button
                    class="table-filter-trigger"
                    :class="{ 'is-active': filters.status !== 'all', 'is-open': statusFilterOpen }"
                    type="button"
                    aria-haspopup="menu"
                    :aria-expanded="statusFilterOpen ? 'true' : 'false'"
                    @click="toggleStatusFilter"
                  >
                    <span class="table-filter-trigger-label">状态</span>
                    <span v-if="activeStatusFilterLabel" class="table-filter-badge">{{ activeStatusFilterLabel }}</span>
                    <svg class="table-filter-arrow" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 6.5 8 10.5l4-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
                    </svg>
                  </button>

                  <div v-if="statusFilterOpen" class="table-filter-popover" role="menu" aria-label="按状态筛选招聘信息">
                    <button
                      v-for="option in statusFilterOptions"
                      :key="option.value"
                      class="table-filter-option"
                      :class="{ 'is-selected': option.value === filters.status }"
                      type="button"
                      role="menuitemradio"
                      :aria-checked="option.value === filters.status ? 'true' : 'false'"
                      @click="setStatusFilter(option.value)"
                    >
                      <span>{{ option.label }}</span>
                      <span v-if="option.value === filters.status" class="table-filter-check">✓</span>
                    </button>
                  </div>
                </div>
              </th>
              <th>远程</th>
              <th>发布时间</th>
              <th>更新时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td class="table-empty-row" colspan="7">当前筛选条件下没有招聘信息，请调整搜索或状态筛选。</td>
            </tr>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.companyName }}</strong>
                  <div class="muted-row">{{ row.roleTitle }}</div>
                </div>
              </td>
              <td>{{ row.editorName || '—' }}</td>
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

        <PaginationBar
          v-if="pagination && pagination.totalItems > 0"
          :meta="pagination"
          :current-count="rows.length"
          item-label="条"
          :loading="loading"
          @change-page="goToPage"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.list-toolbar-panel {
  padding-block: 0.72rem;
}

.list-toolbar-row {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.72rem;
  align-items: center;
}

.list-toolbar-summary {
  grid-column: 1;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-height: 2.5rem;
}

.list-toolbar-label {
  flex: none;
  font-size: 0.9rem;
  font-weight: 700;
}

.list-toolbar-search {
  grid-column: 3;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
  min-height: 2.5rem;
}

.list-toolbar-search .list-toolbar-label {
  font-size: 0.96rem;
  font-weight: 800;
}

.list-toolbar-search input {
  width: 100%;
}

.table-empty-row {
  padding: 1rem 0.45rem;
  color: var(--muted);
  text-align: center;
}

.table-filter-menu {
  position: relative;
}

.table-filter-trigger {
  display: inline-flex;
  align-items: center;
  gap: 0.32rem;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--text);
  font: inherit;
  cursor: pointer;
}

.table-filter-trigger-label {
  font-weight: 700;
}

.table-filter-trigger:hover .table-filter-trigger-label,
.table-filter-trigger.is-active .table-filter-trigger-label {
  color: var(--accent-strong);
}

.table-filter-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.18rem;
  padding: 0.02rem 0.4rem;
  border-radius: 999px;
  background: rgba(15, 109, 100, 0.1);
  color: var(--accent-strong);
  font-size: 0.72rem;
  font-weight: 700;
}

.table-filter-arrow {
  width: 0.82rem;
  height: 0.82rem;
  color: var(--muted);
  transition: transform 0.18s ease;
}

.table-filter-trigger.is-open .table-filter-arrow {
  transform: rotate(180deg);
}

.table-filter-popover {
  position: absolute;
  top: calc(100% + 0.42rem);
  left: 0;
  z-index: 20;
  display: grid;
  min-width: 148px;
  padding: 0.3rem;
  border: 1px solid rgba(15, 109, 100, 0.12);
  border-radius: 12px;
  background: rgba(255, 252, 247, 0.96);
  box-shadow:
    0 12px 28px rgba(15, 23, 42, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
}

.table-filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  width: 100%;
  padding: 0.45rem 0.52rem;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.table-filter-option:hover,
.table-filter-option.is-selected {
  background: rgba(15, 109, 100, 0.08);
}

.table-filter-check {
  color: var(--accent-strong);
  font-size: 0.78rem;
  font-weight: 800;
}

.status-filter-column {
  min-width: 154px;
}

@media (max-width: 1100px) {
  .list-toolbar-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .list-toolbar-search {
    grid-column: auto;
  }

  .list-toolbar-summary {
    flex-wrap: wrap;
  }
}
</style>
