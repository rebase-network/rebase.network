<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  defaultAdminPageSize,
  getGeekDailyEpisodePath,
  type AdminGeekDailyListItem,
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
const filters = reactive({ query: '', status: 'all' });

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
  void loadRows();
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
      <section class="panel stacked-gap-tight geekdaily-toolbar-panel">
        <div class="panel-toolbar">
          <div>
            <h3>筛选与定位</h3>
            <div class="panel-meta">共 {{ totalEpisodes }} 期，当前结果 {{ filteredEpisodes }} 期</div>
          </div>
          <div class="panel-meta">第 {{ pagination?.page ?? 1 }} 页</div>
        </div>

        <div class="field-grid field-grid-2 field-grid-compact geekdaily-filter-grid">
          <label class="field">
            <span>搜索</span>
            <input v-model="filters.query" type="search" placeholder="搜索标题、期数或 slug" />
          </label>
          <label class="field geekdaily-filter-status">
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
        </div>
      </section>

      <div v-if="rows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有极客日报内容。</p></div>

      <div v-else class="panel table-panel">
        <table class="data-table dense-table">
          <thead>
            <tr>
              <th>期数</th>
              <th>编辑</th>
              <th>状态</th>
              <th>条目数</th>
              <th>发布时间</th>
              <th>更新时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
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
              <td>{{ formatDateTime(row.publishedAt) }}</td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <RouterLink class="table-link" :to="`/geekdaily/${row.id}/edit`">编辑</RouterLink>
                  <a class="table-link" :href="getPublicSiteUrl(getGeekDailyEpisodePath(row.episodeNumber))" target="_blank" rel="noreferrer">前台预览</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <PaginationBar :meta="pagination" :current-count="rows.length" item-label="期" :loading="loading" @change-page="goToPage" />
      </div>
    </template>
  </section>
</template>

<style scoped>
.geekdaily-toolbar-panel {
  gap: 0.58rem;
}

.geekdaily-filter-grid {
  align-items: end;
}

.geekdaily-filter-grid .field {
  gap: 0.24rem;
}

.geekdaily-filter-grid .field span {
  font-size: 0.82rem;
}

.geekdaily-filter-status {
  max-width: 220px;
}

@media (max-width: 1100px) {
  .geekdaily-filter-status {
    max-width: none;
  }
}
</style>
