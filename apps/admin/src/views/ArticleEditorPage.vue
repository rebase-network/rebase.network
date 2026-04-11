<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  type AdminArticleRecord,
} from '@rebase/shared';

import AssetPickerField from '../components/AssetPickerField.vue';
import AuthorsField from '../components/AuthorsField.vue';
import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatContentStatus, formatDateTime, fromDateTimeInputValue, slugify, toDateTimeInputValue } from '../lib/format';
import { getPublicSiteUrl } from '../lib/runtime-config';

interface ArticleFormState {
  slug: string;
  title: string;
  summary: string;
  bodyMarkdown: string;
  readingTime: string;
  coverAssetId: string;
  coverAccent: string;
  authors: Array<{ name: string; role?: string }>;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt: string;
}

const route = useRoute();
const router = useRouter();

const createBlankForm = (): ArticleFormState => ({
  slug: '',
  title: '',
  summary: '',
  bodyMarkdown: '',
  readingTime: '5 min read',
  coverAssetId: '',
  coverAccent: 'linear-gradient(135deg, #efc37b 0%, #0f766e 100%)',
  authors: [{ name: '', role: '' }],
  tags: [],
  seoTitle: '',
  seoDescription: '',
  status: 'draft',
  publishedAt: '',
});

const form = reactive<ArticleFormState>(createBlankForm());
const article = ref<AdminArticleRecord | null>(null);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);

const articleId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => articleId.value.length === 0);
const publicUrl = computed(() => (form.slug ? getPublicSiteUrl(`/articles/${form.slug}`) : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新建文章' : `编辑文章：${article.value?.title ?? ''}`));
const statusLabel = computed(() => formatContentStatus(form.status));
const workflowHint = computed(() => {
  if (isNew.value) {
    return '先保存草稿，再点击“发布”，前台才会显示。';
  }

  if (form.status === 'published') {
    return '已发布内容继续使用“保存修改”。';
  }

  if (form.status === 'archived') {
    return '已归档内容仅后台可见。';
  }

  return '草稿内容仅后台可见，点击“发布”后前台才会显示。';
});

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const applyRecord = (record: AdminArticleRecord) => {
  article.value = record;
  Object.assign(form, {
    slug: record.slug,
    title: record.title,
    summary: record.summary,
    bodyMarkdown: record.bodyMarkdown,
    readingTime: record.readingTime,
    coverAssetId: record.coverAssetId ?? '',
    coverAccent: record.coverAccent,
    authors: record.authors.length > 0 ? record.authors : [{ name: '', role: '' }],
    tags: record.tags,
    seoTitle: record.seoTitle,
    seoDescription: record.seoDescription,
    status: record.status,
    publishedAt: toDateTimeInputValue(record.publishedAt),
  });
  slugTouched.value = true;
};

const loadArticle = async () => {
  resetFeedback();
  loading.value = true;
  try {
    if (isNew.value) {
      article.value = null;
      slugTouched.value = false;
      Object.assign(form, createBlankForm());
      return;
    }

    const record = await adminFetch<AdminArticleRecord>(`/api/admin/v1/articles/${articleId.value}`);
    applyRecord(record);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载文章详情。';
  } finally {
    loading.value = false;
  }
};

const onTitleInput = () => {
  if (!slugTouched.value) {
    form.slug = slugify(form.title);
  }
};

const onSlugInput = () => {
  slugTouched.value = true;
};

const save = async () => {
  resetFeedback();
  saving.value = true;
  try {
    const payload = {
      ...form,
      readingTime: form.readingTime || '5 min read',
      coverAccent: form.coverAccent || 'linear-gradient(135deg, #efc37b 0%, #0f766e 100%)',
      coverAssetId: form.coverAssetId || null,
      publishedAt: fromDateTimeInputValue(form.publishedAt),
    };

    const record = await adminRequest<AdminArticleRecord>(
      isNew.value ? '/api/admin/v1/articles' : `/api/admin/v1/articles/${articleId.value}`,
      {
        method: isNew.value ? 'POST' : 'PATCH',
        body: payload,
      },
    );

    applyRecord(record);
    successMessage.value = isNew.value ? '草稿已保存。' : '修改已保存。';

    if (isNew.value) {
      await router.replace(`/articles/${record.id}/edit`);
    }
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存文章。';
  } finally {
    saving.value = false;
  }
};

const runAction = async (action: 'publish' | 'archive') => {
  if (!article.value) {
    return;
  }

  resetFeedback();
  actioning.value = true;
  try {
    const record = await adminRequest<AdminArticleRecord>(`/api/admin/v1/articles/${article.value.id}/${action}`, { method: 'POST' });
    applyRecord(record);
    successMessage.value = action === 'publish' ? '文章已发布。' : '文章已归档。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法执行该操作。';
  } finally {
    actioning.value = false;
  }
};

watch(() => route.fullPath, () => void loadArticle());
onMounted(() => void loadArticle());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>{{ pageTitle }}</h2>
        <p>优先完成正文，其余字段保持精简。</p>
        <small class="panel-meta">{{ workflowHint }}</small>
      </div>

      <div class="page-actions">
        <RouterLink class="button-link" to="/articles">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '保存草稿' : '保存修改' }}
        </button>
        <button class="button-link" type="button" :disabled="!article || actioning" @click="runAction('publish')">发布</button>
        <button class="button-link button-danger" type="button" :disabled="!article || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备文章编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus article-editor-layout">
      <section class="panel stacked-gap editor-main article-editor-main">
        <div class="field-shell stacked-gap article-leading-fields">
          <div class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>标题</span>
            </div>
            <div class="field-inline-control">
              <input
                v-model="form.title"
                class="article-title-input"
                type="text"
                placeholder="把 Rebase 做成一个持续更新的社区媒体站点"
                @input="onTitleInput"
              />
              <small v-if="fieldIssues.title" class="field-error">{{ fieldIssues.title }}</small>
            </div>
          </div>

          <div class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>摘要</span>
            </div>
            <div class="field-inline-control">
              <textarea v-model="form.summary" rows="2" placeholder="用一句话描述这篇文章的意义。" />
              <small v-if="fieldIssues.summary" class="field-error">{{ fieldIssues.summary }}</small>
            </div>
          </div>
        </div>

        <MarkdownEditorField
          v-model="form.bodyMarkdown"
          label="正文"
          placeholder="使用 Markdown 编写文章正文。"
          :error="fieldIssues.bodyMarkdown"
          :rows="28"
        />
      </section>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap article-sidebar-card">
          <div class="panel-toolbar">
            <h3>发布设置</h3>
            <span class="status-pill">{{ statusLabel }}</span>
          </div>

          <dl class="summary-grid summary-grid-1 article-meta-grid">
            <div class="summary-item">
              <dt>公开地址</dt>
              <dd>{{ publicUrl }}</dd>
            </div>
            <div class="summary-item">
              <dt>最后更新</dt>
              <dd class="muted">{{ article ? formatDateTime(article.updatedAt) : '创建后生成' }}</dd>
            </div>
          </dl>
        </section>

        <section class="panel stacked-gap article-sidebar-card">
          <div class="panel-toolbar">
            <h3>封面</h3>
            <div class="panel-meta">{{ form.coverAssetId ? '已设置' : '未设置' }}</div>
          </div>
          <AssetPickerField v-model="form.coverAssetId" label="封面资源" empty-label="当前未选择封面资源。" />
        </section>

        <section class="panel stacked-gap article-sidebar-card">
          <div class="panel-toolbar">
            <h3>链接与作者</h3>
            <div class="panel-meta">基础信息</div>
          </div>

          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="building-rebase-in-public" @input="onSlugInput" />
            <small v-if="fieldIssues.slug" class="field-error">{{ fieldIssues.slug }}</small>
          </label>

          <AuthorsField v-model="form.authors" :show-role="false" compact />
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.article-editor-layout {
  grid-template-columns: minmax(0, 2.55fr) minmax(260px, 0.86fr);
}

.article-editor-main {
  gap: 0.75rem;
}

.article-leading-fields {
  gap: 0.65rem;
}

.article-title-input {
  font-size: 1.02rem;
  font-weight: 700;
}

.article-sidebar-card {
  gap: 0.7rem;
}

.article-meta-grid {
  gap: 0.55rem;
}

@media (max-width: 1280px) {
  .article-editor-layout {
    grid-template-columns: minmax(0, 2.2fr) minmax(240px, 0.9fr);
  }
}
</style>
