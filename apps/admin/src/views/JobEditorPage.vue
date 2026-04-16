<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { type AdminJobRecord } from '@rebase/shared';

import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, fromDateInputValue, slugify, toDateInputValue } from '../lib/format';

interface JobFormState {
  slug: string;
  companyName: string;
  roleTitle: string;
  salary: string;
  supportsRemote: boolean;
  workMode: string;
  location: string;
  summary: string;
  descriptionMarkdown: string;
  applyUrl: string;
  applyNote: string;
  contactLabel: string;
  contactValue: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'published' | 'archived';
  expiresAt: string;
}

type JobApplyMode = 'external_url' | 'direct_contact';

const route = useRoute();
const router = useRouter();

const jobWorkModeOptions = [
  { value: 'full-time', label: '全职' },
  { value: 'part-time', label: '兼职' },
] as const;

const jobApplyModeOptions = [
  { value: 'external_url', label: '外部链接' },
  { value: 'direct_contact', label: '直接联系' },
] as const;

const normalizeJobWorkMode = (value: string) => {
  const normalizedValue = value.trim().toLowerCase();

  if (normalizedValue === '全职' || normalizedValue === 'full-time') {
    return 'full-time';
  }

  if (normalizedValue === '兼职' || normalizedValue === 'part-time') {
    return 'part-time';
  }

  return value.trim();
};

const deriveJobApplyMode = (applyUrl?: string | null, contactValue?: string | null): JobApplyMode => {
  if ((applyUrl ?? '').trim()) {
    return 'external_url';
  }

  if ((contactValue ?? '').trim()) {
    return 'direct_contact';
  }

  return 'external_url';
};

const stripMarkdown = (value: string) =>
  value
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_>#-]+/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const buildJobSummary = (descriptionMarkdown: string, roleTitle: string, companyName: string, fallback = '') => {
  const descriptionText = stripMarkdown(descriptionMarkdown);
  const summarySource = descriptionText || fallback.trim() || [roleTitle.trim(), companyName.trim()].filter(Boolean).join(' · ');

  if (!summarySource) {
    return '';
  }

  return summarySource.length > 92 ? `${summarySource.slice(0, 89).trimEnd()}...` : summarySource;
};

const createBlankForm = (): JobFormState => ({
  slug: '',
  companyName: '',
  roleTitle: '',
  salary: '',
  supportsRemote: false,
  workMode: '',
  location: '',
  summary: '',
  descriptionMarkdown: '',
  applyUrl: '',
  applyNote: '',
  contactLabel: '',
  contactValue: '',
  tags: [],
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  expiresAt: '',
});

const form = reactive<JobFormState>(createBlankForm());
const record = ref<AdminJobRecord | null>(null);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);
const applyMode = ref<JobApplyMode>('external_url');

const jobId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => jobId.value.length === 0);
const pageTitle = computed(() => (isNew.value ? '新增招聘' : `编辑招聘：${record.value?.roleTitle ?? ''}`));
const statusLabel = computed(() => formatContentStatus(form.status));
const updatedMetaLabel = computed(() => (record.value?.updatedAt ? formatDateTime(record.value.updatedAt) : '-'));
const saveButtonLabel = computed(() => ((isNew.value || form.status === 'draft') ? '保存草稿' : '保存修改'));
const saveButtonClass = computed(() => ['button-link', !canPublish.value && 'button-primary'].filter(Boolean).join(' '));
const canPublish = computed(() => form.status !== 'published');
const canArchive = computed(() => Boolean(record.value) && form.status !== 'archived');
const headerNote = computed(() => {
  if (isNew.value) {
    return '先把岗位详情写清楚，尽量精简。可先保存草稿，也可直接发布。';
  }

  if (form.status === 'published') {
    return '先把岗位详情写清楚，尽量精简。已发布内容保存后会直接更新前台。';
  }

  if (form.status === 'archived') {
    return '先把岗位详情写清楚，尽量精简。已归档内容仅后台可见，点击“发布”可重新上线。';
  }

  return '先把岗位详情写清楚，尽量精简。草稿仅后台可见，可继续修改后再发布。';
});

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const applyRecord = (payload: AdminJobRecord) => {
  record.value = payload;
  Object.assign(form, {
    slug: payload.slug,
    companyName: payload.companyName,
    roleTitle: payload.roleTitle,
    salary: payload.salary,
    supportsRemote: payload.supportsRemote,
    workMode: normalizeJobWorkMode(payload.workMode),
    location: payload.location,
    summary: payload.summary,
    descriptionMarkdown: payload.descriptionMarkdown,
    applyUrl: payload.applyUrl ?? '',
    applyNote: payload.applyNote ?? '',
    contactLabel: payload.contactLabel ?? '',
    contactValue: payload.contactValue ?? '',
    tags: payload.tags,
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    status: payload.status,
    expiresAt: toDateInputValue(payload.expiresAt),
  });
  applyMode.value = deriveJobApplyMode(payload.applyUrl, payload.contactValue);
  slugTouched.value = true;
};

const loadRecord = async () => {
  resetFeedback();
  loading.value = true;
  try {
    if (isNew.value) {
      record.value = null;
      slugTouched.value = false;
      applyMode.value = 'external_url';
      Object.assign(form, createBlankForm());
      return;
    }

    applyRecord(await adminFetch<AdminJobRecord>(`/api/admin/v1/jobs/${jobId.value}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载招聘详情。';
  } finally {
    loading.value = false;
  }
};

const onTitleInput = () => {
  if (!slugTouched.value) {
    form.slug = slugify(`${form.companyName}-${form.roleTitle}`);
  }
};

const persist = async (nextStatus: JobFormState['status'], mode: 'save' | 'publish') => {
  resetFeedback();
  if (mode === 'publish') {
    actioning.value = true;
  } else {
    saving.value = true;
  }
  try {
    const summary = buildJobSummary(form.descriptionMarkdown, form.roleTitle, form.companyName, form.summary);
    const normalizedWorkMode = normalizeJobWorkMode(form.workMode);

    if (mode === 'publish' && applyMode.value === 'external_url' && !form.applyUrl.trim()) {
      fieldIssues.value = { applyUrl: '选择外部链接时，投递链接必填。' };
      errorMessage.value = '请补充投递链接后再发布。';
      return;
    }

    if (mode === 'publish' && applyMode.value === 'direct_contact' && !form.contactValue.trim()) {
      fieldIssues.value = { contactValue: '选择直接联系时，请填写联系方式。' };
      errorMessage.value = '请补充联系方式后再发布。';
      return;
    }

    const payload = {
      ...form,
      workMode: normalizedWorkMode,
      summary,
      status: nextStatus,
      applyUrl: applyMode.value === 'external_url' ? form.applyUrl || null : null,
      contactLabel: applyMode.value === 'direct_contact' ? form.contactLabel : '',
      contactValue: applyMode.value === 'direct_contact' ? form.contactValue : '',
      expiresAt: fromDateInputValue(form.expiresAt),
    };

    const nextRecord = await adminRequest<AdminJobRecord>(
      isNew.value ? '/api/admin/v1/jobs' : `/api/admin/v1/jobs/${jobId.value}`,
      { method: isNew.value ? 'POST' : 'PATCH', body: payload },
    );

    applyRecord(nextRecord);
    successMessage.value = mode === 'publish' ? '已发布。' : isNew.value ? '草稿已保存。' : '修改已保存。';

    if (isNew.value) {
      await router.replace(`/jobs/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : mode === 'publish' ? '发布失败。' : '无法保存招聘信息。';
  } finally {
    if (mode === 'publish') {
      actioning.value = false;
    } else {
      saving.value = false;
    }
  }
};

const save = async () => persist(form.status === 'published' ? 'published' : form.status === 'archived' ? 'archived' : 'draft', 'save');
const publish = async () => persist('published', 'publish');

const runAction = async (action: 'archive') => {
  if (!record.value) {
    return;
  }

  actioning.value = true;
  resetFeedback();
  try {
    const nextRecord = await adminRequest<AdminJobRecord>(`/api/admin/v1/jobs/${record.value.id}/${action}`, { method: 'POST' });
    applyRecord(nextRecord);
    successMessage.value = '已归档。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法执行该操作。';
  } finally {
    actioning.value = false;
  }
};

watch(() => [form.companyName, form.roleTitle], () => onTitleInput());
watch(applyMode, (mode) => {
  if (mode === 'external_url') {
    const { contactValue: _contactValue, ...restIssues } = fieldIssues.value;
    fieldIssues.value = restIssues;
    return;
  }

  const { applyUrl: _applyUrl, ...restIssues } = fieldIssues.value;
  fieldIssues.value = restIssues;
});
watch(() => route.fullPath, () => void loadRecord());
onMounted(() => void loadRecord());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header job-page-header">
      <div class="job-page-header-main">
        <h2>{{ pageTitle }}</h2>
        <div class="job-header-support">
          <p class="job-header-note">{{ headerNote }}</p>
          <div class="job-header-meta">
            <span class="panel-meta">最后更新 {{ updatedMetaLabel }}</span>
            <span class="status-pill">{{ statusLabel }}</span>
          </div>
        </div>
      </div>

      <div class="page-actions job-page-header-actions">
        <RouterLink class="button-link" to="/jobs">返回列表</RouterLink>
        <button :class="saveButtonClass" type="button" :disabled="loading || saving || actioning" @click="save">
          {{ saving ? '保存中…' : saveButtonLabel }}
        </button>
        <button v-if="canPublish" class="button-link button-primary" type="button" :disabled="loading || saving || actioning" @click="publish">
          {{ actioning ? '发布中…' : '发布' }}
        </button>
        <button v-if="canArchive" class="button-link button-danger" type="button" :disabled="saving || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备招聘编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus job-editor-layout">
      <section class="panel stacked-gap editor-main job-editor-main">
        <div class="field-shell stacked-gap job-leading-fields">
          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>岗位名称</span>
              <input v-model="form.roleTitle" class="job-title-input" type="text" placeholder="前端工程师" />
              <small v-if="fieldIssues.roleTitle" class="field-error">{{ fieldIssues.roleTitle }}</small>
            </label>
            <label class="field">
              <span>团队 / 公司</span>
              <input v-model="form.companyName" class="job-title-input" type="text" placeholder="Rebase Studio" />
              <small v-if="fieldIssues.companyName" class="field-error">{{ fieldIssues.companyName }}</small>
            </label>
          </div>
        </div>

        <MarkdownEditorField
          v-model="form.descriptionMarkdown"
          label="岗位详情"
          placeholder="使用 Markdown 描述岗位职责、任职要求、团队背景和投递说明。"
          :error="fieldIssues.descriptionMarkdown"
          :rows="24"
        />
      </section>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap job-sidebar-card">
          <div class="panel-toolbar">
            <h3>岗位信息</h3>
            <div class="panel-meta">基础配置</div>
          </div>

          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="frontend-engineer-community-platform" @input="slugTouched = true" />
            <small v-if="fieldIssues.slug" class="field-error">{{ fieldIssues.slug }}</small>
          </label>

          <label class="field">
            <span>薪资范围</span>
            <input v-model="form.salary" type="text" placeholder="$5,000 - $8,500 / month" />
            <small v-if="fieldIssues.salary" class="field-error">{{ fieldIssues.salary }}</small>
          </label>

          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>工作模式</span>
              <select v-model="form.workMode">
                <option value="">请选择</option>
                <option v-for="option in jobWorkModeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
              </select>
              <small v-if="fieldIssues.workMode" class="field-error">{{ fieldIssues.workMode }}</small>
            </label>
            <label class="field">
              <span>地点</span>
              <input v-model="form.location" type="text" placeholder="远程 / 中国时区优先" />
              <small v-if="fieldIssues.location" class="field-error">{{ fieldIssues.location }}</small>
            </label>
          </div>

          <label class="field">
            <span>截止日期</span>
            <input v-model="form.expiresAt" type="date" />
          </label>

          <label class="field checkbox-field job-remote-field">
            <span>支持远程</span>
            <input v-model="form.supportsRemote" type="checkbox" />
          </label>
        </section>

        <section class="panel stacked-gap job-sidebar-card">
          <div class="panel-toolbar">
            <h3>投递方式</h3>
            <div class="panel-meta">简历入口</div>
          </div>

          <label class="field">
            <span>投递模式</span>
            <select v-model="applyMode">
              <option v-for="option in jobApplyModeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>

          <label v-if="applyMode === 'external_url'" class="field">
            <span>投递链接</span>
            <input v-model="form.applyUrl" type="url" placeholder="https://example.com/jobs/frontend-engineer" />
            <small v-if="fieldIssues.applyUrl" class="field-error">{{ fieldIssues.applyUrl }}</small>
          </label>

          <div v-else class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>联系渠道</span>
              <input v-model="form.contactLabel" type="text" placeholder="telegram / 微信 / 邮箱" />
            </label>
            <label class="field">
              <span>联系方式</span>
              <input v-model="form.contactValue" type="text" placeholder="@rebase_hiring / hello@rebase.network" />
              <small v-if="fieldIssues.contactValue" class="field-error">{{ fieldIssues.contactValue }}</small>
            </label>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.job-page-header {
  grid-template-columns: minmax(0, 2.44fr) minmax(270px, 0.92fr);
  gap: 0.8rem;
  align-items: center;
}

.job-page-header-main {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.job-page-header-actions {
  align-self: center;
}

.job-editor-layout {
  grid-template-columns: minmax(0, 2.44fr) minmax(270px, 0.92fr);
}

.job-editor-main {
  gap: 0.75rem;
}

.job-header-support {
  display: flex;
  flex-wrap: nowrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.32rem 0.8rem;
  min-width: 0;
}

.job-header-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem 0.7rem;
  justify-content: flex-end;
}

.job-header-note {
  margin: 0;
  flex: 1 1 420px;
}

.job-leading-fields {
  gap: 0.65rem;
}

.job-title-input {
  font-size: 1rem;
  font-weight: 700;
}

.job-sidebar-card {
  gap: 0.7rem;
}

.job-remote-field {
  align-items: center;
}

@media (max-width: 1280px) {
  .job-page-header,
  .job-editor-layout {
    grid-template-columns: minmax(0, 2.12fr) minmax(248px, 0.96fr);
  }
}

@media (max-width: 980px) {
  .job-page-header {
    grid-template-columns: 1fr;
    align-items: start;
  }

  .job-page-header-actions {
    align-self: start;
    justify-content: flex-start;
  }

  .job-header-support {
    flex-wrap: wrap;
  }
}
</style>
