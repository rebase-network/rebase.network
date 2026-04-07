<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  extractGeekDailyBodyNote,
  type AdminGeekDailyListItem,
  type AdminGeekDailyRecord,
} from '@rebase/shared';

import GeekDailyItemsField from '../components/GeekDailyItemsField.vue';
import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminFetchWithMeta, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus } from '../lib/format';

interface GeekDailyItemFormState {
  title: string;
  authorName: string;
  sourceUrl: string;
  summary: string;
}

interface GeekDailyFormState {
  episodeNumber: number;
  title: string;
  bodyMarkdown: string;
  status: 'draft' | 'published' | 'archived';
  items: GeekDailyItemFormState[];
}

const route = useRoute();
const router = useRouter();

const createBlankItem = (): GeekDailyItemFormState => ({
  title: '',
  authorName: '',
  sourceUrl: '',
  summary: '',
});

const createDefaultItems = () => Array.from({ length: 3 }, () => createBlankItem());

const createBlankForm = (): GeekDailyFormState => ({
  episodeNumber: 0,
  title: '',
  bodyMarkdown: '',
  status: 'draft',
  items: createDefaultItems(),
});

const form = reactive<GeekDailyFormState>(createBlankForm());
const record = ref<AdminGeekDailyRecord | null>(null);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const suggestedEpisodeNumber = ref(1);

const geekdailyId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => geekdailyId.value.length === 0);
const pageTitle = computed(() => (isNew.value ? '新增极客日报' : `编辑极客日报：#${record.value?.episodeNumber ?? ''}`));
const episodeSuggestionHint = computed(() => `建议值：第 ${suggestedEpisodeNumber.value} 期`);
const derivedTitle = computed(() => (form.episodeNumber > 0 ? `极客日报#${form.episodeNumber}` : '极客日报#'));
const statusLabel = computed(() => formatContentStatus(form.status));

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
    bodyMarkdown: extractGeekDailyBodyNote(payload.bodyMarkdown),
    status: payload.status,
    items: payload.items.length > 0 ? payload.items : createDefaultItems(),
  });
};

const suggestNextEpisodeNumber = async () => {
  try {
    const response = await adminFetchWithMeta<AdminGeekDailyListItem[]>('/api/admin/v1/geekdaily?page=1&pageSize=1');
    suggestedEpisodeNumber.value = (response.data[0]?.episodeNumber ?? 0) + 1;
  } catch {
    suggestedEpisodeNumber.value = 1;
  }

  if (isNew.value && form.episodeNumber <= 0) {
    form.episodeNumber = suggestedEpisodeNumber.value;
  }
};

const loadRecord = async () => {
  resetFeedback();
  loading.value = true;
  try {
    if (isNew.value) {
      record.value = null;
      Object.assign(form, createBlankForm());
      await suggestNextEpisodeNumber();
      return;
    }

    applyRecord(await adminFetch<AdminGeekDailyRecord>(`/api/admin/v1/geekdaily/${geekdailyId.value}`));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载极客日报详情。';
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
        },
      },
    );

    applyRecord(nextRecord);
    successMessage.value = isNew.value ? '极客日报已创建。' : '极客日报已保存。';

    if (isNew.value) {
      await router.replace(`/geekdaily/${nextRecord.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存极客日报。';
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
    successMessage.value = action === 'publish' ? '极客日报已发布。' : '极客日报已归档。';
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
        <p>期数内容与条目 · {{ statusLabel }}</p>
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
    <div v-if="loading" class="panel"><p>正在准备极客日报编辑器…</p></div>

    <section v-else class="panel stacked-gap editor-main">
      <div class="field-grid field-grid-1-compact">
        <label class="field">
          <div class="field-label-row">
            <span>期数编号</span>
            <small>{{ episodeSuggestionHint }}</small>
          </div>
          <input v-model.number="form.episodeNumber" type="number" min="1" />
          <small v-if="fieldIssues.episodeNumber" class="field-error">{{ fieldIssues.episodeNumber }}</small>
        </label>
      </div>

      <div class="field-shell compact-info-row">
        <strong>标题</strong>
        <span>{{ derivedTitle }}</span>
      </div>

      <GeekDailyItemsField v-model="form.items" />

      <div class="muted-row">保存时会自动把推荐条目、编辑和结尾拼进正文；点击发布时会自动写入发布时间。</div>
      <MarkdownEditorField v-model="form.bodyMarkdown" label="本期补充说明（可选）" placeholder="这里可以补充本期总述、关键词或额外说明。" />
    </section>
  </section>
</template>
