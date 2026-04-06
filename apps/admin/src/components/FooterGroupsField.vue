<script setup lang="ts">
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

const cloneGroups = () => props.modelValue.map((group) => ({ ...group, links: group.links.map((link) => ({ ...link })) }));

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

const addGroup = () => emit('update:modelValue', [...props.modelValue, { title: '', slug: '', links: [] }]);
const removeGroup = (index: number) => {
  if (!window.confirm('确认删除这个分组吗？分组下的所有链接都会一起删除。')) {
    return;
  }

  emit('update:modelValue', props.modelValue.filter((_, itemIndex) => itemIndex !== index));
};
const addLink = (groupIndex: number) => {
  const next = cloneGroups();
  next[groupIndex].links.push({ label: '', href: '' });
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
</script>

<template>
  <section class="stacked-gap">
    <div class="field-row field-row-spread">
      <h3>Footer 分组</h3>
      <button class="button-link" type="button" @click="addGroup">新增分组</button>
    </div>

    <div v-if="modelValue.length === 0" class="empty-inline">暂时还没有 footer 分组。</div>

    <div v-else class="stacked-gap">
      <div v-for="(group, groupIndex) in modelValue" :key="`footer-group-${groupIndex}`" class="card-shell stacked-gap">
        <div class="field-grid field-grid-2">
          <label class="field">
            <span>分组标题</span>
            <input :value="group.title" placeholder="社交媒体" @input="updateGroup(groupIndex, 'title', ($event.target as HTMLInputElement).value)" />
          </label>
          <label class="field">
            <span>分组 slug</span>
            <input :value="group.slug" placeholder="social" @input="updateGroup(groupIndex, 'slug', ($event.target as HTMLInputElement).value)" />
          </label>
        </div>

        <div class="stacked-gap">
          <div class="field-row field-row-spread">
            <strong>分组链接</strong>
            <button class="button-link" type="button" @click="addLink(groupIndex)">新增链接</button>
          </div>

          <div v-if="group.links.length === 0" class="empty-inline">这个分组还没有链接。</div>

          <div v-else class="stacked-gap">
            <div v-for="(link, linkIndex) in group.links" :key="`footer-link-${groupIndex}-${linkIndex}`" class="inline-editor-card">
              <div class="field-grid field-grid-2">
                <label class="field">
                  <span>标签</span>
                  <input :value="link.label" placeholder="X / Twitter" @input="updateLink(groupIndex, linkIndex, 'label', ($event.target as HTMLInputElement).value)" />
                </label>
                <label class="field">
                  <span>链接</span>
                  <input :value="link.href" placeholder="https://example.com" @input="updateLink(groupIndex, linkIndex, 'href', ($event.target as HTMLInputElement).value)" />
                </label>
              </div>
              <div class="panel-actions">
                <button class="button-link button-danger button-compact" type="button" @click="removeLink(groupIndex, linkIndex)">删除链接</button>
              </div>
            </div>
          </div>
        </div>

        <div class="panel-actions">
          <button class="button-link button-danger button-compact" type="button" @click="removeGroup(groupIndex)">删除分组</button>
        </div>
      </div>
    </div>
  </section>
</template>
