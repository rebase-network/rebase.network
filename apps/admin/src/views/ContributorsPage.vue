<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
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

type ActivityFilterValue = 'all' | 'active' | 'inactive';

const contributors = ref<AdminContributorListItem[]>([]);
const roles = ref<AdminContributorRoleRecord[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const contributorPage = ref(1);
const filters = reactive<{ activityStatus: ActivityFilterValue }>({ activityStatus: 'all' });
const activityFilterOpen = ref(false);
const activityFilterRef = ref<HTMLElement | null>(null);

const totalContributors = computed(() => pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? contributors.value.length);
const publishedRoleCount = computed(() => roles.value.filter((item) => item.status === 'published').length);
const activityFilterOptions = computed(() => [
  { value: 'all' as ActivityFilterValue, label: '全部' },
  ...contributorActivityStatusOptions.map((option) => ({
    value: option.value as ActivityFilterValue,
    label: formatContributorActivityStatus(option.value),
  })),
]);
const activeFilterLabel = computed(() =>
  filters.activityStatus === 'all' ? '' : formatContributorActivityStatus(filters.activityStatus),
);

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

const setActivityFilter = (value: ActivityFilterValue) => {
  filters.activityStatus = value;
  activityFilterOpen.value = false;
};

const toggleActivityFilter = () => {
  activityFilterOpen.value = !activityFilterOpen.value;
};

const closeActivityFilter = () => {
  activityFilterOpen.value = false;
};

const handlePointerDown = (event: PointerEvent) => {
  if (!activityFilterOpen.value) {
    return;
  }

  const target = event.target;
  if (!(target instanceof Node)) {
    return;
  }

  if (!activityFilterRef.value?.contains(target)) {
    closeActivityFilter();
  }
};

const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeActivityFilter();
  }
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

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDown);
  document.addEventListener('keydown', handleEscape);
  void loadData();
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
        <h2>社区贡献者</h2>
        <p>维护贡献者资料、活跃状态与角色归属</p>
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
          <div class="compact-summary-head">贡献者总数</div>
          <div class="compact-summary-value">
            <strong>{{ totalContributors }}</strong>
          </div>
        </section>

        <section class="panel compact-summary-card">
          <div class="compact-summary-head">角色概览</div>
          <div class="compact-summary-value compact-summary-value-inline">
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
                  <div ref="activityFilterRef" class="table-filter-menu">
                    <button
                      class="table-filter-trigger"
                      :class="{ 'is-active': filters.activityStatus !== 'all', 'is-open': activityFilterOpen }"
                      type="button"
                      aria-haspopup="menu"
                      :aria-expanded="activityFilterOpen ? 'true' : 'false'"
                      @click="toggleActivityFilter"
                    >
                      <span class="table-filter-trigger-label">活跃状态</span>
                      <span v-if="activeFilterLabel" class="table-filter-badge">{{ activeFilterLabel }}</span>
                      <svg class="table-filter-arrow" viewBox="0 0 16 16" aria-hidden="true">
                        <path d="M4 6.5 8 10.5l4-4" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" />
                      </svg>
                    </button>

                    <div v-if="activityFilterOpen" class="table-filter-popover" role="menu" aria-label="按活跃状态筛选贡献者">
                      <button
                        v-for="option in activityFilterOptions"
                        :key="option.value"
                        class="table-filter-option"
                        :class="{ 'is-selected': option.value === filters.activityStatus }"
                        type="button"
                        role="menuitemradio"
                        :aria-checked="option.value === filters.activityStatus ? 'true' : 'false'"
                        @click="setActivityFilter(option.value)"
                      >
                        <span>{{ option.label }}</span>
                        <span v-if="option.value === filters.activityStatus" class="table-filter-check">✓</span>
                      </button>
                    </div>
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
  gap: 0.42rem;
  padding-block: 0.72rem;
}

.compact-summary-head {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.compact-summary-value {
  display: grid;
  gap: 0.16rem;
  padding: 0.58rem 0.74rem;
  border: 1px solid var(--line);
  border-radius: 12px;
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

.compact-summary-value-inline {
  display: flex;
  align-items: baseline;
  gap: 0.44rem;
}

.compact-summary-value-inline span {
  font-size: 0.78rem;
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

.activity-filter-column {
  min-width: 154px;
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
