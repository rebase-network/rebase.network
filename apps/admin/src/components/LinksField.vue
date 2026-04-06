<script setup lang="ts">
import { computed, ref } from 'vue';

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
    collapsible?: boolean;
  }>(),
  {
    addLabel: '新增链接',
    showHandle: false,
    collapsible: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: LinkItem[]];
}>();

const isExpanded = ref(!props.collapsible);
const previewItems = computed(() =>
  props.modelValue
    .map((item, index) => item.label || item.handle || item.href || `链接 ${index + 1}`)
    .slice(0, 3),
);

const updateItem = (index: number, key: keyof LinkItem, value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => {
  isExpanded.value = true;
  emit('update:modelValue', [...props.modelValue, { label: '', href: '', handle: '' }]);
};
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这个链接吗？删除后需要重新填写。')) {
    return;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <div class="stacked-gap-tight">
        <h3>{{ title }}</h3>
        <div class="panel-meta">{{ modelValue.length }} 条链接</div>
      </div>
      <div class="inline-actions">
        <button
          v-if="collapsible"
          class="button-link button-compact"
          type="button"
          @click="isExpanded = !isExpanded"
        >
          {{ isExpanded ? '收起' : '展开编辑' }}
        </button>
        <button class="button-link button-compact" type="button" @click="addItem">{{ addLabel }}</button>
      </div>
    </div>

    <div v-if="collapsible && !isExpanded && modelValue.length > 0" class="collapsed-section-note">
      <div class="collapsed-section-chip-list">
        <span v-for="item in previewItems" :key="item" class="collapsible-chip">{{ item }}</span>
      </div>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容。</div>

    <div v-else-if="!collapsible || isExpanded" class="compact-editor-list">
      <div v-for="(item, index) in modelValue" :key="`${title}-${index}`" class="card-shell compact-editor-card">
        <div class="compact-editor-head">
          <strong>{{ item.label || `链接 ${index + 1}` }}</strong>
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除</button>
        </div>
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
      </div>
    </div>
  </section>
</template>
