<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    modelValue: Array<{ name: string; role?: string }>;
    showRole?: boolean;
    compact?: boolean;
    title?: string;
    addLabel?: string;
    issues?: Record<string, string>;
  }>(),
  {
    showRole: true,
    compact: false,
    title: '作者',
    addLabel: '新增作者',
    issues: () => ({}),
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

const hasIssue = (path: string) => {
  if (props.issues[path]) {
    return true;
  }

  const nestedPrefix = `${path}.`;
  return Object.keys(props.issues).some((key) => key.startsWith(nestedPrefix));
};

const fieldError = (index: number, key: 'name' | 'role') => props.issues[`authors.${index}.${key}`] ?? '';
const rootError = computed(() => props.issues.authors ?? '');
const hasAnyIssue = computed(() => hasIssue('authors'));
</script>

<template>
  <section class="stacked-gap authors-field" :class="{ 'authors-field-has-error': hasAnyIssue }">
    <div class="field-row field-row-spread">
      <h3>{{ title }}</h3>
      <button class="button-link" type="button" @click="addItem">{{ addLabel }}</button>
    </div>

    <small v-if="rootError" class="field-error">{{ rootError }}</small>
    <div v-if="modelValue.length === 0" class="empty-inline">至少添加一位作者。</div>

    <div v-else-if="compact" class="stacked-gap">
      <div
        v-for="(item, index) in modelValue"
        :key="`author-compact-${index}`"
        class="authors-field-compact-card"
        :class="{
          'authors-field-compact-card-with-role': props.showRole,
          'authors-field-compact-card-error': fieldError(index, 'name') || (props.showRole && fieldError(index, 'role')),
        }"
      >
        <div class="authors-field-compact-row">
          <input
            class="authors-field-compact-input"
            :class="{ 'authors-field-compact-input-error': fieldError(index, 'name') }"
            :value="item.name"
            placeholder="作者姓名"
            @input="updateItem(index, 'name', ($event.target as HTMLInputElement).value)"
          />
          <input
            v-if="props.showRole"
            class="authors-field-compact-input"
            :class="{ 'authors-field-compact-input-error': fieldError(index, 'role') }"
            :value="item.role ?? ''"
            placeholder="角色说明"
            @input="updateItem(index, 'role', ($event.target as HTMLInputElement).value)"
          />
          <button class="button-link button-danger button-compact" type="button" @click="removeItem(index)">删除</button>
        </div>

        <small v-if="fieldError(index, 'name')" class="field-error">{{ fieldError(index, 'name') }}</small>
        <small v-if="props.showRole && fieldError(index, 'role')" class="field-error">{{ fieldError(index, 'role') }}</small>
      </div>
    </div>

    <div v-else class="stacked-gap">
      <div v-for="(item, index) in modelValue" :key="`author-${index}`" class="card-shell stacked-gap">
        <div class="field-row field-row-spread">
          <h3>作者 {{ index + 1 }}</h3>
          <button class="button-link button-danger" type="button" @click="removeItem(index)">删除作者</button>
        </div>
        <div class="field-grid" :class="props.showRole ? 'field-grid-2' : undefined">
          <label class="field" :class="{ 'has-error': fieldError(index, 'name') }">
            <span>姓名</span>
            <input :value="item.name" placeholder="陈小明" @input="updateItem(index, 'name', ($event.target as HTMLInputElement).value)" />
            <small v-if="fieldError(index, 'name')" class="field-error">{{ fieldError(index, 'name') }}</small>
          </label>
          <label v-if="props.showRole" class="field" :class="{ 'has-error': fieldError(index, 'role') }">
            <span>角色说明</span>
            <input :value="item.role ?? ''" placeholder="编辑 / 组织者" @input="updateItem(index, 'role', ($event.target as HTMLInputElement).value)" />
            <small v-if="fieldError(index, 'role')" class="field-error">{{ fieldError(index, 'role') }}</small>
          </label>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.authors-field {
  gap: 0.6rem;
}

.authors-field-has-error {
  padding: 0.72rem;
  border: 1px solid rgba(167, 52, 32, 0.22);
  border-radius: 12px;
  background: color-mix(in srgb, rgba(255, 255, 255, 0.9) 78%, var(--surface-danger));
}

.authors-field-compact-card {
  display: grid;
  gap: 0.34rem;
  padding: 0.55rem;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.66);
}

.authors-field-compact-card-error {
  border-color: rgba(167, 52, 32, 0.22);
  background: rgba(255, 247, 245, 0.92);
}

.authors-field-compact-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.5rem;
  align-items: center;
}

.authors-field-compact-card-with-role .authors-field-compact-row {
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.72fr) auto;
}

.authors-field-compact-input {
  min-width: 0;
}

.authors-field-compact-input-error {
  border-color: rgba(167, 52, 32, 0.32);
  background: rgba(255, 247, 245, 0.95);
}
</style>
