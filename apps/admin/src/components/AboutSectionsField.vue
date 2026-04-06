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
const removeItem = (index: number) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>关于页分段</h3>
      <button class="button-link" type="button" @click="addItem">新增分段</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容分段。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`about-section-${index}`" class="card-shell stacked-gap">
        <label class="field">
          <span>标题</span>
          <input :value="item.title" placeholder="为什么是 Rebase" @input="updateItem(index, 'title', ($event.target as HTMLInputElement).value)" />
        </label>
        <label class="field">
          <span>正文</span>
          <textarea rows="4" :value="item.body" placeholder="描述这一部分的内容。" @input="updateItem(index, 'body', ($event.target as HTMLTextAreaElement).value)" />
        </label>
        <div class="panel-actions">
          <button class="button-link button-danger" type="button" @click="removeItem(index)">删除分段</button>
        </div>
      </div>
    </div>
  </section>
</template>
