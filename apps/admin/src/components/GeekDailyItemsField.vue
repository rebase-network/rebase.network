<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: Array<{ title: string; authorName: string; sourceUrl: string; summary: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ title: string; authorName: string; sourceUrl: string; summary: string }>];
}>();

const updateItem = (index: number, key: 'title' | 'authorName' | 'sourceUrl' | 'summary', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, { title: '', authorName: '', sourceUrl: '', summary: '' }]);
const removeItem = (index: number) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));

const countNotice = computed(() => {
  if (props.modelValue.length < 3) {
    return {
      tone: 'warning',
      text: `当前仅 ${props.modelValue.length} 条推荐，建议补足到 3 条。`,
    };
  }

  if (props.modelValue.length > 3) {
    return {
      tone: 'exception',
      text: `当前为 ${props.modelValue.length} 条推荐，属于例外期数，请确认后再保存。`,
    };
  }

  return null;
});
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>推荐条目</h3>
      <button class="button-link button-compact" type="button" @click="addItem">新增条目</button>
    </div>

    <div
      v-if="countNotice"
      class="inline-status"
      :class="countNotice.tone === 'exception' ? 'inline-status-exception' : 'inline-status-warning'"
    >
      {{ countNotice.text }}
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">至少添加一条推荐内容。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`geekdaily-item-${index}`" class="card-shell stacked-gap geekdaily-item-card">
        <div class="field-row field-row-spread geekdaily-item-card-header">
          <h3>条目 {{ index + 1 }}</h3>
          <button class="button-link button-compact button-danger" type="button" @click="removeItem(index)">删除条目</button>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>标题</span>
            </div>
            <div class="field-inline-control">
              <input :value="item.title" placeholder="项目或文章标题" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
            </div>
          </label>
          <label class="field-inline-row field-inline-row-compact">
            <div class="field-inline-label">
              <span>推荐人</span>
            </div>
            <div class="field-inline-control">
              <input :value="item.authorName" placeholder="Cedric" @input="updateItem(index, 'authorName', ($event.target as HTMLInputElement).value)" />
            </div>
          </label>
        </div>
        <label class="field-inline-row field-inline-row-compact">
          <div class="field-inline-label">
            <span>来源链接</span>
          </div>
          <div class="field-inline-control">
            <input :value="item.sourceUrl" placeholder="https://github.com/..." @input="updateItem(index, 'sourceUrl', ($event.target as HTMLInputElement).value)" />
          </div>
        </label>
        <label class="field-inline-row field-inline-row-compact">
          <div class="field-inline-label">
            <span>推荐语</span>
          </div>
          <div class="field-inline-control">
            <textarea rows="3" :value="item.summary" placeholder="填写推荐理由，说明为什么值得看。" @input="updateItem(index, 'summary', ($event.target as HTMLTextAreaElement).value)" />
          </div>
        </label>
      </div>
    </div>
  </section>
</template>
