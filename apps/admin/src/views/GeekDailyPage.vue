<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  defaultAdminPageSize,
  getGeekDailyEpisodePath,
  type AdminGeekDailyListItem,
  type ContentStatus,
  type PaginatedMeta,
} from '@rebase/shared';

import PaginationBar from '../components/PaginationBar.vue';
import { adminFetchWithMeta } from '../lib/api';
import { formatContentStatus, formatDateTime } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

const rows = ref<AdminGeekDailyListItem[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const page = ref(1);
const statusFilterOpen = ref(false);
const statusFilterRef = ref<HTMLElement | null>(null);

type GeekDailyStatusFilterValue = 'all' | ContentStatus;

const filters = reactive<{ query: string; status: GeekDailyStatusFilterValue }>({ query: '', status: 'all' });

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

  return `/api/admin/v1/geekdaily?${params.toString()}`;
};

const totalEpisodes = computed(() => pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? rows.value.length);
const filteredEpisodes = computed(() => pagination.value?.totalItems ?? rows.value.length);
const statusFilterOptions = computed(() => [
  { value: 'all' as GeekDailyStatusFilterValue, label: '全部' },
  ...contentStatusOptions.map((option) => ({
    value: option.value as GeekDailyStatusFilterValue,
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
    const response = await adminFetchWithMeta<AdminGeekDailyListItem[], PaginatedMeta>(buildRequestPath());
    rows.value = response.data;
    pagination.value = response.meta ?? null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载极客日报列表。';
  } finally {
    loading.value = false;
  }
};

const goToPage = (nextPage: number) => {
  page.value = nextPage;
};

const setStatusFilter = (value: GeekDailyStatusFilterValue) => {
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
      <section class="panel admin-list-toolbar-panel">
        <div class="admin-list-toolbar-row">
          <div class="admin-list-toolbar-summary">
            <div class="panel-meta">共 {{ totalEpisodes }} 期 / 当前 {{ filteredEpisodes }} 期 / 第 {{ pagination?.page ?? 1 }} 页</div>
          </div>

          <label class="admin-list-toolbar-search" for="geekdaily-search">
            <span class="admin-list-toolbar-label">搜索</span>
            <input id="geekdaily-search" v-model="filters.query" type="search" placeholder="搜索标题、期数或 slug" />
          </label>
        </div>
      </section>

      <div class="panel table-panel">
        <table class="data-table dense-table admin-list-table admin-list-table-geekdaily">
          <colgroup>
            <col />
            <col class="admin-col-editor" />
            <col class="admin-status-filter-column" />
            <col class="admin-col-count" />
            <col class="admin-col-time" />
            <col class="admin-col-updated" />
            <col class="admin-col-actions" />
          </colgroup>
          <thead>
            <tr>
              <th>期数</th>
              <th class="admin-col-editor">编辑</th>
              <th class="admin-status-filter-column">
                <div ref="statusFilterRef" class="admin-table-filter-menu">
                  <button
                    class="admin-table-filter-trigger"
                    :class="{ 'is-active': filters.status !== 'all', 'is-open': statusFilterOpen }"
                    type="button"
                    aria-haspopup="menu"
                    :aria-expanded="statusFilterOpen ? 'true' : 'false'"
                    @click="toggleStatusFilter"
                  >
                    <span class="admin-table-filter-trigger-label">状态</span>
                    <span v-if="activeStatusFilterLabel" class="admin-table-filter-badge">{{ activeStatusFilterLabel }}</span>
                    <svg class="admin-table-filter-arrow" viewBox="0 0 16 16" aria-hidden="true">
                      <path d="M4 6.5 8 10.5l4-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
                    </svg>
                  </button>

                  <div v-if="statusFilterOpen" class="admin-table-filter-popover" role="menu" aria-label="按状态筛选极客日报">
                    <button
                      v-for="option in statusFilterOptions"
                      :key="option.value"
                      class="admin-table-filter-option"
                      :class="{ 'is-selected': option.value === filters.status }"
                      type="button"
                      role="menuitemradio"
                      :aria-checked="option.value === filters.status ? 'true' : 'false'"
                      @click="setStatusFilter(option.value)"
                    >
                      <span>{{ option.label }}</span>
                      <span v-if="option.value === filters.status" class="admin-table-filter-check">✓</span>
                    </button>
                  </div>
                </div>
              </th>
              <th class="admin-col-count">条目数</th>
              <th class="admin-col-time">发布时间</th>
              <th class="admin-col-updated">更新时间</th>
              <th class="admin-col-actions"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="rows.length === 0">
              <td class="admin-table-empty-row" colspan="7">当前筛选条件下没有极客日报内容，请调整搜索或状态筛选。</td>
            </tr>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.title }}</strong>
                  <div class="muted-row">第 {{ row.episodeNumber }} 期</div>
                </div>
              </td>
              <td>{{ row.editors.length > 0 ? row.editors.join('、') : '—' }}</td>
              <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
              <td>{{ row.itemCount }}</td>
              <td class="admin-list-date-cell"><time class="admin-list-date" :datetime="row.publishedAt ?? undefined">{{ formatDateTime(row.publishedAt) }}</time></td>
              <td class="admin-list-date-cell"><time class="admin-list-date" :datetime="row.updatedAt">{{ formatDateTime(row.updatedAt) }}</time></td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/geekdaily/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="getPublicSiteUrl(getGeekDailyEpisodePath(row.episodeNumber))" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <PaginationBar
          v-if="pagination && pagination.totalItems > 0"
          :meta="pagination"
          :current-count="rows.length"
          item-label="期"
          :loading="loading"
          @change-page="goToPage"
        />
      </div>
    </template>
  </section>
</template>
