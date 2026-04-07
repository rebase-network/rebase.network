<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { defaultAdminPageSize, type AdminAssetRecord, type PaginatedMeta } from '@rebase/shared';

import { adminFetch, adminFetchWithMeta } from '../lib/api';
import { formatAssetStatus, formatAssetVisibility, formatDateTime } from '../lib/format';
import PaginationBar from './PaginationBar.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label: string;
    emptyLabel?: string;
    pickerTitle?: string;
    showSelectedCard?: boolean;
  }>(),
  {
    emptyLabel: '当前未选择媒体资源。',
    pickerTitle: '从媒体库选择',
    showSelectedCard: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
  resolve: [asset: AdminAssetRecord | null];
}>();

const selectedAsset = ref<AdminAssetRecord | null>(null);
const rows = ref<AdminAssetRecord[]>([]);
const pagination = ref<PaginatedMeta | null>(null);
const pickerOpen = ref(false);
const loading = ref(false);
const resolving = ref(false);
const errorMessage = ref('');
const query = ref('');
const page = ref(1);

const hasSelection = computed(() => props.modelValue.length > 0);

const loadSelectedAsset = async (assetId: string) => {
  resolving.value = true;
  errorMessage.value = '';

  try {
    const asset = await adminFetch<AdminAssetRecord>(`/api/admin/v1/assets/${assetId}`);
    selectedAsset.value = asset;
    emit('resolve', asset);
  } catch (error) {
    selectedAsset.value = null;
    emit('resolve', null);
    errorMessage.value = error instanceof Error ? error.message : '无法读取当前媒体资源。';
  } finally {
    resolving.value = false;
  }
};

const loadPickerRows = async () => {
  if (!pickerOpen.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  const params = new URLSearchParams({
    page: String(page.value),
    pageSize: String(defaultAdminPageSize),
    status: 'active',
    visibility: 'public',
  });

  if (query.value.trim()) {
    params.set('query', query.value.trim());
  }

  try {
    const response = await adminFetchWithMeta<AdminAssetRecord[], PaginatedMeta>(`/api/admin/v1/assets?${params.toString()}`);
    rows.value = response.data;
    pagination.value = response.meta ?? null;
  } catch (error) {
    rows.value = [];
    pagination.value = null;
    errorMessage.value = error instanceof Error ? error.message : '无法加载媒体资源。';
  } finally {
    loading.value = false;
  }
};

const togglePicker = async () => {
  pickerOpen.value = !pickerOpen.value;

  if (pickerOpen.value) {
    page.value = 1;
    await loadPickerRows();
  }
};

const selectAsset = (asset: AdminAssetRecord) => {
  selectedAsset.value = asset;
  emit('update:modelValue', asset.id);
  emit('resolve', asset);
  pickerOpen.value = false;
};

const clearSelection = () => {
  selectedAsset.value = null;
  emit('update:modelValue', '');
  emit('resolve', null);
};

const goToPage = async (nextPage: number) => {
  page.value = nextPage;
  await loadPickerRows();
};

watch(
  () => props.modelValue,
  (assetId) => {
    if (!assetId) {
      selectedAsset.value = null;
      emit('resolve', null);
      return;
    }

    if (selectedAsset.value?.id === assetId) {
      emit('resolve', selectedAsset.value);
      return;
    }

    void loadSelectedAsset(assetId);
  },
  { immediate: true },
);

watch(query, () => {
  if (!pickerOpen.value) {
    return;
  }

  page.value = 1;
  void loadPickerRows();
});
</script>

<template>
  <section class="field asset-picker-field">
    <div class="field-row field-row-spread">
      <span>{{ label }}</span>
      <div class="inline-actions">
        <button class="button-link button-compact" type="button" @click="togglePicker">
          {{ pickerOpen ? '收起媒体库' : pickerTitle }}
        </button>
        <button v-if="hasSelection" class="button-link button-compact" type="button" @click="clearSelection">清空</button>
      </div>
    </div>

    <div v-if="errorMessage" class="field-error">{{ errorMessage }}</div>

    <div v-if="showSelectedCard" class="asset-picker-selected">
      <div v-if="selectedAsset" class="summary-item summary-asset">
        <div v-if="selectedAsset.publicUrl && selectedAsset.mimeType.startsWith('image/')" class="asset-picker-frame">
          <img :src="selectedAsset.publicUrl" :alt="selectedAsset.altText || selectedAsset.originalFilename" />
        </div>
        <div class="summary-asset-copy">
          <div class="eyebrow">当前资源</div>
          <strong>{{ selectedAsset.originalFilename }}</strong>
          <p>{{ selectedAsset.objectKey }}</p>
        </div>
      </div>
      <div v-else class="empty-inline">
        {{ resolving ? '正在读取当前媒体资源…' : emptyLabel }}
      </div>
    </div>

    <div v-if="pickerOpen" class="field-shell stacked-gap asset-picker-browser">
      <div class="panel-toolbar">
        <div>
          <h3>选择媒体</h3>
          <div class="panel-meta">只显示公开且可用于前台的媒体资源</div>
        </div>
        <div class="panel-meta">{{ pagination?.totalItems ?? rows.length }} 条结果</div>
      </div>

      <label class="field">
        <span>搜索媒体</span>
        <input v-model="query" type="search" placeholder="搜索文件名、对象路径或类型" />
      </label>

      <div v-if="loading" class="empty-inline">正在加载媒体资源…</div>
      <div v-else-if="rows.length === 0" class="empty-inline">当前条件下没有可选媒体资源。</div>

      <div v-else class="asset-picker-list">
        <button
          v-for="asset in rows"
          :key="asset.id"
          class="asset-picker-option"
          :class="{ 'is-selected': asset.id === modelValue }"
          type="button"
          @click="selectAsset(asset)"
        >
          <div class="asset-picker-thumb">
            <img v-if="asset.publicUrl && asset.mimeType.startsWith('image/')" :src="asset.publicUrl" :alt="asset.altText || asset.originalFilename" />
            <span v-else>{{ asset.assetType }}</span>
          </div>
          <div class="asset-picker-copy">
            <strong>{{ asset.originalFilename }}</strong>
            <span>{{ asset.objectKey }}</span>
            <div class="asset-picker-meta">
              <small>{{ formatAssetVisibility(asset.visibility) }}</small>
              <small>{{ formatAssetStatus(asset.status) }}</small>
              <small>{{ formatDateTime(asset.updatedAt) }}</small>
            </div>
          </div>
          <span class="asset-picker-badge">{{ asset.id === modelValue ? '已选择' : '选择' }}</span>
        </button>
      </div>

      <PaginationBar :meta="pagination" :current-count="rows.length" item-label="条" :loading="loading" @change-page="goToPage" />
    </div>
  </section>
</template>

<style scoped>
.asset-picker-field {
  gap: 0.48rem;
}

.asset-picker-selected {
  display: grid;
  gap: 0.42rem;
}

.asset-picker-browser {
  padding: 0.78rem 0.82rem;
}

.asset-picker-list {
  display: grid;
  gap: 0.48rem;
}

.asset-picker-option {
  display: grid;
  grid-template-columns: 3.4rem minmax(0, 1fr) auto;
  gap: 0.65rem;
  align-items: center;
  padding: 0.62rem 0.68rem;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  cursor: pointer;
  text-align: left;
  transition:
    transform 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
}

.asset-picker-option:hover {
  transform: translateY(-1px);
  border-color: rgba(15, 109, 100, 0.22);
  background: rgba(15, 109, 100, 0.06);
}

.asset-picker-option.is-selected {
  border-color: rgba(15, 109, 100, 0.28);
  background: rgba(15, 109, 100, 0.08);
}

.asset-picker-thumb,
.asset-picker-frame {
  display: grid;
  width: 3.4rem;
  height: 3.4rem;
  place-items: center;
  overflow: hidden;
  border-radius: 0.92rem;
  background: rgba(15, 109, 100, 0.08);
  color: var(--accent-strong);
  font-size: 0.68rem;
  font-weight: 700;
  text-transform: uppercase;
}

.asset-picker-thumb img,
.asset-picker-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.asset-picker-copy {
  display: grid;
  gap: 0.18rem;
  min-width: 0;
}

.asset-picker-copy strong,
.asset-picker-copy span {
  margin: 0;
}

.asset-picker-copy strong {
  font-size: 0.9rem;
}

.asset-picker-copy span {
  color: var(--muted);
  font-size: 0.76rem;
  word-break: break-word;
}

.asset-picker-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.32rem;
  color: var(--muted);
}

.asset-picker-meta small {
  display: inline-flex;
  align-items: center;
  min-height: 1.3rem;
  padding: 0.08rem 0.4rem;
  border-radius: 999px;
  background: rgba(15, 109, 100, 0.08);
  font-size: 0.68rem;
  font-weight: 700;
}

.asset-picker-badge {
  color: var(--accent-strong);
  font-size: 0.78rem;
  font-weight: 700;
  white-space: nowrap;
}
</style>
