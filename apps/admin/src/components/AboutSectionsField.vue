<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ title: string; body: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ title: string; body: string }>];
}>();

const updateItem = (index: number, key: 'title' | 'body', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, { title: '', body: '' }]);
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这个分段吗？删除后需要重新填写。')) {
    return;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
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
      <div v-for="(item, index) in modelValue" :key="`about-section-${index}`" class="card-shell compact-editor-card">
        <div class="compact-editor-head">
          <strong>{{ item.title || `分段 ${index + 1}` }}</strong>
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除</button>
        </div>
        <label class="field">
          <span>标题</span>
          <input :value="item.title" placeholder="为什么是 Rebase" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
        </label>
        <label class="field">
          <span>正文</span>
          <textarea rows="3" :value="item.body" placeholder="描述这一部分的内容。" @input="updateItem(index, 'body', ($event.target as HTMLTextAreaElement).value)" />
        </label>
      </div>
    </div>
  </section>
</template>
