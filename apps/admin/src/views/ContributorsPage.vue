<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  type AdminContributorListItem,
  type AdminContributorRoleRecord,
} from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime } from '../lib/format';

const contributors = ref<AdminContributorListItem[]>([]);
const roles = ref<AdminContributorRoleRecord[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const roleIssues = ref<Record<string, string>>({});
const selectedRoleId = ref('new');
const savingRole = ref(false);
const contributorQuery = ref('');

const roleForm = reactive({
  slug: '',
  name: '',
  description: '',
  sortOrder: 0,
  status: 'draft' as 'draft' | 'published' | 'archived',
});

const filteredContributors = computed(() => {
  const query = contributorQuery.value.trim().toLowerCase();
  return contributors.value.filter((row) => {
    if (!query) {
      return true;
    }

    return [row.name, row.slug, row.headline, ...row.roleNames].some((value) => value.toLowerCase().includes(query));
  });
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
  selectedRoleId.value = role.id;
  roleForm.slug = role.slug;
  roleForm.name = role.name;
  roleForm.description = role.description;
  roleForm.sortOrder = role.sortOrder;
  roleForm.status = role.status;
  roleIssues.value = {};
};

const loadData = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const [nextRoles, nextContributors] = await Promise.all([
      adminFetch<AdminContributorRoleRecord[]>('/api/admin/v1/contributors/roles'),
      adminFetch<AdminContributorListItem[]>('/api/admin/v1/contributors'),
    ]);
    roles.value = nextRoles;
    contributors.value = nextContributors;
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
    resetRoleForm();
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
        <p>维护贡献者角色分组、个人档案和公开展示顺序。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link button-primary" to="/contributors/new">新增贡献者</RouterLink>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载贡献者数据…</p></div>

    <template v-else>
      <div class="editor-grid editor-grid-focus">
        <section class="panel stacked-gap editor-main">
          <div class="panel-toolbar">
            <h3>贡献者列表</h3>
            <label class="field compact-search-field">
              <span>搜索</span>
              <input v-model="contributorQuery" type="search" placeholder="搜索姓名、slug 或角色" />
            </label>
          </div>

          <div v-if="filteredContributors.length === 0" class="empty-state-card"><p>暂时没有匹配的贡献者。</p></div>

          <table v-else class="data-table">
            <thead>
              <tr>
                <th>贡献者</th>
                <th>角色</th>
                <th>状态</th>
                <th>更新时间</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in filteredContributors" :key="row.id">
                <td>
                  <div class="table-cell-stack">
                    <strong>{{ row.name }}</strong>
                    <div class="muted-row">{{ row.headline }}</div>
                  </div>
                </td>
                <td>{{ row.roleNames.join('、') || '未分配角色' }}</td>
                <td><span class="status-pill">{{ formatContentStatus(row.status) }}</span></td>
                <td>{{ formatDateTime(row.updatedAt) }}</td>
                <td class="table-actions-cell">
                  <div class="table-action-list">
                    <RouterLink class="table-link" :to="`/contributors/${row.id}/edit`">编辑</RouterLink>
                    <a class="table-link" :href="`/contributors#${row.slug}`" target="_blank" rel="noreferrer">前台定位</a>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        <aside class="panel stacked-gap editor-sidebar">
          <div class="panel-toolbar">
            <h3>角色分组</h3>
            <button class="button-link" type="button" @click="resetRoleForm">新建角色</button>
          </div>

          <div class="role-list">
            <button
              v-for="role in roles"
              :key="role.id"
              class="role-chip"
              :class="{ 'is-active': role.id === selectedRoleId }"
              type="button"
              @click="applyRole(role)"
            >
              {{ role.name }}
            </button>
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

          <button class="button-link button-primary" type="button" :disabled="savingRole" @click="saveRole">
            {{ savingRole ? '保存中…' : selectedRoleId === 'new' ? '创建角色' : '更新角色' }}
          </button>
        </aside>
      </div>
    </template>
  </section>
</template>
