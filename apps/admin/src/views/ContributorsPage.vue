<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  contributorActivityStatusOptions,
  defaultAdminPageSize,
  type AdminContributorListItem,
  type AdminContributorRoleRecord,
  type PaginatedMeta,
} from '@rebase/shared';

import PaginationBar from '../components/PaginationBar.vue';
import { adminFetch, adminFetchWithMeta, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatContributorActivityStatus, formatDateTime } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

const contributors = ref<AdminContributorListItem[]>([]);
const roles = ref<AdminContributorRoleRecord[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const roleIssues = ref<Record<string, string>>({});
const selectedRoleId = ref('new');
const savingRole = ref(false);
const showRoleManager = ref(false);
const contributorPage = ref(1);
const filters = reactive({ activityStatus: 'all' });

const roleForm = reactive({
  slug: '',
  name: '',
  description: '',
  sortOrder: 0,
  status: 'draft' as 'draft' | 'published' | 'archived',
});

const contributorStats = computed(() => [
  {
    label: '贡献者总数',
    value: pagination.value?.totalAllItems ?? pagination.value?.totalItems ?? contributors.value.length,
  },
  {
    label: '筛选结果',
    value: pagination.value?.totalItems ?? contributors.value.length,
  },
  {
    label: '当前页',
    value: `${contributors.value.length} / 第 ${pagination.value?.page ?? 1} 页`,
  },
  {
    label: '本页活跃',
    value: contributors.value.filter((item) => item.activityStatus === 'active').length,
  },
]);
const publishedRoleCount = computed(() => roles.value.filter((item) => item.status === 'published').length);
const activeRoleLabel = computed(() => {
  if (!showRoleManager.value) {
    return '未展开';
  }

  if (selectedRoleId.value === 'new') {
    return '新建角色';
  }

  return roles.value.find((item) => item.id === selectedRoleId.value)?.name ?? '未选择';
});

const resetRoleForm = () => {
  selectedRoleId.value = 'new';
  roleForm.slug = '';
  roleForm.name = '';
  roleForm.description = '';
  roleForm.sortOrder = roles.value.length;
  roleForm.status = 'draft';
  roleIssues.value = {};
};

const applyRole = (role: AdminContributorRoleRecord) => {
  showRoleManager.value = true;
  selectedRoleId.value = role.id;
  roleForm.slug = role.slug;
  roleForm.name = role.name;
  roleForm.description = role.description;
  roleForm.sortOrder = role.sortOrder;
  roleForm.status = role.status;
  roleIssues.value = {};
};

const openNewRoleForm = () => {
  showRoleManager.value = true;
  resetRoleForm();
};

const openRoleManager = () => {
  showRoleManager.value = true;
};

const closeRoleManager = () => {
  showRoleManager.value = false;
  resetRoleForm();
};

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
    if (selectedRoleId.value === 'new') {
      resetRoleForm();
    } else {
      const activeRole = nextRoles.find((item) => item.id === selectedRoleId.value);
      if (activeRole) {
        applyRole(activeRole);
      } else {
        resetRoleForm();
      }
    }
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

const saveRole = async () => {
  savingRole.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  roleIssues.value = {};
  try {
    const path = selectedRoleId.value === 'new' ? '/api/admin/v1/contributors/roles' : `/api/admin/v1/contributors/roles/${selectedRoleId.value}`;
    await adminRequest<AdminContributorRoleRecord>(path, {
      method: selectedRoleId.value === 'new' ? 'POST' : 'PATCH',
      body: roleForm,
    });
    successMessage.value = selectedRoleId.value === 'new' ? '贡献者角色已创建。' : '贡献者角色已更新。';
    await loadData();
    closeRoleManager();
  } catch (error) {
    roleIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存角色。';
  } finally {
    savingRole.value = false;
  }
};

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
        <button v-if="showRoleManager" class="button-link" type="button" @click="closeRoleManager">收起角色管理</button>
        <button v-else class="button-link" type="button" @click="openRoleManager">管理角色</button>
        <RouterLink class="button-link button-primary" to="/contributors/new">新增贡献者</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载贡献者数据…</p></div>

    <template v-else>
      <section class="panel compact-overview-shell">
        <div class="panel-toolbar">
          <div>
            <h3>列表概览</h3>
            <div class="panel-meta">把贡献者概览、角色概览和筛选收敛到同一块区域。</div>
          </div>
          <div class="panel-meta">{{ pagination?.totalItems ?? contributors.length }} 人</div>
        </div>

        <div class="compact-overview-row">
          <div class="compact-stat-strip">
            <article v-for="item in contributorStats" :key="item.label" class="compact-stat-pill">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
            </article>
          </div>

          <div class="compact-overview-actions">
            <div class="compact-role-summary">
              <span>角色</span>
              <strong>{{ publishedRoleCount }} / {{ roles.length }} 已启用</strong>
              <small>{{ showRoleManager ? `当前：${activeRoleLabel}` : '角色管理未展开' }}</small>
            </div>
          </div>
        </div>
      </section>

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

      <section class="panel stacked-gap">
        <div class="panel-toolbar">
          <div>
            <h3>角色分组</h3>
            <div class="panel-meta">{{ roles.length }} 个角色 · 次级维护界面</div>
          </div>
          <div v-if="showRoleManager" class="page-actions">
            <button class="button-link" type="button" @click="openNewRoleForm">新建角色</button>
          </div>
        </div>

        <div v-if="roles.length === 0" class="empty-state-card"><p>暂时还没有角色分组。</p></div>

        <div v-else class="role-list">
          <button
            v-for="role in roles"
            :key="role.id"
            class="role-chip"
            :class="{ 'is-active': role.id === selectedRoleId && showRoleManager }"
            type="button"
            @click="applyRole(role)"
          >
            <strong>{{ role.name }}</strong>
            <small>{{ role.slug }}</small>
          </button>
        </div>

        <div v-if="!showRoleManager" class="empty-inline">角色调整频率较低，点击顶部“管理角色”后再新建或编辑。</div>

        <div v-if="showRoleManager" class="field-shell stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>{{ selectedRoleId === 'new' ? '新建角色' : '编辑角色' }}</h3>
              <div class="panel-meta">{{ selectedRoleId === 'new' ? '新增一个角色分组' : '更新当前角色信息' }}</div>
            </div>
            <button class="button-link" type="button" @click="openNewRoleForm">重置</button>
          </div>

          <label class="field">
            <span>角色 slug</span>
            <input v-model="roleForm.slug" type="text" placeholder="volunteers" />
            <small v-if="roleIssues.slug" class="field-error">{{ roleIssues.slug }}</small>
          </label>
          <label class="field">
            <span>角色名称</span>
            <input v-model="roleForm.name" type="text" placeholder="志愿者" />
            <small v-if="roleIssues.name" class="field-error">{{ roleIssues.name }}</small>
          </label>
          <label class="field">
            <span>角色描述</span>
            <textarea v-model="roleForm.description" rows="3" placeholder="推动活动、内容和社区协调工作的人。" />
          </label>
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>排序</span>
              <input v-model.number="roleForm.sortOrder" type="number" min="0" />
            </label>
            <label class="field">
              <span>状态</span>
              <select v-model="roleForm.status">
                <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
            </label>
          </div>

          <div class="page-actions">
            <button class="button-link" type="button" @click="closeRoleManager">取消</button>
            <button class="button-link button-primary" type="button" :disabled="savingRole" @click="saveRole">
              {{ savingRole ? '保存中…' : selectedRoleId === 'new' ? '创建角色' : '更新角色' }}
            </button>
          </div>
        </div>
      </section>
    </template>
  </section>
</template>

<style scoped>
.compact-overview-shell {
  gap: 0.72rem;
}

.compact-overview-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.72rem;
}

.compact-stat-strip {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 0.5rem;
  flex: 1 1 520px;
}

.compact-stat-pill,
.compact-role-summary,
.compact-filter {
  display: grid;
  gap: 0.12rem;
  padding: 0.58rem 0.72rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.74);
}

.compact-stat-pill span,
.compact-role-summary span,
.compact-filter span {
  color: var(--muted);
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.compact-stat-pill strong,
.compact-role-summary strong {
  font-size: 0.96rem;
  line-height: 1.2;
}

.compact-role-summary small {
  color: var(--muted);
  font-size: 0.74rem;
}

.compact-overview-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: flex-end;
  gap: 0.5rem;
}

.compact-role-summary {
  min-width: 180px;
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
  .compact-stat-strip {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    flex-basis: 100%;
  }

  .compact-overview-actions {
    width: 100%;
    justify-content: space-between;
  }
}

@media (max-width: 760px) {
  .compact-stat-strip,
  .compact-overview-actions {
    grid-template-columns: 1fr;
  }

  .compact-overview-actions {
    display: grid;
  }

  .compact-role-summary {
    width: 100%;
  }
}
</style>
