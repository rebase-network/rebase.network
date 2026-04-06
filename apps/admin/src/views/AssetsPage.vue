<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { assetStatusValues, type AdminAssetRecord, type AdminAssetUploadConfig } from '@rebase/shared';

import { adminFetch, adminRequest, getValidationIssues } from '../lib/api';
import { formatAssetStatus, formatAssetVisibility, formatDateTime, formatFileSize } from '../lib/format';

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

interface UploadFormState {
  folder: string;
  visibility: AssetVisibility;
  altText: string;
  assetType: string;
}

type AssetWorkspaceMode = 'upload' | 'edit';

const visibilityOptions: AssetVisibility[] = ['public', 'private'];

const createBlankForm = (bucket = 'rebase-media'): AssetFormState => ({
  storageProvider: 'r2',
  bucket,
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

const createUploadForm = (): UploadFormState => ({
  folder: 'media',
  visibility: 'public',
  altText: '',
  assetType: 'image',
});

const rows = ref<AdminAssetRecord[]>([]);
const uploadConfig = ref<AdminAssetUploadConfig | null>(null);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref('');
const successMessage = ref('');
const copyFeedback = ref('');
const fieldIssues = ref<Record<string, string>>({});
const activeWorkspaceMode = ref<AssetWorkspaceMode>('upload');
const selectedAssetId = ref<string | null>(null);
const manualCreateMode = ref(false);
const uploadFile = ref<File | null>(null);
const uploadPreviewUrl = ref('');
const form = reactive<AssetFormState>(createBlankForm());
const upload = reactive<UploadFormState>(createUploadForm());
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
const isCreating = computed(() => manualCreateMode.value);
const hasEditableRecord = computed(() => manualCreateMode.value || Boolean(selectedAsset.value));
const uploadPreviewSrc = computed(() => uploadPreviewUrl.value);
const uploadPreviewMimeType = computed(() => uploadFile.value?.type ?? '');
const uploadPreviewIsImage = computed(() => uploadPreviewSrc.value.length > 0 && uploadPreviewMimeType.value.startsWith('image/'));
const editorPreviewSrc = computed(() => selectedAsset.value?.publicUrl || form.publicUrl || '');
const editorPreviewMimeType = computed(() => selectedAsset.value?.mimeType || form.mimeType || '');
const editorPreviewIsImage = computed(() => editorPreviewSrc.value.length > 0 && editorPreviewMimeType.value.startsWith('image/'));
const editorPanelTitle = computed(() => (isCreating.value ? '手动新建媒体记录' : '编辑已上传文件'));
const saveButtonLabel = computed(() => (saving.value ? '保存中…' : isCreating.value ? '创建记录' : '保存修改'));
const uploadStatusMessage = computed(() => {
  if (!uploadConfig.value) {
    return '';
  }

  if (!uploadConfig.value.enabled) {
    return '当前环境未启用上传能力。';
  }

  switch (uploadConfig.value.mode) {
    case 'r2-s3':
      return '当前直接通过 R2 的 S3 接口上传。';
    case 'wrangler-cli':
      return '本地环境通过 Wrangler 将文件写入 R2。';
    default:
      return uploadConfig.value.message;
  }
});
const assetStats = computed(() => [
  {
    label: '媒体记录',
    value: rows.value.length,
  },
  {
    label: '筛选结果',
    value: filteredRows.value.length,
  },
  {
    label: '公开资源',
    value: rows.value.filter((row) => row.visibility === 'public').length,
  },
  {
    label: '图片资源',
    value: rows.value.filter((row) => row.assetType === 'image').length,
  },
]);

let copyFeedbackTimer: number | null = null;

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

const copyToClipboard = async (value: string, label: string) => {
  const nextValue = value.trim();

  if (!nextValue) {
    errorMessage.value = `${label}为空，无法复制。`;
    return;
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(nextValue);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = nextValue;
      textarea.setAttribute('readonly', 'true');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }

    setCopyFeedback(`已复制${label}。`);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : `无法复制${label}。`;
  }
};

const resetEditorForm = () => {
  Object.assign(form, createBlankForm(uploadConfig.value?.bucket ?? 'rebase-media'));
};

const revokePreviewUrl = () => {
  if (uploadPreviewUrl.value) {
    URL.revokeObjectURL(uploadPreviewUrl.value);
    uploadPreviewUrl.value = '';
  }
};

const setUploadFile = (file: File | null) => {
  revokePreviewUrl();
  uploadFile.value = file;

  if (!file) {
    return;
  }

  uploadPreviewUrl.value = URL.createObjectURL(file);
  upload.assetType = file.type.startsWith('image/') ? 'image' : 'file';
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
    checksum: asset.checksum ?? '',
    originalFilename: asset.originalFilename,
    altText: asset.altText ?? '',
    status: asset.status,
  });
};

const clearEditorSelection = () => {
  selectedAssetId.value = null;
  manualCreateMode.value = false;
  resetEditorForm();
  resetFeedback();
};

const selectNew = () => {
  manualCreateMode.value = true;
  selectedAssetId.value = null;
  activeWorkspaceMode.value = 'edit';
  resetEditorForm();
  resetFeedback();
};

const selectAsset = async (id: string) => {
  manualCreateMode.value = false;
  selectedAssetId.value = id;
  activeWorkspaceMode.value = 'edit';
  resetFeedback();

  try {
    const asset = await adminFetch<AdminAssetRecord>(`/api/admin/v1/assets/${id}`);
    applyAsset(asset);
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法读取媒体详情。';
  }
};

const loadPage = async (nextSelectedId: string | null = selectedAssetId.value, preserveDraft = manualCreateMode.value) => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const [assetRows, nextConfig] = await Promise.all([
      adminFetch<AdminAssetRecord[]>('/api/admin/v1/assets'),
      adminFetch<AdminAssetUploadConfig>('/api/admin/v1/assets/upload-config'),
    ]);

    rows.value = assetRows;
    uploadConfig.value = nextConfig;

    if (nextSelectedId && rows.value.some((row) => row.id === nextSelectedId)) {
      await selectAsset(nextSelectedId);
    } else if (preserveDraft) {
      selectNew();
    } else {
      clearEditorSelection();
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载媒体库。';
  } finally {
    loading.value = false;
  }
};

const onFilePicked = (event: Event) => {
  const input = event.target as HTMLInputElement;
  setUploadFile(input.files?.[0] ?? null);
};

const uploadAsset = async () => {
  if (!uploadFile.value) {
    errorMessage.value = '请先选择一个要上传的文件。';
    return;
  }

  uploading.value = true;
  resetFeedback();

  try {
    const payload = new FormData();
    payload.append('file', uploadFile.value);
    payload.append('folder', upload.folder);
    payload.append('visibility', upload.visibility);
    payload.append('altText', upload.altText);
    payload.append('assetType', upload.assetType);

    const asset = await adminRequest<AdminAssetRecord>('/api/admin/v1/assets/upload', {
      method: 'POST',
      body: payload,
    });

    successMessage.value = '文件已上传到 R2，并自动登记到媒体库。';
    upload.altText = '';
    setUploadFile(null);
    await loadPage(asset.id, false);
    activeWorkspaceMode.value = 'edit';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法上传文件。';
  } finally {
    uploading.value = false;
  }
};

const saveAsset = async () => {
  if (!hasEditableRecord.value) {
    errorMessage.value = '请先从左侧选择一个已上传文件。';
    return;
  }

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
      isCreating.value ? '/api/admin/v1/assets' : `/api/admin/v1/assets/${selectedAssetId.value ?? ''}`,
      {
        method: isCreating.value ? 'POST' : 'PATCH',
        body: payload,
      },
    );

    successMessage.value = isCreating.value ? '媒体记录已创建。' : '媒体记录已更新。';
    await loadPage(asset.id, false);
    activeWorkspaceMode.value = 'edit';
  } catch (error) {
    fieldIssues.value = getValidationIssues(error);
    errorMessage.value = error instanceof Error ? error.message : '无法保存媒体记录。';
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  void loadPage();
});

onBeforeUnmount(() => {
  revokePreviewUrl();

  if (copyFeedbackTimer !== null) {
    window.clearTimeout(copyFeedbackTimer);
  }
});
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>媒体库</h2>
        <p>上传与复用媒体资源</p>
      </div>
      <div v-if="activeWorkspaceMode === 'edit' && hasEditableRecord" class="page-actions">
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="saveAsset">
          {{ saveButtonLabel }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="copyFeedback" class="panel panel-success panel-inline-feedback"><p>{{ copyFeedback }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载媒体库…</p></div>

    <div v-else class="editor-grid editor-grid-focus">
      <div class="stacked-gap editor-main">
        <div class="panel-grid panel-grid-2">
          <section class="panel stacked-gap">
            <div class="panel-toolbar">
              <div>
                <h3>媒体概览</h3>
                <div class="panel-meta">上传、筛选并复用站点资源</div>
              </div>
              <div class="panel-meta">{{ rows.length }} 条记录</div>
            </div>

            <div class="compact-stat-grid compact-stat-grid-4">
              <article v-for="item in assetStats" :key="item.label" class="compact-stat-card">
                <span class="compact-stat-label">{{ item.label }}</span>
                <strong>{{ item.value }}</strong>
              </article>
            </div>
          </section>

          <section class="panel stacked-gap filter-panel">
            <div class="panel-toolbar">
              <h3>筛选</h3>
              <div class="panel-meta">{{ filteredRows.length }} 条结果</div>
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
                  <option v-for="status in assetStatusValues" :key="status" :value="status">{{ formatAssetStatus(status) }}</option>
                </select>
              </label>
              <label class="field">
                <span>可见性</span>
                <select v-model="filters.visibility">
                  <option value="all">全部可见性</option>
                  <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">{{ formatAssetVisibility(visibility) }}</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <section v-if="filteredRows.length === 0" class="panel empty-state-card"><p>当前筛选条件下没有媒体记录。</p></section>

        <section v-else class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>媒体记录</h3>
              <div class="panel-meta">按文件、对象路径与状态快速查找资源</div>
            </div>
            <div class="panel-meta">{{ filteredRows.length }} 条结果</div>
          </div>

          <div class="table-panel">
            <table class="data-table dense-table asset-table">
              <thead>
                <tr>
                  <th>预览</th>
                  <th>文件</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>更新</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in filteredRows" :key="row.id" :class="{ 'is-selected': !isCreating && selectedAssetId === row.id }">
                  <td>
                    <div class="asset-thumb">
                      <img v-if="row.publicUrl && row.mimeType.startsWith('image/')" :src="row.publicUrl" :alt="row.altText || row.originalFilename" />
                      <span v-else>{{ row.assetType }}</span>
                    </div>
                  </td>
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
                  <td>
                    <div class="table-cell-stack">
                      <span class="status-pill">{{ formatAssetStatus(row.status) }}</span>
                      <div class="muted-row">{{ formatAssetVisibility(row.visibility) }}</div>
                    </div>
                  </td>
                  <td>{{ formatDateTime(row.updatedAt) }}</td>
                  <td class="table-actions-cell">
                    <div class="table-action-list">
                      <button class="table-link table-link-button" type="button" @click="selectAsset(row.id)">编辑元数据</button>
                      <button class="table-link table-link-button" type="button" @click="copyToClipboard(row.objectKey, '对象路径')">复制路径</button>
                      <a v-if="row.publicUrl" class="table-link" :href="row.publicUrl" target="_blank" rel="noreferrer">打开</a>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>操作模式</h3>
              <div class="panel-meta">上传新文件与编辑已上传文件分开处理</div>
            </div>
            <div class="panel-meta">{{ activeWorkspaceMode === 'upload' ? '上传' : '编辑' }}</div>
          </div>

          <div class="tab-strip">
            <button class="tab-button" :class="{ 'is-active': activeWorkspaceMode === 'upload' }" type="button" @click="activeWorkspaceMode = 'upload'">
              上传新文件
            </button>
            <button class="tab-button" :class="{ 'is-active': activeWorkspaceMode === 'edit' }" type="button" @click="activeWorkspaceMode = 'edit'">
              编辑已上传文件
            </button>
          </div>
        </section>

        <section v-if="activeWorkspaceMode === 'upload'" class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>上传文件</h3>
              <div class="panel-meta">{{ uploadConfig?.enabled ? '直接写入 R2' : '当前不可上传' }}</div>
            </div>
            <div class="panel-meta">{{ uploadConfig?.bucket ?? '未配置 bucket' }}</div>
          </div>
          <div class="panel-meta">{{ uploadStatusMessage }}</div>

          <dl class="summary-grid summary-grid-2">
            <div class="summary-item">
              <dt>公开访问</dt>
              <dd class="muted">{{ uploadConfig?.publicBaseUrl || '尚未配置公开域名' }}</dd>
            </div>
            <div class="summary-item">
              <dt>当前文件</dt>
              <dd>{{ uploadFile?.name || '未选择' }}</dd>
            </div>
            <div class="summary-item">
              <dt>文件大小</dt>
              <dd class="muted">{{ uploadFile ? formatFileSize(uploadFile.size) : '未选择' }}</dd>
            </div>
            <div class="summary-item">
              <dt>对象目录</dt>
              <dd class="muted">{{ upload.folder || 'media' }}</dd>
            </div>
          </dl>

          <div v-if="uploadPreviewSrc" class="summary-item summary-asset">
            <div v-if="uploadPreviewIsImage" class="asset-preview-frame">
              <img :src="uploadPreviewSrc" :alt="upload.altText || uploadFile?.name || 'asset preview'" />
            </div>
            <div class="summary-asset-copy">
              <div class="eyebrow">预览</div>
              <strong>{{ uploadFile?.name || '未命名文件' }}</strong>
              <p>上传完成后会自动登记到媒体库，并切换到“编辑已上传文件”。</p>
            </div>
          </div>
          <div v-else class="empty-inline">选择文件后，会在这里看到上传预览。</div>

          <label class="field">
            <span>选择文件</span>
            <input type="file" @change="onFilePicked" />
          </label>

          <div v-if="uploadFile" class="upload-file-chip">
            <strong>{{ uploadFile.name }}</strong>
            <span>{{ formatFileSize(uploadFile.size) }}</span>
          </div>

          <div class="field-grid field-grid-2">
            <label class="field">
              <span>对象目录</span>
              <input v-model="upload.folder" type="text" placeholder="articles" />
            </label>
            <label class="field">
              <span>资源类型</span>
              <input v-model="upload.assetType" type="text" placeholder="image" />
            </label>
          </div>

          <div class="field-grid field-grid-2">
            <label class="field">
              <span>可见性</span>
              <select v-model="upload.visibility">
                <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">{{ formatAssetVisibility(visibility) }}</option>
              </select>
            </label>
            <label class="field">
              <span>Alt 文案</span>
              <input v-model="upload.altText" type="text" placeholder="帮助编辑识别图片内容" />
            </label>
          </div>

          <button class="button-link button-primary upload-button" type="button" :disabled="!uploadConfig?.enabled || !uploadFile || uploading" @click="uploadAsset">
            {{ uploading ? '上传中…' : '上传到 R2' }}
          </button>
        </section>

        <section v-else class="panel stacked-gap">
          <template v-if="hasEditableRecord">
          <div class="panel-toolbar">
            <div>
              <h3>{{ editorPanelTitle }}</h3>
              <div class="panel-meta">{{ selectedAsset?.originalFilename || '当前未绑定已上传文件' }}</div>
            </div>
            <div class="panel-meta">{{ formatAssetVisibility(selectedAsset?.visibility ?? form.visibility) }}</div>
          </div>

          <div class="asset-quick-actions">
            <button class="button-link button-compact" type="button" @click="copyToClipboard(form.objectKey, '对象路径')">复制路径</button>
            <button class="button-link button-compact" type="button" @click="copyToClipboard(form.publicUrl, '公开链接')">复制链接</button>
            <a v-if="selectedAsset?.publicUrl || form.publicUrl" class="button-link button-compact" :href="selectedAsset?.publicUrl || form.publicUrl" target="_blank" rel="noreferrer">
              打开文件
            </a>
          </div>

          <dl class="summary-grid summary-grid-2">
            <div class="summary-item">
              <dt>记录状态</dt>
              <dd>{{ formatAssetStatus(selectedAsset?.status ?? form.status) }}</dd>
            </div>
            <div class="summary-item">
              <dt>可见性</dt>
              <dd class="muted">{{ formatAssetVisibility(selectedAsset?.visibility ?? form.visibility) }}</dd>
            </div>
            <div class="summary-item">
              <dt>对象路径</dt>
              <dd class="muted">{{ form.objectKey || '未设置' }}</dd>
            </div>
            <div v-if="selectedAsset" class="summary-item">
              <dt>更新时间</dt>
              <dd class="muted">{{ formatDateTime(selectedAsset.updatedAt) }}</dd>
            </div>
          </dl>

          <div v-if="editorPreviewSrc" class="summary-item summary-asset">
            <div v-if="editorPreviewIsImage" class="asset-preview-frame">
              <img :src="editorPreviewSrc" :alt="selectedAsset?.altText || form.altText || selectedAsset?.originalFilename || 'asset preview'" />
            </div>
            <div class="summary-asset-copy">
              <div class="eyebrow">已上传文件</div>
              <strong>{{ selectedAsset?.originalFilename || form.originalFilename || '未命名文件' }}</strong>
              <p>{{ selectedAsset?.publicUrl || form.publicUrl || '保存后会使用当前公开链接。' }}</p>
            </div>
          </div>

          <section class="field-shell stacked-gap-tight asset-edit-shell">
            <div class="panel-toolbar">
              <h3>访问与路径</h3>
              <div class="panel-meta">{{ formatAssetVisibility(form.visibility) }}</div>
            </div>
            <div class="field-grid field-grid-2 field-grid-compact">
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
              <input v-model="form.objectKey" type="text" placeholder="articles/2026/04/rebase-cover.jpg" />
              <small v-if="fieldIssues.objectKey" class="field-error">{{ fieldIssues.objectKey }}</small>
            </label>

            <label class="field">
              <span>公开链接</span>
              <input v-model="form.publicUrl" type="url" placeholder="https://media.rebase.network/articles/rebase-cover.jpg" />
            </label>
          </section>

          <section class="field-shell stacked-gap-tight asset-edit-shell">
            <div class="panel-toolbar">
              <h3>文件属性</h3>
              <div class="panel-meta">{{ formatAssetStatus(form.status) }}</div>
            </div>
            <div class="field-grid field-grid-2 field-grid-compact">
              <label class="field">
                <span>资源类型</span>
                <input v-model="form.assetType" type="text" placeholder="image" />
              </label>
              <label class="field">
                <span>MIME 类型</span>
                <input v-model="form.mimeType" type="text" placeholder="image/jpeg" />
              </label>
            </div>

            <div class="field-grid field-grid-3 field-grid-compact">
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

            <div class="field-grid field-grid-2 field-grid-compact">
              <label class="field">
                <span>原始文件名</span>
                <input v-model="form.originalFilename" type="text" placeholder="rebase-cover.jpg" />
              </label>
              <label class="field">
                <span>校验值</span>
                <input v-model="form.checksum" type="text" placeholder="sha256" />
              </label>
            </div>

            <label class="field">
              <span>Alt 文案</span>
              <input v-model="form.altText" type="text" placeholder="帮助内容运营记录图片语义。" />
            </label>

            <div class="field-grid field-grid-2 field-grid-compact">
              <label class="field">
                <span>可见性</span>
                <select v-model="form.visibility">
                  <option v-for="visibility in visibilityOptions" :key="visibility" :value="visibility">{{ formatAssetVisibility(visibility) }}</option>
                </select>
              </label>
              <label class="field">
                <span>状态</span>
                <select v-model="form.status">
                  <option v-for="status in assetStatusValues" :key="status" :value="status">{{ formatAssetStatus(status) }}</option>
                </select>
              </label>
            </div>
          </section>

          <div class="inline-actions">
            <button class="button-link button-primary" type="button" :disabled="saving" @click="saveAsset">
              {{ saveButtonLabel }}
            </button>
          </div>
          </template>

          <template v-else>
            <div class="panel-toolbar">
              <div>
                <h3>编辑已上传文件</h3>
                <div class="panel-meta">先从左侧选择一个文件，再修改元数据。</div>
              </div>
            </div>

            <div class="empty-state-card stacked-gap asset-editor-empty">
              <p>上传完成后系统会自动切换到这里。你也可以从左侧列表点击“编辑元数据”继续维护已有文件。</p>
              <div class="inline-actions">
                <button class="button-link button-primary" type="button" @click="activeWorkspaceMode = 'upload'">去上传文件</button>
                <button class="button-link" type="button" @click="selectNew">手动新建空记录</button>
              </div>
            </div>
          </template>
        </section>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.asset-table th:first-child,
.asset-table td:first-child {
  width: 4.8rem;
}

.asset-table th,
.asset-table td {
  padding: 0.46rem 0.34rem;
}

.asset-table .table-cell-stack {
  gap: 0.12rem;
}

.asset-table .table-cell-stack strong {
  font-size: 0.88rem;
  line-height: 1.2;
}

.asset-table .muted-row {
  font-size: 0.74rem;
  line-height: 1.25;
}

.asset-table .table-action-list {
  gap: 0.34rem;
}

.asset-table .table-link {
  font-size: 0.78rem;
}

.asset-table .status-pill {
  padding: 0.18rem 0.48rem;
  font-size: 0.72rem;
}

.asset-thumb {
  display: grid;
  width: 2.9rem;
  height: 2.9rem;
  place-items: center;
  overflow: hidden;
  border-radius: 0.78rem;
  background: rgba(15, 118, 110, 0.08);
  color: #0f766e;
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.asset-thumb img,
.asset-preview-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-table tbody tr.is-selected {
  background: rgba(15, 118, 110, 0.06);
}

.panel-inline-feedback {
  padding-top: 0.6rem;
  padding-bottom: 0.6rem;
}

.asset-preview-frame {
  overflow: hidden;
  border-radius: 1rem;
  background: rgba(15, 118, 110, 0.08);
}

.asset-quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.asset-edit-shell {
  padding: 0.72rem 0.76rem;
}

.upload-button {
  justify-content: center;
}

.upload-file-chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  padding: 0.85rem 0.95rem;
  border-radius: 1rem;
  background: rgba(15, 118, 110, 0.08);
}

.upload-file-chip strong,
.upload-file-chip span {
  display: block;
}

.upload-file-chip strong {
  font-size: 0.95rem;
}

.upload-file-chip span {
  color: var(--color-text-muted, #667085);
  font-size: 0.78rem;
}

.asset-editor-empty {
  align-content: start;
}
</style>
