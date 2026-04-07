<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ value: string; label: string }>];
}>();

const expandedIndex = ref<number | null>(null);

const getStatLabel = (label: string, index: number) => label || `数据 ${index + 1}`;
const getStatValue = (value: string) => value || '未设置数值';
const isExpanded = (index: number) => expandedIndex.value === index;
const toggleItem = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const updateItem = (index: number, key: 'value' | 'label', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => {
  expandedIndex.value = props.modelValue.length;
  emit('update:modelValue', [...props.modelValue, { value: '', label: '' }]);
};
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这条首页数据吗？删除后需要重新填写。')) {
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
        <h3>首页数据卡片</h3>
        <div class="panel-meta">{{ modelValue.length }} 项数据</div>
      </div>
      <button class="button-link button-compact" type="button" @click="addItem">新增数据</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有数据卡片。</div>

    <div v-else class="compact-editor-list">
      <article
        v-for="(item, index) in modelValue"
        :key="`home-stat-${index}`"
        class="card-shell collapsible-card-shell"
        :class="{ 'is-open': isExpanded(index) }"
      >
        <button class="collapsible-card-summary" type="button" @click="toggleItem(index)">
          <div class="collapsible-card-copy">
            <strong>{{ getStatLabel(item.label, index) }}</strong>
            <div class="collapsible-card-meta">
              <span class="collapsible-chip">{{ getStatValue(item.value) }}</span>
            </div>
          </div>
          <span class="collapsible-card-toggle">{{ isExpanded(index) ? '收起' : '展开编辑' }}</span>
        </button>

        <div v-if="isExpanded(index)" class="collapsible-card-editor stacked-gap">
          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>数值</span>
              <input :value="item.value" placeholder="1809+" @input="updateItem(index, 'value', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="field">
              <span>说明</span>
              <input :value="item.label" placeholder="已迁移的极客日报期数" @input="updateItem(index, 'label', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
          <div class="inline-actions">
            <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除数据</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
