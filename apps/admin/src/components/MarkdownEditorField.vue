<script setup lang="ts">
import { computed, ref } from 'vue';

import { renderMarkdownToHtml } from '@rebase/shared';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    error?: string;
    rows?: number;
    inline?: boolean;
  }>(),
  {
    label: 'Markdown',
    placeholder: '',
    error: '',
    rows: 12,
    inline: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const activeTab = ref<'write' | 'preview'>('write');
const previewHtml = computed(() => renderMarkdownToHtml(props.modelValue || ''));
</script>

<template>
  <div v-if="inline" class="field-shell markdown-editor-inline">
    <div class="markdown-editor-label">
      <span>{{ label }}</span>
      <small v-if="error" class="field-error">{{ error }}</small>
    </div>

    <div class="markdown-editor-body">
      <div class="field-row field-row-spread">
        <span class="preview-label">内容区域</span>
        <div class="tab-strip">
          <button class="tab-button" :class="{ 'is-active': activeTab === 'write' }" type="button" @click="activeTab = 'write'">
            编辑
          </button>
          <button class="tab-button" :class="{ 'is-active': activeTab === 'preview' }" type="button" @click="activeTab = 'preview'">
            预览
          </button>
        </div>
      </div>

      <textarea
        v-if="activeTab === 'write'"
        :rows="rows"
        :placeholder="placeholder"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
      />

      <article v-else class="markdown-preview" v-html="previewHtml" />
    </div>
  </div>

  <div v-else class="field stacked-gap field-shell">
    <div class="field-row field-row-spread">
      <span>{{ label }}</span>
      <div class="tab-strip">
        <button class="tab-button" :class="{ 'is-active': activeTab === 'write' }" type="button" @click="activeTab = 'write'">
          编辑
        </button>
        <button class="tab-button" :class="{ 'is-active': activeTab === 'preview' }" type="button" @click="activeTab = 'preview'">
          预览
        </button>
      </div>
    </div>

    <textarea
      v-if="activeTab === 'write'"
      :rows="rows"
      :placeholder="placeholder"
      :value="modelValue"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />

    <article v-else class="markdown-preview" v-html="previewHtml" />

    <small v-if="error" class="field-error">{{ error }}</small>
  </div>
</template>
