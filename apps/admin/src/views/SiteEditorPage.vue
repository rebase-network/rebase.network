<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue';

import type { AdminSiteEditorPayload, HomePageInput, SiteSettingsInput, AboutPageInput } from '@rebase/shared';

import AboutSectionsField from '../components/AboutSectionsField.vue';
import FooterGroupsField from '../components/FooterGroupsField.vue';
import HomeSignalsField from '../components/HomeSignalsField.vue';
import HomeStatsField from '../components/HomeStatsField.vue';
import LinksField from '../components/LinksField.vue';
import { adminFetch, adminRequest } from '../lib/api';

const settings = reactive<SiteSettingsInput>({
  siteName: '',
  tagline: '',
  description: '',
  primaryDomain: '',
  secondaryDomain: '',
  mediaDomain: '',
  socialLinks: [],
  footerGroups: [],
  copyrightText: '',
});

const home = reactive<HomePageInput>({
  heroTitle: '',
  heroSummary: '',
  heroPrimaryCtaLabel: '',
  heroPrimaryCtaUrl: '',
  heroSecondaryCtaLabel: '',
  heroSecondaryCtaUrl: '',
  homeSignals: [],
  homeStats: [],
});

const about = reactive<AboutPageInput>({
  title: '',
  summary: '',
  sections: [],
  seoTitle: '',
  seoDescription: '',
});

const loading = ref(true);
const saving = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

const applyPayload = (payload: AdminSiteEditorPayload) => {
  Object.assign(settings, payload.settings);
  Object.assign(home, payload.home);
  Object.assign(about, payload.about);
};

const loadSite = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    applyPayload(await adminFetch<AdminSiteEditorPayload>('/api/admin/v1/site'));
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法加载站点内容。';
  } finally {
    loading.value = false;
  }
};

const saveAll = async () => {
  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';
  try {
    await adminRequest('/api/admin/v1/site/settings', { method: 'PATCH', body: settings });
    await adminRequest('/api/admin/v1/site/home', { method: 'PATCH', body: home });
    const nextPayload = await adminRequest<AdminSiteEditorPayload>('/api/admin/v1/site/about', { method: 'PATCH', body: about });
    applyPayload(nextPayload);
    successMessage.value = '站点内容已保存。';
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '无法保存站点内容。';
  } finally {
    saving.value = false;
  }
};

onMounted(() => void loadSite());
</script>

<template>
  <section class="stacked-gap">
    <header class="page-header page-header-row">
      <div>
        <h2>站点结构与页面</h2>
        <p>站点与页面内容</p>
      </div>
      <div class="page-actions">
        <button class="button-link button-primary" type="button" :disabled="loading || saving" @click="saveAll">
          {{ saving ? '保存中…' : '保存全部修改' }}
        </button>
      </div>
    </header>

    <div v-if="errorMessage" class="panel panel-danger"><p>{{ errorMessage }}</p></div>
    <div v-if="successMessage" class="panel panel-success"><p>{{ successMessage }}</p></div>
    <div v-if="loading" class="panel"><p>正在加载站点配置…</p></div>

    <div v-else class="stacked-gap">
      <section class="panel stacked-gap">
        <div class="panel-toolbar">
          <h3>全局设置</h3>
          <div class="panel-meta">全局</div>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>站点名称</span>
            <input v-model="settings.siteName" type="text" placeholder="Rebase" />
          </label>
          <label class="field">
            <span>站点标语</span>
            <input v-model="settings.tagline" type="text" placeholder="A community media network for builders..." />
          </label>
        </div>

        <label class="field">
          <span>站点描述</span>
          <textarea v-model="settings.description" rows="3" placeholder="描述站点整体定位与内容结构。" />
        </label>

        <div class="field-grid field-grid-3">
          <label class="field">
            <span>主域名</span>
            <input v-model="settings.primaryDomain" type="url" placeholder="https://rebase.network" />
          </label>
          <label class="field">
            <span>辅助域名</span>
            <input v-model="settings.secondaryDomain" type="url" placeholder="https://rebase.community" />
          </label>
          <label class="field">
            <span>媒体域名</span>
            <input v-model="settings.mediaDomain" type="url" placeholder="https://media.rebase.network" />
          </label>
        </div>

        <LinksField v-model="settings.socialLinks" title="社交链接" add-label="新增社交链接" :show-handle="true" />
        <FooterGroupsField v-model="settings.footerGroups" />

        <label class="field">
          <span>Copyright</span>
          <input v-model="settings.copyrightText" type="text" placeholder="Copyright © Rebase Community. All rights reserved." />
        </label>
      </section>

      <section class="panel stacked-gap">
        <div class="panel-toolbar">
          <h3>首页</h3>
          <div class="panel-meta">首页</div>
        </div>

        <label class="field">
          <span>Hero 标题</span>
          <input v-model="home.heroTitle" type="text" placeholder="把社区的日常内容，组织成一个值得反复访问的公共入口。" />
        </label>

        <label class="field">
          <span>Hero 摘要</span>
          <textarea v-model="home.heroSummary" rows="3" placeholder="描述首页想要传达给读者的核心价值。" />
        </label>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>主按钮文案</span>
            <input v-model="home.heroPrimaryCtaLabel" type="text" placeholder="进入 GeekDaily" />
          </label>
          <label class="field">
            <span>主按钮链接</span>
            <input v-model="home.heroPrimaryCtaUrl" type="text" placeholder="/geekdaily" />
          </label>
        </div>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>次按钮文案</span>
            <input v-model="home.heroSecondaryCtaLabel" type="text" placeholder="查看招聘板" />
          </label>
          <label class="field">
            <span>次按钮链接</span>
            <input v-model="home.heroSecondaryCtaUrl" type="text" placeholder="/who-is-hiring" />
          </label>
        </div>

        <HomeSignalsField v-model="home.homeSignals" />
        <HomeStatsField v-model="home.homeStats" />
      </section>

      <section class="panel stacked-gap">
        <div class="panel-toolbar">
          <h3>About 页面</h3>
          <div class="panel-meta">About</div>
        </div>

        <label class="field">
          <span>页面标题</span>
          <input v-model="about.title" type="text" placeholder="Rebase 是一个围绕 builder..." />
        </label>

        <label class="field">
          <span>页面摘要</span>
          <textarea v-model="about.summary" rows="3" placeholder="概述 Rebase 社区的定位与参与方式。" />
        </label>

        <div class="field-grid field-grid-2">
          <label class="field">
            <span>SEO 标题</span>
            <input v-model="about.seoTitle" type="text" placeholder="About Rebase" />
          </label>
          <label class="field">
            <span>SEO 描述</span>
            <input v-model="about.seoDescription" type="text" placeholder="Learn about the Rebase community." />
          </label>
        </div>

        <AboutSectionsField v-model="about.sections" />
      </section>
    </div>
  </section>
</template>
