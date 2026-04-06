<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import {
  staffAccountStatusValues,
  type AdminRoleRecord,
  type AdminStaffDetailPayload,
  type AdminStaffRecord,
} from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime } from '../lib/format';

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
const searchQuery = ref('');
const form = reactive<StaffFormState>(createBlankForm());

const filteredRows = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();

  return rows.value.filter((row) => {
    if (!query) {
      return true;
    }

    return [row.displayName, row.name, row.email, ...row.roleCodes].some((value) => value.toLowerCase().includes(query));
  });
});

const isCreating = computed(() => selectedStaffId.value === 'new');
const selectedStaff = computed(() => rows.value.find((row) => row.id === selectedStaffId.value) ?? null);

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
          <label class="field compact-search-field">
            <span>搜索</span>
            <input v-model="searchQuery" type="search" placeholder="搜索昵称、邮箱或角色代码" />
          </label>
        </div>

        <div v-if="filteredRows.length === 0" class="empty-state-card"><p>当前没有匹配的工作人员账号。</p></div>

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
            <tr v-for="row in filteredRows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.displayName }}</strong>
                  <div class="muted-row">{{ row.email }}</div>
                </div>
              </td>
              <td>{{ row.roleCodes.join('、') || '未分配角色' }}</td>
              <td><span class="status-pill">{{ row.status }}</span></td>
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
          <div class="panel-meta">{{ selectedStaff?.status ?? form.status }}</div>
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
          <article class="insight-card stacked-gap-tight">
            <span class="eyebrow">identity</span>
            <strong>{{ detail?.staff.displayName }}</strong>
            <p>{{ detail?.staff.email }} / {{ detail?.staff.name }}</p>
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
            <option v-for="status in staffAccountStatusValues" :key="status" :value="status">{{ status }}</option>
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

        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">access note</span>
          <strong>{{ form.roleIds.length }} roles selected</strong>
          <p>{{ form.roleIds.length }} 个角色 / {{ form.status }}</p>
        </article>
        <article v-if="selectedStaff" class="insight-card stacked-gap-tight">
          <span class="eyebrow">last login</span>
          <strong>{{ formatDateTime(selectedStaff.lastLoginAt) }}</strong>
          <p>{{ detail?.staff.email ?? '创建后可登录' }}</p>
        </article>
      </aside>
    </div>
  </section>
</template>
