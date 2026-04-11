<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { type AdminJobRecord } from '@rebase/shared';

import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, fromDateInputValue, slugify, toDateInputValue } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

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

const route = useRoute();
const router = useRouter();

const createBlankForm = (): JobFormState => ({
  slug: '',
  companyName: '',
  roleTitle: '',
  salary: '',
  supportsRemote: false,
  workMode: 'full-time',
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

const jobId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => jobId.value.length === 0);
const publicUrl = computed(() => (form.slug ? getPublicSiteUrl(`/who-is-hiring/${form.slug}`) : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新增招聘' : `编辑招聘：${record.value?.roleTitle ?? ''}`));
const statusLabel = computed(() => formatContentStatus(form.status));
const publishedMetaLabel = computed(() => (record.value?.publishedAt ? formatDateTime(record.value.publishedAt) : '首次发布后生成'));
const updatedMetaLabel = computed(() => (record.value ? formatDateTime(record.value.updatedAt) : '创建后生成'));
const saveButtonLabel = computed(() => ((isNew.value || form.status === 'draft') ? '保存草稿' : '保存修改'));
const saveButtonClass = computed(() => ['button-link', !canPublish.value && 'button-primary'].filter(Boolean).join(' '));
const canPublish = computed(() => form.status !== 'published');
const canArchive = computed(() => Boolean(record.value) && form.status !== 'archived');
const workflowHint = computed(() => {
  if (isNew.value) {
    return '可先保存草稿，也可直接发布。';
  }

  if (form.status === 'published') {
    return '已发布内容保存后会直接更新前台。';
  }

  if (form.status === 'archived') {
    return '已归档内容仅后台可见，点击“发布”可重新上线。';
  }

  return '草稿内容仅后台可见，可继续修改后再发布。';
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
    workMode: payload.workMode,
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
  slugTouched.value = true;
};

const loadRecord = async () => {
  resetFeedback();
  loading.value = true;
  try {
    if (isNew.value) {
      record.value = null;
      slugTouched.value = false;
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
    const payload = {
      ...form,
      status: nextStatus,
      applyUrl: form.applyUrl || null,
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
watch(() => route.fullPath, () => void loadRecord());
onMounted(() => void loadRecord());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>招聘信息与投递方式</p>
        <small class="panel-meta">{{ workflowHint }}</small>
      </div>

      <div class="page-actions">
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
              <span>团队 / 公司</span>
              <input v-model="form.companyName" class="job-title-input" type="text" placeholder="Rebase Studio" />
            </label>
            <label class="field">
              <span>岗位名称</span>
              <input v-model="form.roleTitle" class="job-title-input" type="text" placeholder="前端工程师" />
            </label>
          </div>

          <div class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>摘要</span>
            </div>
            <div class="field-inline-control">
              <textarea v-model="form.summary" rows="2" placeholder="用一句话概括岗位和团队亮点。" />
            </div>
          </div>
        </div>

        <MarkdownEditorField
          v-model="form.descriptionMarkdown"
          label="岗位详情"
          placeholder="使用 Markdown 描述岗位职责、任职要求、团队背景和投递说明。"
          :rows="24"
        />
      </section>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap job-sidebar-card">
          <div class="panel-toolbar">
            <h3>发布设置</h3>
            <span class="status-pill">{{ statusLabel }}</span>
          </div>

          <dl class="summary-grid summary-grid-1 job-meta-grid">
            <div class="summary-item">
              <dt>公开地址</dt>
              <dd>{{ publicUrl }}</dd>
            </div>
            <div class="summary-item">
              <dt>首次发布</dt>
              <dd class="muted">{{ publishedMetaLabel }}</dd>
            </div>
            <div class="summary-item">
              <dt>最后更新</dt>
              <dd class="muted">{{ updatedMetaLabel }}</dd>
            </div>
          </dl>

          <label class="field">
            <span>截止日期</span>
            <input v-model="form.expiresAt" type="date" />
          </label>
        </section>

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
          </label>

          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>工作模式</span>
              <input v-model="form.workMode" type="text" placeholder="全职" />
            </label>
            <label class="field">
              <span>地点</span>
              <input v-model="form.location" type="text" placeholder="远程 / 中国时区优先" />
            </label>
          </div>

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
            <span>投递链接</span>
            <input v-model="form.applyUrl" type="url" placeholder="https://example.com/jobs/frontend-engineer" />
          </label>

          <label class="field">
            <span>投递说明</span>
            <input v-model="form.applyNote" type="text" placeholder="欢迎附上项目作品或写作样本。" />
          </label>

          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>联系方式标签</span>
              <input v-model="form.contactLabel" type="text" placeholder="telegram / 微信 / 邮箱" />
            </label>
            <label class="field">
              <span>联系方式值</span>
              <input v-model="form.contactValue" type="text" placeholder="@rebase_hiring" />
            </label>
          </div>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.job-editor-layout {
  grid-template-columns: minmax(0, 2.44fr) minmax(270px, 0.92fr);
}

.job-editor-main {
  gap: 0.75rem;
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

.job-meta-grid {
  gap: 0.55rem;
}

.job-remote-field {
  align-items: center;
}

@media (max-width: 1280px) {
  .job-editor-layout {
    grid-template-columns: minmax(0, 2.12fr) minmax(248px, 0.96fr);
  }
}
</style>
