<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  extractGeekDailyBodyNote,
  type AdminGeekDailyListItem,
  type AdminGeekDailyRecord,
  type AdminMePayload,
} from '@rebase/shared';

import GeekDailyItemsField from '../components/GeekDailyItemsField.vue';
import { adminFetch, adminFetchWithMeta, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus } from '../lib/format';
import { buildGeekDailyWechatHtml, getGeekDailyWechatGenerationIssue } from '../lib/geekdaily-wechat';

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
const currentEditorName = ref('');
const activeWechatTab = ref<'preview' | 'source'>('preview');
const copyFeedback = ref('');
let copyFeedbackTimer: number | null = null;

const geekdailyId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => geekdailyId.value.length === 0);
const pageTitle = computed(() => (isNew.value ? '新增极客日报' : `编辑极客日报：#${record.value?.episodeNumber ?? ''}`));
const episodeSuggestionHint = computed(() => `建议值：第 ${suggestedEpisodeNumber.value} 期`);
const derivedTitle = computed(() => (form.episodeNumber > 0 ? `极客日报#${form.episodeNumber}` : '极客日报#'));
const statusLabel = computed(() => formatContentStatus(form.status));
const currentEditorLabel = computed(() => currentEditorName.value || '当前编辑');
const wechatInput = computed(() => ({
  episodeNumber: form.episodeNumber,
  editorName: currentEditorLabel.value,
  bodyMarkdown: form.bodyMarkdown,
  items: form.items,
}));
const wechatGenerationIssue = computed(() => getGeekDailyWechatGenerationIssue(wechatInput.value));
const wechatIssueTone = computed(() => (form.items.length > 3 ? 'exception' : 'warning'));
const wechatHtml = computed(() => buildGeekDailyWechatHtml(wechatInput.value));
const canCopyWechatHtml = computed(() => !wechatGenerationIssue.value && wechatHtml.value.length > 0);

const extractPlainTextFromHtml = (html: string) => {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container.textContent?.trim() ?? '';
};

const copyRichHtmlFallback = (html: string, plainText: string) =>
  new Promise<void>((resolve, reject) => {
    const container = document.createElement('div');
    const selection = window.getSelection();

    container.innerHTML = html;
    container.setAttribute('contenteditable', 'true');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.opacity = '0';
    document.body.appendChild(container);

    const listener = (event: ClipboardEvent) => {
      event.preventDefault();
      event.clipboardData?.setData('text/html', html);
      event.clipboardData?.setData('text/plain', plainText);
    };

    document.addEventListener('copy', listener);

    try {
      const range = document.createRange();
      range.selectNodeContents(container);
      selection?.removeAllRanges();
      selection?.addRange(range);

      const copied = document.execCommand('copy');
      selection?.removeAllRanges();
      document.removeEventListener('copy', listener);
      document.body.removeChild(container);

      if (!copied) {
        reject(new Error('当前浏览器不支持复制富文本内容。'));
        return;
      }

      resolve();
    } catch (error) {
      selection?.removeAllRanges();
      document.removeEventListener('copy', listener);
      document.body.removeChild(container);
      reject(error);
    }
  });

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const setCopyFeedback = (message: string) => {
  copyFeedback.value = message;

  if (copyFeedbackTimer !== null) {
    window.clearTimeout(copyFeedbackTimer);
  }

  copyFeedbackTimer = window.setTimeout(() => {
    copyFeedback.value = '';
    copyFeedbackTimer = null;
  }, 1800);
};

const applyRecord = (payload: AdminGeekDailyRecord) => {
  record.value = payload;
  Object.assign(form, {
    episodeNumber: payload.episodeNumber,
    title: payload.title,
    bodyMarkdown: extractGeekDailyBodyNote(payload.bodyMarkdown),
    status: payload.status,
    items: payload.items.length > 0 ? payload.items.map((item) => ({ ...item })) : createDefaultItems(),
  });
};

const loadCurrentEditor = async () => {
  try {
    const me = await adminFetch<AdminMePayload>('/api/admin/v1/me');
    currentEditorName.value = me.staffAccount?.displayName ?? me.user?.name ?? '';
  } catch {
    currentEditorName.value = '';
  }
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

    const [payload] = await Promise.all([
      adminFetch<AdminGeekDailyRecord>(`/api/admin/v1/geekdaily/${geekdailyId.value}`),
      suggestNextEpisodeNumber(),
    ]);
    applyRecord(payload);
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

const copyWechatHtml = async () => {
  const nextValue = wechatHtml.value.trim();

  if (!nextValue) {
    errorMessage.value = '当前没有可复制的微信内容。';
    return;
  }

  try {
    const plainText = extractPlainTextFromHtml(nextValue);

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([nextValue], { type: 'text/html' }),
          'text/plain': new Blob([plainText], { type: 'text/plain' }),
        }),
      ]);
    } else {
      await copyRichHtmlFallback(nextValue, plainText);
    }

    setCopyFeedback('已复制微信内容。');
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法复制微信内容。';
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

onMounted(() => {
  void loadCurrentEditor();
  void loadRecord();
});

onBeforeUnmount(() => {
  if (copyFeedbackTimer !== null) {
    window.clearTimeout(copyFeedbackTimer);
  }
});
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

    <div v-else class="geekdaily-workspace">
      <section class="panel stacked-gap geekdaily-editor-column">
        <div class="field-grid field-grid-1-compact">
          <label class="field-inline-row">
            <div class="field-inline-label">
              <span>期数编号</span>
            </div>
            <div class="field-inline-control">
              <div class="field-inline-meta-row">
                <input v-model.number="form.episodeNumber" class="short-input" type="number" min="1" />
                <small class="field-inline-hint">{{ episodeSuggestionHint }}</small>
              </div>
              <small v-if="fieldIssues.episodeNumber" class="field-error">{{ fieldIssues.episodeNumber }}</small>
            </div>
          </label>
        </div>

        <div class="field-shell compact-info-row">
          <strong>标题</strong>
          <span>{{ derivedTitle }}</span>
        </div>

        <div class="field-shell compact-info-row">
          <strong>本期编辑</strong>
          <span>{{ currentEditorLabel }}</span>
        </div>

        <GeekDailyItemsField v-model="form.items" />

        <label class="field-inline-row geekdaily-note-field">
          <div class="field-inline-label">
            <span>补充说明</span>
            <small>可选，支持 Markdown，仅用于站内正文，不进入微信稿。</small>
          </div>
          <div class="field-inline-control">
            <textarea v-model="form.bodyMarkdown" rows="12" placeholder="补充本期导语、额外说明或备注。" />
          </div>
        </label>

        <div class="muted-row">保存时会同步生成站内正文；右侧可直接复制微信公众号使用的 HTML 模板。</div>
      </section>

      <aside class="panel stacked-gap geekdaily-preview-column sticky-stack">
        <div class="field-row field-row-spread">
          <div class="stacked-gap-tight">
            <strong>微信公众号稿件</strong>
            <small class="panel-meta">编辑完成后可直接复制富文本内容，粘贴到微信公众号后台。</small>
          </div>
          <button class="button-link button-primary" type="button" :disabled="!canCopyWechatHtml" @click="copyWechatHtml">
            {{ copyFeedback ? '已复制' : '复制微信内容' }}
          </button>
        </div>

        <div class="field-row field-row-spread geekdaily-preview-tabs">
          <div class="tab-strip">
            <button class="tab-button" :class="{ 'is-active': activeWechatTab === 'preview' }" type="button" @click="activeWechatTab = 'preview'">
              微信公众号预览
            </button>
            <button class="tab-button" :class="{ 'is-active': activeWechatTab === 'source' }" type="button" @click="activeWechatTab = 'source'">
              HTML 源码
            </button>
          </div>
          <small class="preview-label">{{ activeWechatTab === 'preview' ? '实时预览' : '源码查看' }}</small>
        </div>

        <div
          v-if="wechatGenerationIssue"
          class="inline-status"
          :class="wechatIssueTone === 'exception' ? 'inline-status-exception' : 'inline-status-warning'"
        >
          {{ wechatGenerationIssue }}
        </div>
        <div v-else-if="copyFeedback" class="inline-status inline-status-success">{{ copyFeedback }}</div>

        <div v-if="activeWechatTab === 'preview'" class="geekdaily-preview-shell">
          <article v-if="wechatHtml" class="geekdaily-preview-frame" v-html="wechatHtml" />
          <div v-else class="empty-inline">填写完整的 3 条推荐后，这里会生成微信公众号预览。</div>
        </div>

        <div v-else class="geekdaily-source-shell">
          <textarea
            class="geekdaily-source-code"
            readonly
            rows="30"
            :value="wechatHtml || '填写完整的 3 条推荐后，这里会生成 HTML 源码。'"
          />
        </div>
      </aside>
    </div>
  </section>
</template>
