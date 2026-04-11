<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  registrationModeValues,
  type AdminEventRecord,
} from '@rebase/shared';

import AssetPickerField from '../components/AssetPickerField.vue';
import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, formatRegistrationMode, fromDateTimeInputValue, slugify, toDateTimeInputValue } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

interface EventFormState {
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  startAt: string;
  endAt: string;
  city: string;
  location: string;
  venue: string;
  coverAssetId: string;
  registrationMode: 'external_url' | 'announcement_only';
  registrationUrl: string;
  registrationNote: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string;
}

const route = useRoute();
const router = useRouter();

const createBlankForm = (): EventFormState => ({
  slug: '',
  title: '',
  summary: '',
  bodyMarkdown: '',
  startAt: '',
  endAt: '',
  city: '',
  location: '',
  venue: '',
  coverAssetId: '',
  registrationMode: 'external_url',
  registrationUrl: '',
  registrationNote: '',
  tags: [],
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  publishedAt: '',
});

const form = reactive<EventFormState>(createBlankForm());
const record = ref<AdminEventRecord | null>(null);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);

const eventId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => eventId.value.length === 0);
const publicUrl = computed(() => {
  if (!form.slug) {
    return '待生成';
  }

  const routeParam = form.startAt ? `${form.startAt.slice(0, 10)}-${form.slug}` : form.slug;
  return getPublicSiteUrl(`/events/${routeParam}`);
});
const pageTitle = computed(() => (isNew.value ? '新增活动' : `编辑活动：${record.value?.title ?? ''}`));
const statusLabel = computed(() => formatContentStatus(form.status));
const saveButtonLabel = computed(() => ((isNew.value || form.status === 'draft') ? '保存草稿' : '保存修改'));
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

const applyRecord = (payload: AdminEventRecord) => {
  record.value = payload;
  Object.assign(form, {
    slug: payload.slug,
    title: payload.title,
    summary: payload.summary,
    bodyMarkdown: payload.bodyMarkdown,
    startAt: toDateTimeInputValue(payload.startAt),
    endAt: toDateTimeInputValue(payload.endAt),
    city: payload.city,
    location: payload.location,
    venue: payload.venue,
    coverAssetId: payload.coverAssetId ?? '',
    registrationMode: payload.registrationMode,
    registrationUrl: payload.registrationUrl ?? '',
    registrationNote: payload.registrationNote ?? '',
    tags: payload.tags,
    seoTitle: payload.seoTitle,
    seoDescription: payload.seoDescription,
    status: payload.status,
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

    applyRecord(await adminFetch<AdminEventRecord>(`/api/admin/v1/events/${eventId.value}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载活动详情。';
  } finally {
    loading.value = false;
  }
};

const onTitleInput = () => {
  if (!slugTouched.value) {
    form.slug = slugify(form.title);
  }
};

const persist = async (nextStatus: EventFormState['status'], mode: 'save' | 'publish') => {
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
      coverAssetId: form.coverAssetId || null,
      registrationUrl: form.registrationUrl || null,
      publishedAt: fromDateTimeInputValue(form.publishedAt),
      startAt: fromDateTimeInputValue(form.startAt),
      endAt: fromDateTimeInputValue(form.endAt),
    };

    const nextRecord = await adminRequest<AdminEventRecord>(
      isNew.value ? '/api/admin/v1/events' : `/api/admin/v1/events/${eventId.value}`,
      { method: isNew.value ? 'POST' : 'PATCH', body: payload },
    );

    applyRecord(nextRecord);
    successMessage.value = mode === 'publish' ? '活动已发布。' : isNew.value ? '草稿已保存。' : '修改已保存。';
    if (isNew.value) {
      await router.replace(`/events/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : mode === 'publish' ? '发布失败。' : '无法保存活动。';
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
    const nextRecord = await adminRequest<AdminEventRecord>(`/api/admin/v1/events/${record.value.id}/${action}`, { method: 'POST' });
    applyRecord(nextRecord);
    successMessage.value = '活动已归档。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法执行该操作。';
  } finally {
    actioning.value = false;
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
        <p>先把活动详情写清楚，其余字段尽量精简。</p>
        <small class="panel-meta">{{ workflowHint }}</small>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/events">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving || actioning" @click="save">
          {{ saving ? '保存中…' : saveButtonLabel }}
        </button>
        <button v-if="canPublish" class="button-link" type="button" :disabled="loading || saving || actioning" @click="publish">
          {{ actioning ? '发布中…' : '发布' }}
        </button>
        <button v-if="canArchive" class="button-link button-danger" type="button" :disabled="saving || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备活动编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus event-editor-layout">
      <section class="panel stacked-gap editor-main event-editor-main">
        <div class="field-shell stacked-gap event-leading-fields">
          <div class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>标题</span>
            </div>
            <div class="field-inline-control">
              <input v-model="form.title" class="event-title-input" type="text" placeholder="Rebase Shanghai Builder Night" @input="onTitleInput" />
              <small v-if="fieldIssues.title" class="field-error">{{ fieldIssues.title }}</small>
            </div>
          </div>

          <div class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>摘要</span>
            </div>
            <div class="field-inline-control">
              <textarea v-model="form.summary" rows="2" placeholder="用一句话介绍这场活动的核心主题。" />
              <small v-if="fieldIssues.summary" class="field-error">{{ fieldIssues.summary }}</small>
            </div>
          </div>
        </div>

        <MarkdownEditorField
          v-model="form.bodyMarkdown"
          label="活动详情"
          placeholder="使用 Markdown 描述活动流程、议题和参与说明。"
          :rows="26"
        />
      </section>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap event-sidebar-card">
          <div class="panel-toolbar">
            <h3>发布设置</h3>
            <span class="status-pill">{{ statusLabel }}</span>
          </div>

          <dl class="summary-grid summary-grid-1 event-meta-grid">
            <div class="summary-item">
              <dt>公开地址</dt>
              <dd>{{ publicUrl }}</dd>
            </div>
            <div class="summary-item">
              <dt>最后更新</dt>
              <dd class="muted">{{ record ? formatDateTime(record.updatedAt) : '创建后生成' }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel stacked-gap event-sidebar-card">
          <div class="panel-toolbar">
            <h3>封面</h3>
            <div class="panel-meta">{{ form.coverAssetId ? '已设置' : '未设置' }}</div>
          </div>
          <AssetPickerField v-model="form.coverAssetId" label="封面资源" empty-label="当前未选择封面资源。" />
        </section>

        <section class="panel stacked-gap event-sidebar-card">
          <div class="panel-toolbar">
            <h3>时间与地点</h3>
            <div class="panel-meta">活动基础信息</div>
          </div>

          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="rebase-shanghai-builder-night" @input="slugTouched = true" />
            <small v-if="fieldIssues.slug" class="field-error">{{ fieldIssues.slug }}</small>
          </label>

          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>开始时间</span>
              <input v-model="form.startAt" type="datetime-local" />
            </label>
            <label class="field">
              <span>结束时间</span>
              <input v-model="form.endAt" type="datetime-local" />
            </label>
          </div>

          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>城市</span>
              <input v-model="form.city" type="text" placeholder="上海" />
            </label>
            <label class="field">
              <span>地点描述</span>
              <input v-model="form.location" type="text" placeholder="上海市静安区 / 线下空间" />
            </label>
          </div>
        </section>

        <section class="panel stacked-gap event-sidebar-card">
          <div class="panel-toolbar">
            <h3>报名设置</h3>
            <div class="panel-meta">{{ formatRegistrationMode(form.registrationMode) }}</div>
          </div>

          <label class="field">
            <span>报名模式</span>
            <select v-model="form.registrationMode">
              <option v-for="value in registrationModeValues" :key="value" :value="value">{{ formatRegistrationMode(value) }}</option>
            </select>
          </label>

          <label class="field">
            <span>报名链接</span>
            <input v-model="form.registrationUrl" :disabled="form.registrationMode !== 'external_url'" type="url" placeholder="https://lu.ma/..." />
          </label>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.event-editor-layout {
  grid-template-columns: minmax(0, 2.48fr) minmax(260px, 0.9fr);
}

.event-editor-main {
  gap: 0.75rem;
}

.event-leading-fields {
  gap: 0.65rem;
}

.event-title-input {
  font-size: 1.02rem;
  font-weight: 700;
}

.event-sidebar-card {
  gap: 0.7rem;
}

.event-meta-grid {
  gap: 0.55rem;
}

@media (max-width: 1280px) {
  .event-editor-layout {
    grid-template-columns: minmax(0, 2.18fr) minmax(240px, 0.92fr);
  }
}
</style>
