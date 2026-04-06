<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { contentStatusOptions, type AdminJobRecord } from '@rebase/shared';

import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import StringListField from '../components/StringListField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, fromDateTimeInputValue, slugify, toDateTimeInputValue } from '../lib/format';

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
  responsibilities: string[];
  applyUrl: string;
  applyNote: string;
  contactLabel: string;
  contactValue: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'published' | 'archived';
  expiresAt: string;
  publishedAt: string;
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
  responsibilities: [],
  applyUrl: '',
  applyNote: '',
  contactLabel: '',
  contactValue: '',
  tags: [],
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  expiresAt: '',
  publishedAt: '',
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
const publicUrl = computed(() => (form.slug ? `/who-is-hiring/${form.slug}` : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新增招聘' : `编辑招聘：${record.value?.roleTitle ?? ''}`));
const deliverySummary = computed(() => form.applyUrl || form.contactValue || '未填写');
const workModeSummary = computed(() => [form.workMode, form.location].filter(Boolean).join(' / ') || '未填写');
const tagSummary = computed(() => form.tags.join('、') || '未填写');

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
    responsibilities: payload.responsibilities,
    applyUrl: payload.applyUrl ?? '',
    applyNote: payload.applyNote ?? '',
    contactLabel: payload.contactLabel ?? '',
    contactValue: payload.contactValue ?? '',
    tags: payload.tags,
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    status: payload.status,
    expiresAt: toDateTimeInputValue(payload.expiresAt),
    publishedAt: toDateTimeInputValue(payload.publishedAt),
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

const save = async () => {
  resetFeedback();
  saving.value = true;
  try {
    const payload = {
      ...form,
      applyUrl: form.applyUrl || null,
      expiresAt: fromDateTimeInputValue(form.expiresAt),
      publishedAt: fromDateTimeInputValue(form.publishedAt),
    };

    const nextRecord = await adminRequest<AdminJobRecord>(
      isNew.value ? '/api/admin/v1/jobs' : `/api/admin/v1/jobs/${jobId.value}`,
      { method: isNew.value ? 'POST' : 'PATCH', body: payload },
    );

    applyRecord(nextRecord);
    successMessage.value = isNew.value ? '招聘信息已创建。' : '招聘信息已保存。';

    if (isNew.value) {
      await router.replace(`/jobs/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存招聘信息。';
  } finally {
    saving.value = false;
  }
};

const runAction = async (action: 'publish' | 'archive') => {
  if (!record.value) {
    return;
  }

  actioning.value = true;
  resetFeedback();
  try {
    const nextRecord = await adminRequest<AdminJobRecord>(`/api/admin/v1/jobs/${record.value.id}/${action}`, { method: 'POST' });
    applyRecord(nextRecord);
    successMessage.value = action === 'publish' ? '招聘信息已发布。' : '招聘信息已归档。';
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
      </div>

      <div class="page-actions">
        <RouterLink class="button-link" to="/jobs">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '创建招聘' : '保存修改' }}
        </button>
        <button class="button-link" type="button" :disabled="!record || actioning" @click="runAction('publish')">发布</button>
        <button class="button-link button-danger" type="button" :disabled="!record || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备招聘编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus editor-grid-summary">
      <section class="panel stacked-gap editor-main">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>团队 / 公司</span>
            <input v-model="form.companyName" type="text" placeholder="Rebase Studio" />
          </label>
          <label class="field">
            <span>岗位名称</span>
            <input v-model="form.roleTitle" type="text" placeholder="frontend engineer" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="frontend-engineer-community-platform" @input="slugTouched = true" />
            <small v-if="fieldIssues.slug" class="field-error">{{ fieldIssues.slug }}</small>
          </label>
          <label class="field">
            <span>薪资范围</span>
            <input v-model="form.salary" type="text" placeholder="$5,000 - $8,500 / month" />
          </label>
        </div>

        <label class="field">
          <span>摘要</span>
          <textarea v-model="form.summary" rows="3" placeholder="用一句话概括岗位和团队亮点。" />
        </label>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>工作模式</span>
            <input v-model="form.workMode" type="text" placeholder="full-time" />
          </label>
          <label class="field">
            <span>地点</span>
            <input v-model="form.location" type="text" placeholder="remote / china time zone preferred" />
          </label>
          <label class="field checkbox-field">
            <span>支持远程</span>
            <input v-model="form.supportsRemote" type="checkbox" />
          </label>
        </div>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>状态</span>
            <select v-model="form.status">
              <option v-for="option in contentStatusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
            </select>
          </label>
          <label class="field">
            <span>发布时间</span>
            <input v-model="form.publishedAt" type="datetime-local" />
          </label>
          <label class="field">
            <span>过期时间</span>
            <input v-model="form.expiresAt" type="datetime-local" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>投递链接</span>
            <input v-model="form.applyUrl" type="url" placeholder="https://example.com/jobs/frontend-engineer" />
          </label>
          <label class="field">
            <span>投递说明</span>
            <input v-model="form.applyNote" type="text" placeholder="欢迎附上项目作品或写作样本。" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>联系方式标签</span>
            <input v-model="form.contactLabel" type="text" placeholder="telegram" />
          </label>
          <label class="field">
            <span>联系方式值</span>
            <input v-model="form.contactValue" type="text" placeholder="@rebase_hiring" />
          </label>
        </div>

        <StringListField v-model="form.responsibilities" label="工作内容 / 职责" add-label="新增职责" placeholder="实现 Astro 前端体验" />
        <StringListField v-model="form.tags" label="标签" add-label="新增标签" placeholder="frontend" />

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>SEO 标题</span>
            <input v-model="form.seoTitle" type="text" placeholder="可选" />
          </label>
          <label class="field">
            <span>SEO 描述</span>
            <input v-model="form.seoDescription" type="text" placeholder="可选" />
          </label>
        </div>

        <MarkdownEditorField v-model="form.descriptionMarkdown" label="岗位详情" placeholder="使用 Markdown 描述岗位背景、要求和团队信息。" />
      </section>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>发布信息</h3>
            <div class="panel-meta">{{ formatContentStatus(form.status) }}</div>
          </div>
          <dl class="summary-grid">
            <div class="summary-item">
              <dt>公开地址</dt>
              <dd>{{ publicUrl }}</dd>
            </div>
            <div class="summary-item">
              <dt>发布时间</dt>
              <dd class="muted">{{ form.publishedAt || '未设置' }}</dd>
            </div>
            <div class="summary-item">
              <dt>过期时间</dt>
              <dd class="muted">{{ form.expiresAt || '未设置' }}</dd>
            </div>
            <div class="summary-item">
              <dt>更新时间</dt>
              <dd class="muted">{{ record ? formatDateTime(record.updatedAt) : '新建后生成' }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>投递摘要</h3>
            <div class="panel-meta">{{ form.supportsRemote ? '支持远程' : '现场为主' }}</div>
          </div>
          <dl class="summary-grid">
            <div class="summary-item">
              <dt>投递方式</dt>
              <dd class="muted">{{ deliverySummary }}</dd>
            </div>
            <div class="summary-item">
              <dt>工作模式</dt>
              <dd class="muted">{{ workModeSummary }}</dd>
            </div>
            <div class="summary-item">
              <dt>薪资范围</dt>
              <dd class="muted">{{ form.salary || '未填写' }}</dd>
            </div>
            <div class="summary-item">
              <dt>标签</dt>
              <dd class="muted">{{ tagSummary }}</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  </section>
</template>
