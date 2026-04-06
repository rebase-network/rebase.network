<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';

import {
  contentStatusOptions,
  type AdminArticleRecord,
  type AdminAssetRecord,
} from '@rebase/shared';

import AuthorsField from '../components/AuthorsField.vue';
import MarkdownEditorField from '../components/MarkdownEditorField.vue';
import StringListField from '../components/StringListField.vue';
import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime, fromDateTimeInputValue, slugify, toDateTimeInputValue } from '../lib/format';

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
const assets = ref<AdminAssetRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const actioning = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const slugTouched = ref(false);

const articleId = computed(() => (typeof route.params.id === 'string' ? route.params.id : ''));
const isNew = computed(() => articleId.value.length === 0);
const publicUrl = computed(() => (form.slug ? `/articles/${form.slug}` : '待生成'));
const pageTitle = computed(() => (isNew.value ? '新建文章' : `编辑文章：${article.value?.title ?? ''}`));
const selectedCoverAsset = computed(() => assets.value.find((asset) => asset.id === form.coverAssetId) ?? null);

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
    assets.value = await adminFetch<AdminAssetRecord[]>('/api/admin/v1/assets');

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
    successMessage.value = isNew.value ? '文章已创建。' : '文章已保存。';

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
        <p>使用 Markdown 和结构化字段维护 Rebase 社区文章。</p>
      </div>

      <div class="page-actions">
        <RouterLink class="button-link" to="/articles">返回列表</RouterLink>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="save">
          {{ saving ? '保存中…' : isNew ? '创建文章' : '保存修改' }}
        </button>
        <button class="button-link" type="button" :disabled="!article || actioning" @click="runAction('publish')">发布</button>
        <button class="button-link button-danger" type="button" :disabled="!article || actioning" @click="runAction('archive')">归档</button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在准备文章编辑器…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <section class="panel stacked-gap editor-main">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>标题</span>
            <input v-model="form.title" type="text" placeholder="把 Rebase 做成一个持续更新的社区媒体站点" @input="onTitleInput" />
            <small v-if="fieldIssues.title" class="field-error">{{ fieldIssues.title }}</small>
          </label>
          <label class="field">
            <span>URL 标识</span>
            <input v-model="form.slug" type="text" placeholder="building-rebase-in-public" @input="onSlugInput" />
            <small v-if="fieldIssues.slug" class="field-error">{{ fieldIssues.slug }}</small>
          </label>
        </div>

        <label class="field">
          <span>摘要</span>
          <textarea v-model="form.summary" rows="3" placeholder="用一句话描述这篇文章的意义。" />
          <small v-if="fieldIssues.summary" class="field-error">{{ fieldIssues.summary }}</small>
        </label>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>阅读时长</span>
            <input v-model="form.readingTime" type="text" placeholder="5 min read" />
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

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>封面资源</span>
            <select v-model="form.coverAssetId">
              <option value="">不使用封面资源</option>
              <option v-for="asset in assets" :key="asset.id" :value="asset.id">{{ asset.originalFilename }}</option>
            </select>
          </label>
          <label class="field">
            <span>封面渐变</span>
            <input v-model="form.coverAccent" type="text" placeholder="linear-gradient(135deg, #efc37b 0%, #0f766e 100%)" />
          </label>
        </div>

        <AuthorsField v-model="form.authors" />
        <StringListField v-model="form.tags" label="标签" add-label="新增标签" placeholder="community" />

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

        <MarkdownEditorField v-model="form.bodyMarkdown" label="正文" placeholder="使用 Markdown 编写文章正文。" :error="fieldIssues.bodyMarkdown" />
      </section>

      <aside class="panel stacked-gap editor-sidebar">
        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">public url</span>
          <strong>{{ publicUrl }}</strong>
          <p>保存后即可通过固定 URL 在前台访问。</p>
        </article>

        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">publish status</span>
          <strong>{{ form.status }}</strong>
          <p>最近更新时间：{{ formatDateTime(article?.updatedAt) }}</p>
        </article>

        <article v-if="selectedCoverAsset" class="insight-card stacked-gap-tight asset-preview-card">
          <span class="eyebrow">cover preview</span>
          <div v-if="selectedCoverAsset.publicUrl && selectedCoverAsset.mimeType.startsWith('image/')" class="asset-preview-frame">
            <img :src="selectedCoverAsset.publicUrl" :alt="selectedCoverAsset.altText || selectedCoverAsset.originalFilename" />
          </div>
          <strong>{{ selectedCoverAsset.originalFilename }}</strong>
          <p>{{ selectedCoverAsset.publicUrl || '当前资源尚未生成公开地址。' }}</p>
        </article>

        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">authors</span>
          <strong>{{ form.authors.map((item) => item.name).filter(Boolean).join('、') || '暂未填写' }}</strong>
          <p>建议至少保留一位可展示的作者。</p>
        </article>
      </aside>
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
  aspect-ratio: 16 / 10;
  background: rgba(15, 118, 110, 0.08);
}
</style>
