<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: Array<{ eyebrow: string; title: string; summary: string; href: string; meta: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ eyebrow: string; title: string; summary: string; href: string; meta: string }>];
}>();

const expandedIndex = ref<number | null>(null);

const getSignalLabel = (title: string, index: number) => title || `动态 ${index + 1}`;
const getSignalHrefMeta = (href: string) => {
  if (!href) {
    return '未设置链接';
  }

  try {
    const url = new URL(href, 'https://rebase.network');
    return href.startsWith('/') ? url.pathname : url.hostname;
  } catch {
    return href;
  }
};
const isExpanded = (index: number) => expandedIndex.value === index;
const toggleItem = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const updateItem = (index: number, key: 'eyebrow' | 'title' | 'summary' | 'href' | 'meta', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => {
  expandedIndex.value = props.modelValue.length;
  emit('update:modelValue', [...props.modelValue, { eyebrow: '', title: '', summary: '', href: '', meta: '' }]);
};
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这条首页动态吗？删除后需要重新填写。')) {
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
        <h3>首页动态信号</h3>
        <div class="panel-meta">{{ modelValue.length }} 张卡片</div>
      </div>
      <button class="button-link button-compact" type="button" @click="addItem">新增信号卡片</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有动态信号。</div>

    <div v-else class="compact-editor-list">
      <article
        v-for="(item, index) in modelValue"
        :key="`signal-${index}`"
        class="card-shell collapsible-card-shell"
        :class="{ 'is-open': isExpanded(index) }"
      >
        <button class="collapsible-card-summary" type="button" @click="toggleItem(index)">
          <div class="collapsible-card-copy">
            <strong>{{ getSignalLabel(item.title, index) }}</strong>
            <div class="collapsible-card-meta">
              <span v-if="item.eyebrow" class="collapsible-chip">{{ item.eyebrow }}</span>
              <span class="collapsible-chip">{{ getSignalHrefMeta(item.href) }}</span>
              <span v-if="item.meta" class="collapsible-chip">{{ item.meta }}</span>
            </div>
          </div>
          <span class="collapsible-card-toggle">{{ isExpanded(index) ? '收起' : '展开编辑' }}</span>
        </button>

        <div v-if="isExpanded(index)" class="collapsible-card-editor stacked-gap">
          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>眉标题</span>
              <input :value="item.eyebrow" placeholder="最新日报" @input="updateItem(index, 'eyebrow', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="field">
              <span>链接</span>
              <input :value="item.href" placeholder="/geekdaily" @input="updateItem(index, 'href', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>
          <label class="field">
            <span>标题</span>
            <input :value="item.title" placeholder="极客日报每天持续发声，像社区的现场频道。" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field">
            <span>摘要</span>
            <textarea rows="2" :value="item.summary" placeholder="描述这条动态信号的价值。" @input="updateItem(index, 'summary', ($event.target as HTMLTextAreaElement).value)" />
          </label>
          <label class="field">
            <span>补充标签</span>
            <input :value="item.meta" placeholder="按期数持续更新" @input="updateItem(index, 'meta', ($event.target as HTMLInputElement).value)" />
          </label>
          <div class="inline-actions">
            <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除信号卡片</button>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
