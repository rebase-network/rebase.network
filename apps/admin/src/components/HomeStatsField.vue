<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ value: string; label: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ value: string; label: string }>];
}>();

const updateItem = (index: number, key: 'value' | 'label', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () => emit('update:modelValue', [...props.modelValue, { value: '', label: '' }]);
const removeItem = (index: number) => emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>首页数据卡片</h3>
      <button class="button-link" type="button" @click="addItem">新增数据</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有数据卡片。</div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`home-stat-${index}`" class="card-shell stacked-gap">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>数值</span>
            <input :value="item.value" placeholder="1809+" @input="updateItem(index, 'value', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field">
            <span>说明</span>
            <input :value="item.label" placeholder="GeekDaily episodes mapped for migration" @input="updateItem(index, 'label', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>
        <div class="panel-actions">
          <button class="button-link button-danger" type="button" @click="removeItem(index)">删除数据</button>
        </div>
      </div>
    </div>
  </section>
</template>
