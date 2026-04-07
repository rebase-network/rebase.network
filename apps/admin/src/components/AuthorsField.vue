<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: Array<{ name: string; role?: string }>;
    showRole?: boolean;
  }>(),
  {
    showRole: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ name: string; role?: string }>];
}>();

const updateItem = (index: number, key: 'name' | 'role', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, { name: '', role: '' }]);
const removeItem = (index: number) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>作者</h3>
      <button class="button-link" type="button" @click="addItem">新增作者</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">至少添加一位作者。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`author-${index}`" class="card-shell stacked-gap">
        <div class="field-row field-row-spread">
          <h3>作者 {{ index + 1 }}</h3>
          <button class="button-link button-danger" type="button" @click="removeItem(index)">删除作者</button>
        </div>
        <div class="field-grid" :class="props.showRole ? 'field-grid-2' : undefined">
          <label class="field">
            <span>姓名</span>
            <input :value="item.name" placeholder="陈小明" @input="updateItem(index, 'name', ($event.target as HTMLInputElement).value)" />
          </label>
          <label v-if="props.showRole" class="field">
            <span>角色说明</span>
            <input :value="item.role ?? ''" placeholder="编辑 / 组织者" @input="updateItem(index, 'role', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>
      </div>
    </div>
  </section>
</template>
