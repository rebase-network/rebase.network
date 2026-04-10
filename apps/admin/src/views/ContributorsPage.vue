<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contributorActivityStatusOptions,
  defaultAdminPageSize,
  type AdminContributorListItem,
  type AdminContributorRoleRecord,
  type PaginatedMeta,
} from '@rebase/shared';

import PaginationBar from '../components/PaginationBar.vue';
import { adminFetch, adminFetchWithMeta } from '../lib/api';
import { formatContentStatus, formatContributorActivityStatus, formatDateTime } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

const contributors = ref<AdminContributorListItem[]>([]);
const roles = ref<AdminContributorRoleRecord[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const contributorPage = ref(1);
const filters = reactive({ activityStatus: 'all' });

const totalContributors = computed(() => pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? contributors.value.length);
const publishedRoleCount = computed(() => roles.value.filter((item) => item.status === 'published').length);

const buildContributorsRequestPath = () => {
  const params = new URLSearchParams({
    page: String(contributorPage.value),
    pageSize: String(defaultAdminPageSize),
  });

  if (filters.activityStatus !== 'all') {
    params.set('activityStatus', filters.activityStatus);
  }

  return `/api/admin/v1/contributors?${params.toString()}`;
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [nextRoles, nextContributors] = await Promise.all([
      adminFetch<AdminContributorRoleRecord[]>('/api/admin/v1/contributors/roles'),
      adminFetchWithMeta<AdminContributorListItem[], PaginatedMeta>(buildContributorsRequestPath()),
    ]);
    roles.value = nextRoles;
    contributors.value = nextContributors.data;
    pagination.value = nextContributors.meta ?? null;
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载贡献者数据。';
  } finally {
    loading.value = false;
  }
};

const goToContributorPage = (nextPage: number) => {
  contributorPage.value = nextPage;
};

watch(
  () => filters.activityStatus,
  () => {
    if (contributorPage.value === 1) {
      void loadData();
      return;
    }

    contributorPage.value = 1;
  },
);

watch(contributorPage, () => {
  void loadData();
});

onMounted(() => void loadData());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>社区贡献者</h2>
        <p>贡献者与角色</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/contributors/roles">管理角色</RouterLink>
        <RouterLink class="button-link button-primary" to="/contributors/new">新增贡献者</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载贡献者数据…</p></div>

    <template v-else>
      <div class="panel-grid panel-grid-2">
        <section class="panel compact-summary-card">
          <div class="panel-toolbar">
            <div>
              <h3>列表概览</h3>
              <div class="panel-meta">只保留贡献者总数，避免和列表信息重复。</div>
            </div>
          </div>
          <div class="compact-summary-value">
            <strong>{{ totalContributors }}</strong>
            <span>贡献者总数</span>
          </div>
        </section>

        <section class="panel compact-summary-card">
          <div class="panel-toolbar">
            <div>
              <h3>角色概览</h3>
              <div class="panel-meta">角色管理改为单独页面，和贡献者列表解耦。</div>
            </div>
          </div>
          <div class="compact-summary-value">
            <strong>{{ publishedRoleCount }} / {{ roles.length }}</strong>
            <span>已启用角色</span>
          </div>
        </section>
      </div>

      <section class="panel stacked-gap">
        <div class="panel-toolbar">
          <div>
            <h3>贡献者列表</h3>
            <div class="panel-meta">集中维护头像、介绍与角色归属</div>
          </div>
          <div class="panel-meta">{{ pagination?.totalItems ?? contributors.length }} 人</div>
        </div>

        <div v-if="contributors.length === 0" class="empty-state-card"><p>暂时还没有贡献者。</p></div>

        <div v-else class="table-panel">
          <table class="data-table dense-table">
            <thead>
              <tr>
                <th>贡献者</th>
                <th>角色</th>
                <th>状态</th>
                <th class="activity-filter-column">
                  <div class="table-filter-head">
                    <span>活跃状态</span>
                    <select v-model="filters.activityStatus" aria-label="按活跃状态筛选贡献者">
                      <option value="all">全部</option>
                      <option v-for="option in contributorActivityStatusOptions" :key="option.value" :value="option.value">
                        {{ formatContributorActivityStatus(option.value) }}
                      </option>
                    </select>
                  </div>
                </th>
                <th>更新时间</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in contributors" :key="row.id">
                <td>
                  <div class="table-cell-stack">
                    <strong>{{ row.name }}</strong>
                    <div class="muted-row">{{ row.headline }}</div>
                  </div>
                </td>
                <td>{{ row.roleNames.join('、') || '未分配角色' }}</td>
                <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
                <td><span class="status-pill" :class="{ 'status-pill-muted': row.activityStatus === 'inactive' }">{{ formatContributorActivityStatus(row.activityStatus) }}</span></td>
                <td>{{ formatDateTime(row.updatedAt) }}</td>
                <td class="table-actions-cell">
                  <div class="table-action-list">
                    <RouterLink class="table-link" :to="`/contributors/${row.id}/edit`">编辑</RouterLink>
                    <a class="table-link" :href="getPublicSiteUrl(`/contributors#${row.slug}`)" target="_blank" rel="noreferrer">前台定位</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <PaginationBar :meta="pagination" :current-count="contributors.length" item-label="人" :loading="loading" @change-page="goToContributorPage" />
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.compact-summary-card {
  gap: 0.58rem;
}

.compact-summary-value {
  display: grid;
  gap: 0.16rem;
  padding: 0.72rem 0.86rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.74);
}

.compact-summary-value strong {
  font-size: clamp(1.45rem, 1.5vw + 1rem, 1.9rem);
  line-height: 1;
}

.compact-summary-value span {
  color: var(--muted);
  font-size: 0.8rem;
}

.table-filter-head {
  display: grid;
  gap: 0.2rem;
}

.table-filter-head span {
  display: block;
}

.table-filter-head select {
  min-width: 0;
  padding: 0.28rem 0.42rem;
  font-size: 0.78rem;
  font-weight: 600;
}

.activity-filter-column {
  min-width: 132px;
}

.status-pill-muted {
  background: rgba(148, 163, 184, 0.14);
  color: rgba(71, 85, 105, 0.92);
}

@media (max-width: 1200px) {
  .compact-summary-value strong {
    font-size: 1.55rem;
  }
}
</style>
