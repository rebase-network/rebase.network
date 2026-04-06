<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import {
  staffAccountStatusValues,
  type AdminRoleRecord,
  type AdminStaffDetailPayload,
  type AdminStaffRecord,
} from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime, formatStaffAccountStatus } from '../lib/format';

type StaffStatus = (typeof staffAccountStatusValues)[number];

interface StaffFormState {
  email: string;
  name: string;
  password: string;
  displayName: string;
  status: StaffStatus;
  roleIds: string[];
  notes: string;
}

const createBlankForm = (): StaffFormState => ({
  email: '',
  name: '',
  password: '',
  displayName: '',
  status: 'active',
  roleIds: [],
  notes: '',
});

const rows = ref<AdminStaffRecord[]>([]);
const roles = ref<AdminRoleRecord[]>([]);
const detail = ref<AdminStaffDetailPayload | null>(null);
const selectedStaffId = ref<'new' | string>('new');
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const form = reactive<StaffFormState>(createBlankForm());

const isCreating = computed(() => selectedStaffId.value === 'new');
const selectedStaff = computed(() => rows.value.find((row) => row.id === selectedStaffId.value) ?? null);
const staffStats = computed(() => [
  {
    label: '账号总数',
    value: rows.value.length,
    detail: '后台工作人员',
  },
  {
    label: '已启用',
    value: rows.value.filter((row) => row.status === 'active').length,
    detail: '可正常登录',
  },
  {
    label: '待激活',
    value: rows.value.filter((row) => row.status === 'invited').length,
    detail: '待初始化账号',
  },
  {
    label: '受限账号',
    value: rows.value.filter((row) => row.status === 'suspended' || row.status === 'disabled').length,
    detail: '暂停或停用',
  },
]);

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const resetForm = () => {
  detail.value = null;
  Object.assign(form, createBlankForm());
};

const applyDetail = (payload: AdminStaffDetailPayload) => {
  detail.value = payload;
  roles.value = payload.roles;
  Object.assign(form, {
    email: payload.staff.email,
    name: payload.staff.name,
    password: '',
    displayName: payload.staff.displayName,
    status: payload.staff.status,
    roleIds: [...payload.staff.roleIds],
    notes: payload.staff.notes ?? '',
  });
};

const loadStaff = async (nextSelectedId = selectedStaffId.value) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [nextRows, nextRoles] = await Promise.all([
      adminFetch<AdminStaffRecord[]>('/api/admin/v1/staff'),
      adminFetch<AdminRoleRecord[]>('/api/admin/v1/roles'),
    ]);

    rows.value = nextRows;
    roles.value = nextRoles;

    if (nextSelectedId !== 'new' && nextRows.some((row) => row.id === nextSelectedId)) {
      selectedStaffId.value = nextSelectedId;
      applyDetail(await adminFetch<AdminStaffDetailPayload>(`/api/admin/v1/staff/${nextSelectedId}`));
    } else {
      selectedStaffId.value = 'new';
      resetForm();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载工作人员列表。';
  } finally {
    loading.value = false;
  }
};

const selectStaff = async (id: string) => {
  selectedStaffId.value = id;
  resetFeedback();

  try {
    applyDetail(await adminFetch<AdminStaffDetailPayload>(`/api/admin/v1/staff/${id}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法读取工作人员详情。';
  }
};

const selectNew = () => {
  selectedStaffId.value = 'new';
  resetFeedback();
  resetForm();
};

const toggleRole = (roleId: string) => {
  const next = new Set(form.roleIds);
  if (next.has(roleId)) {
    next.delete(roleId);
  } else {
    next.add(roleId);
  }
  form.roleIds = [...next];
};

const saveStaff = async () => {
  saving.value = true;
  resetFeedback();

  try {
    const payload = isCreating.value
      ? {
          email: form.email,
          name: form.name,
          password: form.password,
          displayName: form.displayName,
          roleIds: form.roleIds,
          notes: form.notes,
        }
      : {
          displayName: form.displayName,
          status: form.status,
          roleIds: form.roleIds,
          notes: form.notes,
        };

    const nextDetail = await adminRequest<AdminStaffDetailPayload>(
      isCreating.value ? '/api/admin/v1/staff' : `/api/admin/v1/staff/${selectedStaffId.value}`,
      {
        method: isCreating.value ? 'POST' : 'PATCH',
        body: payload,
      },
    );

    successMessage.value = isCreating.value ? '工作人员账号已创建。' : '工作人员账号已更新。';
    await loadStaff(nextDetail.staff.id);
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存工作人员信息。';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadStaff();
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>工作人员与权限</h2>
        <p>账号、角色、权限</p>
      </div>
      <div class="page-actions">
        <button class="button-link" type="button" @click="selectNew">新增工作人员</button>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="saveStaff">
          {{ saving ? '保存中…' : isCreating ? '创建账号' : '保存修改' }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载工作人员信息…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <section class="panel stacked-gap editor-main">
        <div class="panel-toolbar">
          <h3>账号列表</h3>
          <div class="panel-meta">{{ rows.length }} 个账号</div>
        </div>

        <div class="compact-stat-grid compact-stat-grid-4">
          <article v-for="item in staffStats" :key="item.label" class="compact-stat-card">
            <span class="compact-stat-label">{{ item.label }}</span>
            <strong>{{ item.value }}</strong>
            <small>{{ item.detail }}</small>
          </article>
        </div>

        <div v-if="rows.length === 0" class="empty-state-card"><p>当前还没有工作人员账号。</p></div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>工作人员</th>
              <th>角色</th>
              <th>状态</th>
              <th>最后登录</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.displayName }}</strong>
                  <div class="muted-row">{{ row.email }}</div>
                </div>
              </td>
              <td>{{ row.roleCodes.join('、') || '未分配角色' }}</td>
              <td><span class="status-pill">{{ formatStaffAccountStatus(row.status) }}</span></td>
              <td>{{ formatDateTime(row.lastLoginAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <button class="table-link table-link-button" type="button" @click="selectStaff(row.id)">编辑</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <aside class="panel stacked-gap editor-sidebar">
        <div class="panel-toolbar">
          <h3>{{ isCreating ? '新建工作人员' : '编辑工作人员' }}</h3>
          <div class="panel-meta">{{ formatStaffAccountStatus(selectedStaff?.status ?? form.status) }}</div>
        </div>

        <template v-if="isCreating">
          <div class="field-grid field-grid-2">
            <label class="field">
              <span>登录邮箱</span>
              <input v-model="form.email" type="email" autocomplete="off" placeholder="editor@rebase.network" />
              <small v-if="fieldIssues.email" class="field-error">{{ fieldIssues.email }}</small>
            </label>
            <label class="field">
              <span>姓名</span>
              <input v-model="form.name" type="text" autocomplete="off" placeholder="rebase editor" />
              <small v-if="fieldIssues.name" class="field-error">{{ fieldIssues.name }}</small>
            </label>
          </div>

          <label class="field">
            <span>初始密码</span>
            <input v-model="form.password" type="password" autocomplete="new-password" placeholder="至少 8 位" />
            <small v-if="fieldIssues.password" class="field-error">{{ fieldIssues.password }}</small>
          </label>
        </template>

        <template v-else>
          <article class="summary-card">
            <div class="eyebrow">账号信息</div>
            <dl class="summary-grid">
              <div class="summary-item">
                <dt>显示名称</dt>
                <dd>{{ detail?.staff.displayName ?? '—' }}</dd>
              </div>
              <div class="summary-item">
                <dt>登录邮箱</dt>
                <dd class="muted">{{ detail?.staff.email ?? '—' }}</dd>
              </div>
              <div class="summary-item">
                <dt>姓名</dt>
                <dd class="muted">{{ detail?.staff.name ?? '—' }}</dd>
              </div>
            </dl>
          </article>
        </template>

        <label class="field">
          <span>显示名称</span>
          <input v-model="form.displayName" type="text" placeholder="Rebase 编辑部" />
          <small v-if="fieldIssues.displayName" class="field-error">{{ fieldIssues.displayName }}</small>
        </label>

        <label v-if="!isCreating" class="field">
          <span>账号状态</span>
          <select v-model="form.status">
            <option v-for="status in staffAccountStatusValues" :key="status" :value="status">{{ formatStaffAccountStatus(status) }}</option>
          </select>
        </label>

        <div class="field">
          <span>角色权限</span>
          <div class="checkbox-list">
            <label v-for="role in roles" :key="role.id" class="checkbox-chip">
              <input :checked="form.roleIds.includes(role.id)" type="checkbox" @change="toggleRole(role.id)" />
              <span>{{ role.name }}</span>
              <small>{{ role.code }}</small>
            </label>
          </div>
          <small v-if="fieldIssues.roleIds" class="field-error">{{ fieldIssues.roleIds }}</small>
        </div>

        <label class="field">
          <span>备注</span>
          <textarea v-model="form.notes" rows="4" placeholder="记录职责范围、交接信息或额外提醒。" />
        </label>

        <article class="summary-card">
          <div class="eyebrow">权限摘要</div>
          <dl class="summary-grid">
            <div class="summary-item">
              <dt>角色数量</dt>
              <dd>{{ form.roleIds.length }}</dd>
            </div>
            <div class="summary-item">
              <dt>账号状态</dt>
              <dd class="muted">{{ formatStaffAccountStatus(form.status) }}</dd>
            </div>
            <div v-if="selectedStaff" class="summary-item">
              <dt>最近登录</dt>
              <dd class="muted">{{ formatDateTime(selectedStaff.lastLoginAt) }}</dd>
            </div>
          </dl>
        </article>
      </aside>
    </div>
  </section>
</template>
