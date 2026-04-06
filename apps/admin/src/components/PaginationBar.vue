<script setup lang="ts">
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

const goToPage = (page: number) => {
  if (!props.meta || page === props.meta.page || page < 1 || page > props.meta.totalPages) {
    return;
  }

  emit('change-page', page);
};
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
    </div>
  </div>
</template>
