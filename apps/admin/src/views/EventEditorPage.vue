<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  contentStatusOptions,
  registrationModeValues,
  type AdminAssetRecord,
  type AdminEventRecord,
} from '@rebase/shared';

import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import StringListField from '../components/StringListField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime, fromDateTimeInputValue, slugify, toDateTimeInputValue } from '../lib/format';

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
const assets = ref<AdminAssetRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);

const eventId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => eventId.value.length === 0);
const publicUrl = computed(() => (form.slug ? `/events/${form.slug}` : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新增活动' : `编辑活动：${record.value?.title ?? ''}`));

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
    assets.value = await adminFetch<AdminAssetRecord[]>('/api/admin/v1/assets');

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

const save = async () => {
  resetFeedback();
  saving.value = true;
  try {
    const payload = {
      ...form,
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
    successMessage.value = isNew.value ? '活动已创建。' : '活动已保存。';
    if (isNew.value) {
      await router.replace(`/events/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存活动。';
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
    const nextRecord = await adminRequest<AdminEventRecord>(`/api/admin/v1/events/${record.value.id}/${action}`, { method: 'POST' });
    applyRecord(nextRecord);
    successMessage.value = action === 'publish' ? '活动已发布。' : '活动已归档。';
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
        <p>维护当前活动与历史活动，并为公开页提供清晰的时间地点和报名说明。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/events">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '创建活动' : '保存修改' }}
        </button>
        <button class="button-link" type="button" :disabled="!record || actioning" @click="runAction('publish')">发布</button>
        <button class="button-link button-danger" type="button" :disabled="!record || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备活动编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <section class="panel stacked-gap editor-main">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>活动标题</span>
            <input v-model="form.title" type="text" placeholder="Rebase Shanghai Builder Night" @input="onTitleInput" />
          </label>
          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="rebase-shanghai-builder-night" @input="slugTouched = true" />
          </label>
        </div>

        <label class="field">
          <span>摘要</span>
          <textarea v-model="form.summary" rows="3" placeholder="用一句话介绍这场活动的核心主题。" />
        </label>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>开始时间</span>
            <input v-model="form.startAt" type="datetime-local" />
          </label>
          <label class="field">
            <span>结束时间</span>
            <input v-model="form.endAt" type="datetime-local" />
          </label>
        </div>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>城市</span>
            <input v-model="form.city" type="text" placeholder="Shanghai" />
          </label>
          <label class="field">
            <span>地点描述</span>
            <input v-model="form.location" type="text" placeholder="Shanghai downtown" />
          </label>
          <label class="field">
            <span>场地</span>
            <input v-model="form.venue" type="text" placeholder="Co-working cafe" />
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
            <span>公开发布时间</span>
            <input v-model="form.publishedAt" type="datetime-local" />
          </label>
          <label class="field">
            <span>封面资源</span>
            <select v-model="form.coverAssetId">
              <option value="">不使用封面资源</option>
              <option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.originalFilename }}</option>
            </select>
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>报名模式</span>
            <select v-model="form.registrationMode">
              <option v-for="value in registrationModeValues" :key="value" :value="value">{{ value }}</option>
            </select>
          </label>
          <label class="field">
            <span>报名链接</span>
            <input v-model="form.registrationUrl" :disabled="form.registrationMode !== 'external_url'" type="url" placeholder="https://lu.ma/..." />
          </label>
        </div>

        <label class="field">
          <span>报名说明</span>
          <input v-model="form.registrationNote" type="text" placeholder="适合 builder、研究员和社区运营者参与。" />
        </label>

        <StringListField v-model="form.tags" label="标签" add-label="新增标签" placeholder="ai" />

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

        <MarkdownEditorField v-model="form.bodyMarkdown" label="活动详情" placeholder="使用 Markdown 描述活动流程、议题和参与说明。" />
      </section>

      <aside class="panel stacked-gap editor-sidebar">
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">public url</span>
          <strong>{{ publicUrl }}</strong>
          <p>公开页后续可继续升级成带日期前缀的稳定 URL。</p>
        </article>
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">registration</span>
          <strong>{{ form.registrationMode }}</strong>
          <p>{{ form.registrationUrl || form.registrationNote || '暂未填写报名信息' }}</p>
        </article>
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">updated at</span>
          <strong>{{ formatDateTime(record?.updatedAt) }}</strong>
          <p>活动发布后建议手动检查时间、地点和报名链接是否正确。</p>
        </article>
      </aside>
    </div>
  </section>
</template>
