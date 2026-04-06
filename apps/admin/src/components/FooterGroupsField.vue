<script setup lang="ts">
import { ref, watch } from 'vue';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterGroup {
  title: string;
  slug: string;
  links: FooterLink[];
}

const props = defineProps<{
  modelValue: FooterGroup[];
}>();

const emit = defineEmits<{
  'update:modelValue': [value: FooterGroup[]];
}>();

const expandedIndex = ref<number | null>(null);

const cloneGroups = () => props.modelValue.map((group) => ({ ...group, links: group.links.map((link) => ({ ...link })) }));

const getGroupLabel = (group: FooterGroup, index: number) => group.title || group.slug || `分组 ${index + 1}`;
const isExpanded = (index: number) => expandedIndex.value === index;
const toggleGroup = (index: number) => {
  expandedIndex.value = expandedIndex.value === index ? null : index;
};

const updateGroup = (index: number, key: 'title' | 'slug', value: string) => {
  const next = cloneGroups();
  next[index][key] = value;
  emit('update:modelValue', next);
};

const updateLink = (groupIndex: number, linkIndex: number, key: 'label' | 'href', value: string) => {
  const next = cloneGroups();
  next[groupIndex].links[linkIndex][key] = value;
  emit('update:modelValue', next);
};

const addGroup = () => {
  expandedIndex.value = props.modelValue.length;
  emit('update:modelValue', [...props.modelValue, { title: '', slug: '', links: [] }]);
};
const removeGroup = (index: number) => {
  if (!window.confirm('确认删除这个分组吗？分组下的所有链接都会一起删除。')) {
    return;
  }

  if (expandedIndex.value === index) {
    expandedIndex.value = null;
  } else if (expandedIndex.value !== null && expandedIndex.value > index) {
    expandedIndex.value -= 1;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
const addLink = (groupIndex: number) => {
  const next = cloneGroups();
  next[groupIndex].links.push({ label: '', href: '' });
  expandedIndex.value = groupIndex;
  emit('update:modelValue', next);
};
const removeLink = (groupIndex: number, linkIndex: number) => {
  if (!window.confirm('确认删除这个链接吗？删除后需要重新填写。')) {
    return;
  }

  const next = cloneGroups();
  next[groupIndex].links = next[groupIndex].links.filter((_, itemIndex) => itemIndex !== linkIndex);
  emit('update:modelValue', next);
};

watch(
  () => props.modelValue.length,
  (length) => {
    if (length === 0) {
      expandedIndex.value = null;
      return;
    }

    if (expandedIndex.value !== null && expandedIndex.value >= length) {
      expandedIndex.value = length - 1;
    }
  },
);
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <div class="stacked-gap-tight">
        <h3>页脚分组</h3>
        <div class="panel-meta">{{ modelValue.length }} 个分组</div>
      </div>
      <button class="button-link button-compact" type="button" @click="addGroup">新增分组</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有页脚分组。</div>

    <div v-else class="compact-editor-list">
      <article
        v-for="(group, groupIndex) in modelValue"
        :key="`footer-group-${groupIndex}`"
        class="card-shell footer-group-shell"
        :class="{ 'is-open': isExpanded(groupIndex) }"
      >
        <button class="footer-group-summary" type="button" @click="toggleGroup(groupIndex)">
          <div class="footer-group-copy">
            <strong>{{ getGroupLabel(group, groupIndex) }}</strong>
            <div class="footer-group-meta">
              <span class="footer-group-chip">{{ group.slug || '未设置 slug' }}</span>
              <span class="footer-group-chip">{{ group.links.length }} 条链接</span>
            </div>
          </div>
          <span class="footer-group-toggle">{{ isExpanded(groupIndex) ? '收起' : '展开编辑' }}</span>
        </button>

        <div v-if="isExpanded(groupIndex)" class="footer-group-editor stacked-gap">
          <div class="field-grid field-grid-2 field-grid-compact">
            <label class="field">
              <span>分组标题</span>
              <input :value="group.title" placeholder="社交媒体" @input="updateGroup(groupIndex, 'title', ($event.target as HTMLInputElement).value)" />
            </label>
            <label class="field">
              <span>分组 slug</span>
              <input :value="group.slug" placeholder="social" @input="updateGroup(groupIndex, 'slug', ($event.target as HTMLInputElement).value)" />
            </label>
          </div>

          <div class="field-row field-row-spread">
            <strong>分组链接</strong>
            <div class="inline-actions">
              <button class="button-link button-compact" type="button" @click="addLink(groupIndex)">新增链接</button>
              <button class="button-link button-danger button-compact" type="button" @click="removeGroup(groupIndex)">删除分组</button>
            </div>
          </div>

          <div v-if="group.links.length === 0" class="empty-inline">这个分组还没有链接。</div>

          <div v-else class="footer-link-list">
            <div v-for="(link, linkIndex) in group.links" :key="`footer-link-${groupIndex}-${linkIndex}`" class="footer-link-row">
              <div class="field-grid field-grid-2 field-grid-compact">
                <label class="field">
                  <span>名称</span>
                  <input :value="link.label" placeholder="X / Twitter" @input="updateLink(groupIndex, linkIndex, 'label', ($event.target as HTMLInputElement).value)" />
                </label>
                <label class="field">
                  <span>链接</span>
                  <input :value="link.href" placeholder="https://example.com" @input="updateLink(groupIndex, linkIndex, 'href', ($event.target as HTMLInputElement).value)" />
                </label>
              </div>
              <button class="button-link button-danger button-compact" type="button" @click="removeLink(groupIndex, linkIndex)">删除</button>
            </div>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>
