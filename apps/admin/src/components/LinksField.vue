<script setup lang="ts">
import { ref, watch } from 'vue';

interface LinkItem {
  label: string;
  href: string;
  handle?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: LinkItem[];
    title: string;
    addLabel?: string;
    showHandle?: boolean;
  }>(),
  {
    addLabel: '新增链接',
    showHandle: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: LinkItem[]];
}>();

const expandedIndex = ref<number | null>(null);

const getLinkLabel = (item: LinkItem, index: number) => item.label || `链接 ${index + 1}`;
const getLinkHrefMeta = (href: string) => {
  if (!href) {
    return '未设置链接';
  }

  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
};
const isExpanded = (index: number) => expandedIndex.value === index;
const toggleItem = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const updateItem = (index: number, key: keyof LinkItem, value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => {
  expandedIndex.value = props.modelValue.length;
  emit('update:modelValue', [...props.modelValue, { label: '', href: '', handle: '' }]);
};
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这个链接吗？删除后需要重新填写。')) {
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
        <h3>{{ title }}</h3>
        <div class="panel-meta">{{ modelValue.length }} 条链接</div>
      </div>
      <button class="button-link button-compact" type="button" @click="addItem">{{ addLabel }}</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容。</div>

    <div v-else class="compact-editor-list">
      <article
        v-for="(item, index) in modelValue"
        :key="`${title}-${index}`"
        class="card-shell collapsible-card-shell"
        :class="{ 'is-open': isExpanded(index) }"
      >
        <button class="collapsible-card-summary" type="button" @click="toggleItem(index)">
          <div class="collapsible-card-copy">
            <strong>{{ getLinkLabel(item, index) }}</strong>
            <div class="collapsible-card-meta">
              <span class="collapsible-chip">{{ getLinkHrefMeta(item.href) }}</span>
              <span v-if="showHandle && item.handle" class="collapsible-chip">{{ item.handle }}</span>
            </div>
          </div>
          <span class="collapsible-card-toggle">{{ isExpanded(index) ? '收起' : '展开编辑' }}</span>
        </button>

        <div v-if="isExpanded(index)" class="collapsible-card-editor stacked-gap">
          <div class="field-grid field-grid-compact" :class="showHandle ? 'field-grid-3' : 'field-grid-2'">
            <label class="field">
              <span>名称</span>
              <input :value="item.label" placeholder="X / Twitter" @input="updateItem(index, 'label', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="field">
              <span>链接</span>
              <input :value="item.href" placeholder="https://example.com" @input="updateItem(index, 'href', ($event.target as HTMLInputElement).value)" />
            </label>
            <label v-if="showHandle" class="field">
              <span>补充信息</span>
              <input :value="item.handle ?? ''" placeholder="@rebase_network" @input="updateItem(index, 'handle', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>

          <div class="inline-actions">
            <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除链接</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
