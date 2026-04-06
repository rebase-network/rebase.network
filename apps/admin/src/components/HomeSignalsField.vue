<script setup lang="ts">
const props = defineProps<{
  modelValue: Array<{ eyebrow: string; title: string; summary: string; href: string; meta: string }>;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Array<{ eyebrow: string; title: string; summary: string; href: string; meta: string }>];
}>();

const updateItem = (index: number, key: 'eyebrow' | 'title' | 'summary' | 'href' | 'meta', value: string) => {
  const next = props.modelValue.map((item) => ({ ...item }));
  next[index][key] = value;
  emit('update:modelValue', next);
};

const addItem = () =>
  emit('update:modelValue', [...props.modelValue, { eyebrow: '', title: '', summary: '', href: '', meta: '' }]);
const removeItem = (index: number) => {
  if (!window.confirm('确认删除这条首页动态吗？删除后需要重新填写。')) {
    return;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
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
      <div v-for="(item, index) in modelValue" :key="`signal-${index}`" class="card-shell compact-editor-card">
        <div class="compact-editor-head">
          <strong>{{ item.title || `动态 ${index + 1}` }}</strong>
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除</button>
        </div>

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
      </div>
    </div>
  </section>
</template>
