<script setup lang="ts">
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
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>推荐条目</h3>
      <button class="button-link" type="button" @click="addItem">新增条目</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">至少添加一条推荐内容。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`geekdaily-item-${index}`" class="card-shell stacked-gap">
        <div class="field-row field-row-spread">
          <h3>条目 {{ index + 1 }}</h3>
          <button class="button-link button-danger" type="button" @click="removeItem(index)">删除条目</button>
        </div>
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>标题</span>
            <input :value="item.title" placeholder="项目或文章标题" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field">
            <span>推荐人</span>
            <input :value="item.authorName" placeholder="Cedric" @input="updateItem(index, 'authorName', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>
        <label class="field">
          <span>来源链接</span>
          <input :value="item.sourceUrl" placeholder="https://github.com/..." @input="updateItem(index, 'sourceUrl', ($event.target as HTMLInputElement).value)" />
        </label>
        <label class="field">
          <span>摘要</span>
          <textarea rows="2" :value="item.summary" placeholder="补充推荐理由和内容摘要。" @input="updateItem(index, 'summary', ($event.target as HTMLTextAreaElement).value)" />
        </label>
      </div>
    </div>
  </section>
</template>
