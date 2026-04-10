<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { RouterLink } from 'vue-router';

import {
  contentStatusOptions,
  type AdminContributorRoleRecord,
} from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';

const roles = ref<AdminContributorRoleRecord[]>([]);
const loading = ref(true);
const errorMessage = ref('');
const successMessage = ref('');
const roleIssues = ref<Record<string, string>>({});
const selectedRoleId = ref('new');
const savingRole = ref(false);

const roleForm = reactive({
  slug: '',
  name: '',
  description: '',
  sortOrder: 0,
  status: 'draft' as 'draft' | 'published' | 'archived',
});

const publishedRoleCount = computed(() => roles.value.filter((item) => item.status === 'published').length);
const pageTitle = computed(() => (selectedRoleId.value === 'new' ? '新建角色' : '编辑角色'));
const pageDetail = computed(() => (selectedRoleId.value === 'new' ? '新增一个角色分组。' : '更新当前角色信息。'));
const activeRoleLabel = computed(() => {
  if (selectedRoleId.value === 'new') {
    return '未选择';
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
  selectedRoleId.value = role.id;
  roleForm.slug = role.slug;
  roleForm.name = role.name;
  roleForm.description = role.description;
  roleForm.sortOrder = role.sortOrder;
  roleForm.status = role.status;
  roleIssues.value = {};
};

const loadRoles = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    const nextRoles = await adminFetch<AdminContributorRoleRecord[]>('/api/admin/v1/contributors/roles');
    roles.value = nextRoles;

    if (selectedRoleId.value === 'new') {
      resetRoleForm();
      return;
    }

    const activeRole = nextRoles.find((item) => item.id === selectedRoleId.value);
    if (activeRole) {
      applyRole(activeRole);
    } else {
      resetRoleForm();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载贡献者角色。';
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
    await loadRoles();
    resetRoleForm();
  } catch (error) {
    roleIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存角色。';
  } finally {
    savingRole.value = false;
  }
};

onMounted(() => void loadRoles());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>贡献者角色</h2>
        <p>角色分组与发布状态</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/contributors">返回贡献者</RouterLink>
        <button class="button-link button-primary" type="button" @click="resetRoleForm">新建角色</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载角色数据…</p></div>

    <template v-else>
      <div class="panel-grid panel-grid-2">
        <section class="panel compact-summary-card">
          <div class="panel-toolbar">
            <div>
              <h3>角色概览</h3>
              <div class="panel-meta">角色管理改成独立页面，避免干扰贡献者列表。</div>
            </div>
          </div>
          <div class="compact-summary-value">
            <strong>{{ publishedRoleCount }} / {{ roles.length }}</strong>
            <span>已启用角色</span>
          </div>
        </section>

        <section class="panel compact-summary-card">
          <div class="panel-toolbar">
            <div>
              <h3>当前编辑</h3>
              <div class="panel-meta">角色调整频率低，集中在这一页维护。</div>
            </div>
          </div>
          <div class="compact-summary-value">
            <strong>{{ activeRoleLabel }}</strong>
            <span>{{ selectedRoleId === 'new' ? '准备新增角色' : '当前角色' }}</span>
          </div>
        </section>
      </div>

      <div class="panel-grid panel-grid-2">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>角色列表</h3>
              <div class="panel-meta">{{ roles.length }} 个角色</div>
            </div>
          </div>

          <div v-if="roles.length === 0" class="empty-state-card"><p>暂时还没有角色分组。</p></div>

          <div v-else class="role-list">
            <button
              v-for="role in roles"
              :key="role.id"
              class="role-chip"
              :class="{ 'is-active': role.id === selectedRoleId }"
              type="button"
              @click="applyRole(role)"
            >
              <strong>{{ role.name }}</strong>
              <small>{{ role.slug }}</small>
            </button>
          </div>
        </section>

        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>{{ pageTitle }}</h3>
              <div class="panel-meta">{{ pageDetail }}</div>
            </div>
            <button class="button-link" type="button" @click="resetRoleForm">重置</button>
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
            <button class="button-link button-primary" type="button" :disabled="savingRole" @click="saveRole">
              {{ savingRole ? '保存中…' : selectedRoleId === 'new' ? '创建角色' : '更新角色' }}
            </button>
          </div>
        </section>
      </div>
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
</style>
