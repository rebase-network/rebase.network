<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: string[];
    label: string;
    addLabel?: string;
    placeholder?: string;
  }>(),
  {
    addLabel: '新增一项',
    placeholder: '请输入内容',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

const updateItem = (index: number, value: string) => {
  const next = [...props.modelValue];
  next[index] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, '']);
const removeItem = (index: number) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>{{ label }}</h3>
      <button class="button-link" type="button" @click="addItem">{{ addLabel }}</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`${label}-${index}`" class="inline-editor-row">
        <input :value="item" :placeholder="placeholder" @input="updateItem(index, ($event.target as HTMLInputElement).value)" />
        <button class="button-link button-danger" type="button" @click="removeItem(index)">删除</button>
      </div>
    </div>
  </section>
</template>
