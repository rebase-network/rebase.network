<script setup lang="ts">
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

const updateItem = (index: number, key: keyof LinkItem, value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, { label: '', href: '', handle: '' }]);
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
      <h3>{{ title }}</h3>
      <button class="button-link" type="button" @click="addItem">{{ addLabel }}</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有内容。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`${title}-${index}`" class="card-shell stacked-gap">
        <div class="field-grid" :class="showHandle ? 'field-grid-3' : 'field-grid-2'">
          <label class="field">
            <span>标签</span>
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
        <div class="panel-actions">
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除链接</button>
        </div>
      </div>
    </div>
  </section>
</template>
