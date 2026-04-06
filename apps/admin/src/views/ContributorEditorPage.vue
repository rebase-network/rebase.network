<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  contentStatusOptions,
  type AdminAssetRecord,
  type AdminContributorDetailPayload,
  type AdminContributorRoleRecord,
  type ContributorInput,
} from '@rebase/shared';

import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, slugify } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

interface ContributorFormState extends Omit<ContributorInput, 'avatarAssetId' | 'roleIds'> {
  avatarAssetId: string;
  roleIds: string[];
}

const route = useRoute();
const router = useRouter();

const createBlankForm = (): ContributorFormState => ({
  slug: '',
  name: '',
  headline: '',
  bio: '',
  avatarAssetId: '',
  avatarSeed: 'rebase-community',
  twitterUrl: '',
  wechat: '',
  telegram: '',
  sortOrder: 0,
  roleIds: [],
  status: 'draft',
});

const form = reactive<ContributorFormState>(createBlankForm());
const contributorId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => contributorId.value.length === 0);
const pageTitle = computed(() => (isNew.value ? '新增贡献者' : `编辑贡献者：${detail.value?.contributor.name ?? ''}`));
const selectedAvatarAsset = computed(() => assets.value.find((asset) => asset.id === form.avatarAssetId) ?? null);
const roleSummary = computed(() => availableRoles.value.filter((role) => form.roleIds.includes(role.id)).map((role) => role.name).join('、') || '未分配');
const contactSummary = computed(() => [form.twitterUrl, form.wechat, form.telegram].filter(Boolean).join(' / ') || '未填写');
const publicUrl = computed(() => (form.slug ? getPublicSiteUrl(`/contributors#${form.slug}`) : '待生成'));
const socialChannelCount = computed(() => [form.twitterUrl, form.wechat, form.telegram].filter(Boolean).length);

const detail = ref<AdminContributorDetailPayload | null>(null);
const assets = ref<AdminAssetRecord[]>([]);
const availableRoles = ref<AdminContributorRoleRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const applyPayload = (payload: AdminContributorDetailPayload) => {
  detail.value = payload;
  availableRoles.value = payload.availableRoles;
  Object.assign(form, {
    slug: payload.contributor.slug,
    name: payload.contributor.name,
    headline: payload.contributor.headline,
    bio: payload.contributor.bio,
    avatarAssetId: payload.contributor.avatarAssetId ?? '',
    avatarSeed: payload.contributor.avatarSeed,
    twitterUrl: payload.contributor.twitterUrl,
    wechat: payload.contributor.wechat,
    telegram: payload.contributor.telegram,
    sortOrder: payload.contributor.sortOrder,
    roleIds: payload.contributor.roleIds,
    status: payload.contributor.status,
  });
  slugTouched.value = true;
};

const loadRecord = async () => {
  resetFeedback();
  loading.value = true;
  try {
    assets.value = await adminFetch<AdminAssetRecord[]>('/api/admin/v1/assets?page=1&pageSize=200');

    if (isNew.value) {
      availableRoles.value = await adminFetch<AdminContributorRoleRecord[]>('/api/admin/v1/contributors/roles');
      detail.value = null;
      slugTouched.value = false;
      Object.assign(form, createBlankForm());
      return;
    }

    applyPayload(await adminFetch<AdminContributorDetailPayload>(`/api/admin/v1/contributors/${contributorId.value}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载贡献者详情。';
  } finally {
    loading.value = false;
  }
};

const save = async () => {
  resetFeedback();
  saving.value = true;
  try {
    const payload = {
      ...form,
      avatarAssetId: form.avatarAssetId || null,
    };

    const nextPayload = await adminRequest<AdminContributorDetailPayload>(
      isNew.value ? '/api/admin/v1/contributors' : `/api/admin/v1/contributors/${contributorId.value}`,
      { method: isNew.value ? 'POST' : 'PATCH', body: payload },
    );
    applyPayload(nextPayload);
    successMessage.value = isNew.value ? '贡献者已创建。' : '贡献者已保存。';

    if (isNew.value) {
      await router.replace(`/contributors/${nextPayload.contributor.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存贡献者。';
  } finally {
    saving.value = false;
  }
};

const toggleRole = (roleId: string) => {
  const set = new Set(form.roleIds);
  if (set.has(roleId)) {
    set.delete(roleId);
  } else {
    set.add(roleId);
  }
  form.roleIds = [...set];
};

const onNameInput = () => {
  if (!slugTouched.value) {
    form.slug = slugify(form.name);
  }
};

watch(() => route.fullPath, () => void loadRecord());
onMounted(() => void loadRecord());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>资料、角色、头像</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/contributors">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '创建贡献者' : '保存修改' }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备贡献者编辑器…</p></div>

    <div v-else class="stacked-gap">
      <div class="editor-overview-grid">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>资料摘要</h3>
            <div class="panel-meta">{{ formatContentStatus(form.status) }}</div>
          </div>
          <dl class="summary-grid summary-grid-2">
            <div class="summary-item">
              <dt>公开地址</dt>
              <dd>{{ publicUrl }}</dd>
            </div>
            <div class="summary-item">
              <dt>角色</dt>
              <dd>{{ roleSummary }}</dd>
            </div>
            <div class="summary-item">
              <dt>联系方式</dt>
              <dd class="muted">{{ contactSummary }}</dd>
            </div>
            <div class="summary-item">
              <dt>更新时间</dt>
              <dd class="muted">{{ detail ? formatDateTime(detail.contributor.updatedAt) : '新建后生成' }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>头像设置</h3>
            <div class="panel-meta">{{ selectedAvatarAsset ? '上传资源' : '头像种子' }}</div>
          </div>
          <dl class="summary-grid summary-grid-2">
            <div class="summary-item">
              <dt>头像种子</dt>
              <dd class="muted">{{ form.avatarSeed || '未填写' }}</dd>
            </div>
            <div class="summary-item">
              <dt>排序</dt>
              <dd>{{ form.sortOrder }}</dd>
            </div>
            <div class="summary-item">
              <dt>URL 标识</dt>
              <dd>{{ form.slug || '待生成' }}</dd>
            </div>
            <div class="summary-item">
              <dt>社交渠道</dt>
              <dd class="muted">{{ socialChannelCount }} 个</dd>
            </div>
          </dl>
        </section>

        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>头像预览</h3>
            <div class="panel-meta">{{ form.name || '未填写姓名' }}</div>
          </div>

          <div v-if="selectedAvatarAsset" class="summary-item summary-asset">
            <div v-if="selectedAvatarAsset.publicUrl && selectedAvatarAsset.mimeType.startsWith('image/')" class="asset-preview-frame avatar-frame">
              <img :src="selectedAvatarAsset.publicUrl" :alt="selectedAvatarAsset.altText || selectedAvatarAsset.originalFilename" />
            </div>
            <div class="summary-asset-copy">
              <div class="eyebrow">头像</div>
              <strong>{{ selectedAvatarAsset.originalFilename }}</strong>
              <p>{{ selectedAvatarAsset.publicUrl || '未生成公开地址' }}</p>
            </div>
          </div>
          <div v-else class="empty-inline">当前未绑定上传头像，将依赖头像种子生成默认形象。</div>
        </section>
      </div>

      <section class="panel stacked-gap editor-main">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>姓名</span>
            <input v-model="form.name" type="text" placeholder="陈小明" @input="onNameInput" />
          </label>
          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="ruix" @input="slugTouched = true" />
          </label>
        </div>

        <label class="field">
          <span>一句话介绍</span>
          <input v-model="form.headline" type="text" placeholder="社区志愿者 / 极客日报智囊团" />
        </label>

        <MarkdownEditorField v-model="form.bio" label="详细介绍" placeholder="使用 Markdown 编写贡献者介绍。" :rows="8" />

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>头像资源</span>
            <select v-model="form.avatarAssetId">
              <option value="">不使用上传资源</option>
              <option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.originalFilename }}</option>
            </select>
          </label>
          <label class="field">
            <span>头像种子</span>
            <input v-model="form.avatarSeed" type="text" placeholder="rebase-community" />
          </label>
          <label class="field">
            <span>排序</span>
            <input v-model.number="form.sortOrder" type="number" min="0" />
          </label>
        </div>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>Twitter / X</span>
            <input v-model="form.twitterUrl" type="url" placeholder="https://x.com/rebase_network" />
          </label>
          <label class="field">
            <span>微信</span>
            <input v-model="form.wechat" type="text" placeholder="rebase-network" />
          </label>
          <label class="field">
            <span>Telegram</span>
            <input v-model="form.telegram" type="text" placeholder="@rebase_network" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>状态</span>
            <select v-model="form.status">
              <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <div class="field">
            <span>角色分组</span>
            <div class="checkbox-list">
              <label v-for="role in availableRoles" :key="role.id" class="checkbox-chip">
                <input :checked="form.roleIds.includes(role.id)" type="checkbox" @change="toggleRole(role.id)" />
                <span>{{ role.name }}</span>
              </label>
            </div>
            <small v-if="fieldIssues.roleIds" class="field-error">{{ fieldIssues.roleIds }}</small>
          </div>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
.asset-preview-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-preview-frame {
  overflow: hidden;
  border-radius: 1rem;
  background: rgba(15, 118, 110, 0.08);
}

.avatar-frame {
  aspect-ratio: 1 / 1;
}
</style>
