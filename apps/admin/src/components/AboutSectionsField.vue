<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: Array<{ title: string; body: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ title: string; body: string }>];
}>();

const expandedIndex = ref<number | null>(null);

const getSectionLabel = (title: string, index: number) => title || `分段 ${index + 1}`;
const getSectionSummary = (body: string) => {
  const normalized = body.trim().replace(/\s+/g, ' ');
  if (!normalized) {
    return '暂时还没有摘要。';
  }

  return normalized.length > 72 ? `${normalized.slice(0, 72)}...` : normalized;
};
const isExpanded = (index: number) => expandedIndex.value === index;
const toggleItem = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const updateItem = (index: number, key: 'title' | 'body', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => {
  expandedIndex.value = props.modelValue.length;
  emit('update:modelValue', [...props.modelValue, { title: '', body: '' }]);
};
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这个分段吗？删除后需要重新填写。')) {
    return;
  }

  if (expandedIndex.value === index) {
    expandedIndex.value = null;
  } else if (expandedIndex.value !== null && expandedIndex.value > index) {
    expandedIndex.value -= 1;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};

watch(
  () => props.modelValue.length,
  (length) => {
    if (length === 0) {
      expandedIndex.value = null;
      return;
    }

    if (expandedIndex.value !== null && expandedIndex.value >= length) {
      expandedIndex.value = length - 1;
    }
  },
);
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <div class="stacked-gap-tight">
        <h3>关于页分段</h3>
        <div class="panel-meta">{{ modelValue.length }} 个内容块</div>
      </div>
      <button class="button-link button-compact" type="button" @click="addItem">新增分段</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容分段。</div>

    <div v-else class="compact-editor-list">
      <article
        v-for="(item, index) in modelValue"
        :key="`about-section-${index}`"
        class="card-shell collapsible-card-shell"
        :class="{ 'is-open': isExpanded(index) }"
      >
        <button class="collapsible-card-summary" type="button" @click="toggleItem(index)">
          <div class="collapsible-card-copy">
            <strong>{{ getSectionLabel(item.title, index) }}</strong>
            <div class="panel-meta">{{ getSectionSummary(item.body) }}</div>
          </div>
          <span class="collapsible-card-toggle">{{ isExpanded(index) ? '收起' : '展开编辑' }}</span>
        </button>

        <div v-if="isExpanded(index)" class="collapsible-card-editor stacked-gap">
          <label class="field">
            <span>标题</span>
            <input :value="item.title" placeholder="为什么是 Rebase" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field">
            <span>正文</span>
            <textarea rows="3" :value="item.body" placeholder="描述这一部分的内容。" @input="updateItem(index, 'body', ($event.target as HTMLTextAreaElement).value)" />
          </label>
          <div class="inline-actions">
            <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除分段</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
