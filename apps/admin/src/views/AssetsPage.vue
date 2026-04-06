<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

import { assetStatusValues, type AdminAssetRecord } from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatDateTime } from '../lib/format';

type AssetStatus = (typeof assetStatusValues)[number];
type AssetVisibility = 'public' | 'private';

interface AssetFormState {
  storageProvider: string;
  bucket: string;
  objectKey: string;
  publicUrl: string;
  visibility: AssetVisibility;
  assetType: string;
  mimeType: string;
  byteSize: string;
  width: string;
  height: string;
  checksum: string;
  originalFilename: string;
  altText: string;
  status: AssetStatus;
}

const visibilityOptions: AssetVisibility[] = ['public', 'private'];

const createBlankForm = (): AssetFormState => ({
  storageProvider: 'r2',
  bucket: 'rebase-media',
  objectKey: '',
  publicUrl: '',
  visibility: 'public',
  assetType: 'image',
  mimeType: 'image/jpeg',
  byteSize: '0',
  width: '',
  height: '',
  checksum: '',
  originalFilename: '',
  altText: '',
  status: 'active',
});

const rows = ref<AdminAssetRecord[]>([]);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const fieldIssues = ref<Record<string, string>>({});
const selectedAssetId = ref<'new' | string>('new');
const form = reactive<AssetFormState>(createBlankForm());
const filters = reactive({
  query: '',
  status: 'all',
  visibility: 'all',
});

const filteredRows = computed(() => {
  const query = filters.query.trim().toLowerCase();

  return rows.value.filter((row) => {
    const matchesQuery =
      query.length === 0 ||
      [row.originalFilename, row.objectKey, row.assetType, row.altText ?? ''].some((value) => value.toLowerCase().includes(query));
    const matchesStatus = filters.status === 'all' || row.status === filters.status;
    const matchesVisibility = filters.visibility === 'all' || row.visibility === filters.visibility;

    return matchesQuery && matchesStatus && matchesVisibility;
  });
});

const selectedAsset = computed(() => rows.value.find((row) => row.id === selectedAssetId.value) ?? null);
const isCreating = computed(() => selectedAssetId.value === 'new');

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
  fieldIssues.value = {};
};

const applyAsset = (asset: AdminAssetRecord) => {
  Object.assign(form, {
    storageProvider: asset.storageProvider,
    bucket: asset.bucket,
    objectKey: asset.objectKey,
    publicUrl: asset.publicUrl ?? '',
    visibility: asset.visibility,
    assetType: asset.assetType,
    mimeType: asset.mimeType,
    byteSize: String(asset.byteSize),
    width: asset.width === null ? '' : String(asset.width),
    height: asset.height === null ? '' : String(asset.height),
    checksum: '',
    originalFilename: asset.originalFilename,
    altText: asset.altText ?? '',
    status: asset.status,
  });
};

const selectNew = () => {
  selectedAssetId.value = 'new';
  Object.assign(form, createBlankForm());
  resetFeedback();
};

const selectAsset = async (id: string) => {
  selectedAssetId.value = id;
  resetFeedback();

  try {
    const asset = await adminFetch<AdminAssetRecord>(`/api/admin/v1/assets/${id}`);
    applyAsset(asset);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法读取媒体详情。';
  }
};

const loadAssets = async (nextSelectedId = selectedAssetId.value) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    rows.value = await adminFetch<AdminAssetRecord[]>('/api/admin/v1/assets');

    if (nextSelectedId !== 'new' && rows.value.some((row) => row.id === nextSelectedId)) {
      await selectAsset(nextSelectedId);
    } else {
      selectNew();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载媒体库。';
  } finally {
    loading.value = false;
  }
};

const saveAsset = async () => {
  saving.value = true;
  resetFeedback();

  try {
    const payload = {
      storageProvider: form.storageProvider,
      bucket: form.bucket,
      objectKey: form.objectKey,
      publicUrl: form.publicUrl,
      visibility: form.visibility,
      assetType: form.assetType,
      mimeType: form.mimeType,
      byteSize: Number(form.byteSize || 0),
      width: form.width ? Number(form.width) : null,
      height: form.height ? Number(form.height) : null,
      checksum: form.checksum,
      originalFilename: form.originalFilename,
      altText: form.altText,
      status: form.status,
    };

    const asset = await adminRequest<AdminAssetRecord>(
      isCreating.value ? '/api/admin/v1/assets' : `/api/admin/v1/assets/${selectedAssetId.value}`,
      {
        method: isCreating.value ? 'POST' : 'PATCH',
        body: payload,
      },
    );

    successMessage.value = isCreating.value ? '媒体记录已创建。' : '媒体记录已更新。';
    await loadAssets(asset.id);
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存媒体记录。';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadAssets();
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>媒体库</h2>
        <p>第一版先提供结构化媒体台账，后续接入 R2 直传后再升级成真实上传工作流。</p>
      </div>
      <div class="page-actions">
        <button class="button-link" type="button" @click="selectNew">新建媒体记录</button>
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="saveAsset">
          {{ saving ? '保存中…' : isCreating ? '创建记录' : '保存修改' }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载媒体库…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <section class="panel stacked-gap editor-main">
        <div class="panel-toolbar">
          <h3>媒体记录</h3>
          <div class="panel-meta">{{ rows.length }} 条记录</div>
        </div>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>搜索</span>
            <input v-model="filters.query" type="search" placeholder="搜索文件名、对象路径或类型" />
          </label>
          <label class="field">
            <span>状态</span>
            <select v-model="filters.status">
              <option value="all">全部状态</option>
              <option v-for="status in assetStatusValues" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
          <label class="field">
            <span>可见性</span>
            <select v-model="filters.visibility">
              <option value="all">全部可见性</option>
              <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">{{ visibility }}</option>
            </select>
          </label>
        </div>

        <div v-if="filteredRows.length === 0" class="empty-state-card"><p>当前筛选条件下没有媒体记录。</p></div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>文件</th>
              <th>类型</th>
              <th>状态</th>
              <th>更新时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in filteredRows" :key="row.id">
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.originalFilename }}</strong>
                  <div class="muted-row">{{ row.objectKey }}</div>
                </div>
              </td>
              <td>
                <div class="table-cell-stack">
                  <strong>{{ row.assetType }}</strong>
                  <div class="muted-row">{{ row.mimeType }}</div>
                </div>
              </td>
              <td><span class="status-pill">{{ row.status }}</span></td>
              <td>{{ formatDateTime(row.updatedAt) }}</td>
              <td class="table-actions-cell">
                <div class="table-action-list">
                  <button class="table-link table-link-button" type="button" @click="selectAsset(row.id)">编辑</button>
                  <a v-if="row.publicUrl" class="table-link" :href="row.publicUrl" target="_blank" rel="noreferrer">打开</a>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <aside class="panel stacked-gap editor-sidebar">
        <div class="panel-toolbar">
          <h3>{{ isCreating ? '新建媒体记录' : '编辑媒体记录' }}</h3>
          <div class="panel-meta">{{ selectedAsset?.visibility ?? form.visibility }}</div>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>存储提供方</span>
            <input v-model="form.storageProvider" type="text" placeholder="r2" />
          </label>
          <label class="field">
            <span>Bucket</span>
            <input v-model="form.bucket" type="text" placeholder="rebase-media" />
          </label>
        </div>

        <label class="field">
          <span>对象路径</span>
          <input v-model="form.objectKey" type="text" placeholder="geekdaily/episode-1915/cover.jpg" />
          <small v-if="fieldIssues.objectKey" class="field-error">{{ fieldIssues.objectKey }}</small>
        </label>

        <label class="field">
          <span>公开链接</span>
          <input v-model="form.publicUrl" type="url" placeholder="https://pub-xxxx.r2.dev/geekdaily/cover.jpg" />
        </label>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>资源类型</span>
            <input v-model="form.assetType" type="text" placeholder="image" />
          </label>
          <label class="field">
            <span>MIME Type</span>
            <input v-model="form.mimeType" type="text" placeholder="image/jpeg" />
          </label>
        </div>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>字节大小</span>
            <input v-model="form.byteSize" type="number" min="0" />
          </label>
          <label class="field">
            <span>宽度</span>
            <input v-model="form.width" type="number" min="0" placeholder="可选" />
          </label>
          <label class="field">
            <span>高度</span>
            <input v-model="form.height" type="number" min="0" placeholder="可选" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>原始文件名</span>
            <input v-model="form.originalFilename" type="text" placeholder="rebase-cover.jpg" />
          </label>
          <label class="field">
            <span>校验值</span>
            <input v-model="form.checksum" type="text" placeholder="可选" />
          </label>
        </div>

        <label class="field">
          <span>Alt 文案</span>
          <input v-model="form.altText" type="text" placeholder="帮助内容运营记录图片语义。" />
        </label>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>可见性</span>
            <select v-model="form.visibility">
              <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">{{ visibility }}</option>
            </select>
          </label>
          <label class="field">
            <span>状态</span>
            <select v-model="form.status">
              <option v-for="status in assetStatusValues" :key="status" :value="status">{{ status }}</option>
            </select>
          </label>
        </div>

        <article class="insight-card stacked-gap-tight">
          <span class="eyebrow">record status</span>
          <strong>{{ selectedAsset?.status ?? form.status }}</strong>
          <p>当前媒体库先服务内容管理和资源引用，之后再接入 R2 上传与缩略图生成。</p>
        </article>
        <article v-if="selectedAsset" class="insight-card stacked-gap-tight">
          <span class="eyebrow">updated at</span>
          <strong>{{ formatDateTime(selectedAsset.updatedAt) }}</strong>
          <p>{{ selectedAsset.publicUrl || '还没有公开地址，可先保存结构化记录。' }}</p>
        </article>
      </aside>
    </div>
  </section>
</template>
