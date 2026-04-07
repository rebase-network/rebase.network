<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import type { PaginatedMeta } from '@rebase/shared';

const props = defineProps<{
  meta: PaginatedMeta | null;
  currentCount: number;
  itemLabel: string;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'change-page': [page: number];
}>();

const pageInput = ref('');

const goToPage = (page: number) => {
  if (!props.meta || page === props.meta.page || page < 1 || page > props.meta.totalPages) {
    return;
  }

  emit('change-page', page);
};

const submitPageInput = () => {
  if (!props.meta) {
    return;
  }

  const nextPage = Number.parseInt(pageInput.value, 10);
  if (!Number.isFinite(nextPage)) {
    pageInput.value = String(props.meta.page);
    return;
  }

  goToPage(nextPage);
};

const jumpDisabled = computed(() => {
  if (!props.meta) {
    return true;
  }

  const nextPage = Number.parseInt(pageInput.value, 10);
  return props.loading || !Number.isFinite(nextPage) || nextPage < 1 || nextPage > props.meta.totalPages || nextPage === props.meta.page;
});

watch(
  () => props.meta?.page,
  (page) => {
    pageInput.value = page ? String(page) : '';
  },
  { immediate: true },
);
</script>

<template>
  <div v-if="meta" class="pagination-bar">
    <div class="pagination-summary">
      <strong>第 {{ meta.page }} / {{ meta.totalPages }} 页</strong>
      <span>本页 {{ currentCount }} {{ itemLabel }}</span>
      <span>共 {{ meta.totalItems }} {{ itemLabel }}</span>
    </div>

    <div class="pagination-actions">
      <button class="button-link button-compact" type="button" :disabled="loading || !meta.hasPrevPage" @click="goToPage(meta.page - 1)">
        上一页
      </button>
      <button class="button-link button-compact" type="button" :disabled="loading || !meta.hasNextPage" @click="goToPage(meta.page + 1)">
        下一页
      </button>
      <div class="pagination-jump">
        <span>跳至</span>
        <input v-model="pageInput" type="number" inputmode="numeric" :min="1" :max="meta.totalPages" @keydown.enter.prevent="submitPageInput" />
        <button class="button-link button-compact" type="button" :disabled="jumpDisabled" @click="submitPageInput">前往</button>
      </div>
    </div>
  </div>
</template>
