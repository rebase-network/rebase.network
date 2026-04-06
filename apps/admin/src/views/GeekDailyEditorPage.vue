<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import { contentStatusOptions, type AdminGeekDailyRecord } from '@rebase/shared';

import GeekDailyItemsField from '../components/GeekDailyItemsField.vue';
import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import StringListField from '../components/StringListField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime, fromDateTimeInputValue, toDateTimeInputValue } from '../lib/format';

interface GeekDailyFormState {
  episodeNumber: number;
  title: string;
  summary: string;
  bodyMarkdown: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  publishedAt: string;
  items: Array<{ title: string; authorName: string; sourceUrl: string; summary: string }>;
}

const route = useRoute();
const router = useRouter();

const createBlankForm = (): GeekDailyFormState => ({
  episodeNumber: 0,
  title: '',
  summary: '',
  bodyMarkdown: '',
  tags: [],
  status: 'draft',
  publishedAt: '',
  items: [{ title: '', authorName: '', sourceUrl: '', summary: '' }],
});

const form = reactive<GeekDailyFormState>(createBlankForm());
const record = ref<AdminGeekDailyRecord | null>(null);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});

const geekdailyId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => geekdailyId.value.length === 0);
const publicUrl = computed(() => (form.episodeNumber > 0 ? `/geekdaily/episode-${form.episodeNumber}` : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新增 GeekDaily' : `编辑 GeekDaily：#${record.value?.episodeNumber ?? ''}`));

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const applyRecord = (payload: AdminGeekDailyRecord) => {
  record.value = payload;
  Object.assign(form, {
    episodeNumber: payload.episodeNumber,
    title: payload.title,
    summary: payload.summary,
    bodyMarkdown: payload.bodyMarkdown,
    tags: payload.tags,
    status: payload.status,
    publishedAt: toDateTimeInputValue(payload.publishedAt),
    items: payload.items.length > 0 ? payload.items : [{ title: '', authorName: '', sourceUrl: '', summary: '' }],
  });
};

const loadRecord = async () => {
  resetFeedback();
  loading.value = true;
  try {
    if (isNew.value) {
      record.value = null;
      Object.assign(form, createBlankForm());
      return;
    }

    applyRecord(await adminFetch<AdminGeekDailyRecord>(`/api/admin/v1/geekdaily/${geekdailyId.value}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载 GeekDaily 详情。';
  } finally {
    loading.value = false;
  }
};

const syncDerivedTitle = () => {
  if (form.episodeNumber > 0 && (!form.title || /^极客日报#\d+$/.test(form.title))) {
    form.title = `极客日报#${form.episodeNumber}`;
  }
};

const save = async () => {
  resetFeedback();
  saving.value = true;
  try {
    const nextRecord = await adminRequest<AdminGeekDailyRecord>(
      isNew.value ? '/api/admin/v1/geekdaily' : `/api/admin/v1/geekdaily/${geekdailyId.value}`,
      {
        method: isNew.value ? 'POST' : 'PATCH',
        body: {
          ...form,
          publishedAt: fromDateTimeInputValue(form.publishedAt),
        },
      },
    );

    applyRecord(nextRecord);
    successMessage.value = isNew.value ? 'GeekDaily 已创建。' : 'GeekDaily 已保存。';

    if (isNew.value) {
      await router.replace(`/geekdaily/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存 GeekDaily。';
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
    const nextRecord = await adminRequest<AdminGeekDailyRecord>(`/api/admin/v1/geekdaily/${record.value.id}/${action}`, { method: 'POST' });
    applyRecord(nextRecord);
    successMessage.value = action === 'publish' ? 'GeekDaily 已发布。' : 'GeekDaily 已归档。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法执行该操作。';
  } finally {
    actioning.value = false;
  }
};

watch(() => form.episodeNumber, () => syncDerivedTitle());
watch(() => route.fullPath, () => void loadRecord());
onMounted(() => void loadRecord());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>以 episode 为中心维护每日推荐内容，并服务前台归档、搜索与 RSS 输出。</p>
      </div>
      <div class="page-actions">
        <RouterLink class="button-link" to="/geekdaily">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '创建一期' : '保存修改' }}
        </button>
        <button class="button-link" type="button" :disabled="!record || actioning" @click="runAction('publish')">发布</button>
        <button class="button-link button-danger" type="button" :disabled="!record || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备 GeekDaily 编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <section class="panel stacked-gap editor-main">
        <div class="field-grid field-grid-3">
          <label class="field">
            <span>Episode 编号</span>
            <input v-model.number="form.episodeNumber" type="number" min="1" />
            <small v-if="fieldIssues.episodeNumber" class="field-error">{{ fieldIssues.episodeNumber }}</small>
          </label>
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
        </div>

        <label class="field">
          <span>标题</span>
          <input v-model="form.title" type="text" placeholder="极客日报#1915" />
        </label>

        <label class="field">
          <span>摘要</span>
          <textarea v-model="form.summary" rows="3" placeholder="用一句话概括本期 GeekDaily 的重点。" />
        </label>

        <StringListField v-model="form.tags" label="标签" add-label="新增标签" placeholder="ai" />
        <GeekDailyItemsField v-model="form.items" />
        <MarkdownEditorField v-model="form.bodyMarkdown" label="正文说明" placeholder="这里可以补充本期总述、关键词和额外说明。" />
      </section>

      <aside class="panel stacked-gap editor-sidebar">
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">public url</span>
          <strong>{{ publicUrl }}</strong>
          <p>读者通过固定的 episode URL 访问具体期数内容。</p>
        </article>
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">items</span>
          <strong>{{ form.items.length }}</strong>
          <p>推荐条目会同时参与前台搜索索引与 RSS 摘要生成。</p>
        </article>
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">updated at</span>
          <strong>{{ formatDateTime(record?.updatedAt) }}</strong>
          <p>若导入历史数据，建议优先核对 episode 编号和发布时间。</p>
        </article>
      </aside>
    </div>
  </section>
</template>
