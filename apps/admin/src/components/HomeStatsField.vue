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
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这条首页数据吗？删除后需要重新填写。')) {
    return;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
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
      <div v-for="(item, index) in modelValue" :key="`home-stat-${index}`" class="card-shell compact-editor-card">
        <div class="compact-editor-head">
          <strong>{{ item.label || `数据 ${index + 1}` }}</strong>
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除</button>
        </div>

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
      </div>
    </div>
  </section>
</template>
