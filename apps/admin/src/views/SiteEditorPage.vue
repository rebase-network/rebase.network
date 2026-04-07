<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';

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
const activeSection = ref<'settings' | 'home' | 'about'>('settings');

const sectionTabs = [
  { key: 'settings', label: '全局设置', detail: '域名、社交、页脚' },
  { key: 'home', label: '首页', detail: '首屏、动态、数据' },
  { key: 'about', label: '关于页', detail: '介绍、分段、SEO' },
] as const;

const siteStats = computed(() => [
  {
    label: '社交链接',
    value: settings.socialLinks.length,
    detail: '页脚与社区账号',
  },
  {
    label: '页脚分组',
    value: settings.footerGroups.length,
    detail: 'footer 导航块',
  },
  {
    label: '首页信号',
    value: home.homeSignals.length,
    detail: '首页动态卡片',
  },
  {
    label: '关于分段',
    value: about.sections.length,
    detail: '关于页内容块',
  },
]);

const activeSectionMeta = computed(() => sectionTabs.find((item) => item.key === activeSection.value) ?? sectionTabs[0]);
const domainSummary = computed(() => [settings.primaryDomain, settings.secondaryDomain, settings.mediaDomain].filter(Boolean));
const ctaSummary = computed(() =>
  [home.heroPrimaryCtaLabel, home.heroSecondaryCtaLabel].filter(Boolean).join(' / ') || '未设置按钮文案',
);

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
        <h2>站点页面</h2>
        <p>把首页、关于页和页脚内容收在同一个入口里维护。</p>
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

    <div v-else class="editor-grid site-editor-layout">
      <div class="stacked-gap editor-main">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <div>
              <h3>编辑板块</h3>
              <div class="panel-meta">{{ activeSectionMeta.detail }}</div>
            </div>
            <div class="panel-meta">{{ activeSectionMeta.label }}</div>
          </div>

          <div class="tab-strip">
            <button
              v-for="item in sectionTabs"
              :key="item.key"
              class="tab-button"
              :class="{ 'is-active': activeSection === item.key }"
              type="button"
              @click="activeSection = item.key"
            >
              {{ item.label }}
            </button>
          </div>
        </section>

        <section v-if="activeSection === 'settings'" class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>全局设置</h3>
            <div class="panel-meta">域名与页脚</div>
          </div>

          <div class="site-section-stack">
            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>站点基础</h4>
                  <p class="site-section-note">名称、标语和整体介绍。</p>
                </div>
              </div>

              <div class="field-grid field-grid-2 field-grid-compact">
                <label class="field">
                  <span>站点名称</span>
                  <input v-model="settings.siteName" type="text" placeholder="Rebase" />
                </label>
                <label class="field">
                  <span>站点标语</span>
                  <input v-model="settings.tagline" type="text" placeholder="面向 builder 与社区协作者的公共内容网络" />
                </label>
              </div>

              <label class="field">
                <span>站点描述</span>
                <textarea v-model="settings.description" rows="3" placeholder="描述站点整体定位与内容结构。" />
              </label>
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>域名配置</h4>
                  <p class="site-section-note">前台访问域名与媒体资源入口。</p>
                </div>
              </div>

              <div class="field-grid field-grid-3 field-grid-compact">
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
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>社区入口</h4>
                  <p class="site-section-note">页脚社交链接与外部入口。</p>
                </div>
              </div>

              <LinksField v-model="settings.socialLinks" title="社交链接" add-label="新增社交链接" :show-handle="true" :collapsible="true" />
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>页脚结构</h4>
                  <p class="site-section-note">版权文案和 footer 分组。</p>
                </div>
              </div>

              <label class="field">
                <span>版权文案</span>
                <input v-model="settings.copyrightText" type="text" placeholder="Copyright © Rebase Community. 保留所有权利。" />
              </label>

              <FooterGroupsField v-model="settings.footerGroups" />
            </article>
          </div>
        </section>

        <section v-else-if="activeSection === 'home'" class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>首页</h3>
            <div class="panel-meta">首屏与动态</div>
          </div>

          <div class="site-section-stack">
            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>首屏内容</h4>
                  <p class="site-section-note">首页第一屏文案与按钮入口。</p>
                </div>
              </div>

              <label class="field">
                <span>首屏标题</span>
                <input v-model="home.heroTitle" type="text" placeholder="把社区的日常内容，组织成一个值得反复访问的公共入口。" />
              </label>

              <label class="field">
                <span>首屏摘要</span>
                <textarea v-model="home.heroSummary" rows="3" placeholder="描述首页想要传达给读者的核心价值。" />
              </label>

              <div class="field-grid field-grid-2 field-grid-compact">
                <label class="field">
                  <span>主按钮文案</span>
                  <input v-model="home.heroPrimaryCtaLabel" type="text" placeholder="进入极客日报" />
                </label>
                <label class="field">
                  <span>主按钮链接</span>
                  <input v-model="home.heroPrimaryCtaUrl" type="text" placeholder="/geekdaily" />
                </label>
              </div>

              <div class="field-grid field-grid-2 field-grid-compact">
                <label class="field">
                  <span>次按钮文案</span>
                  <input v-model="home.heroSecondaryCtaLabel" type="text" placeholder="查看招聘板" />
                </label>
                <label class="field">
                  <span>次按钮链接</span>
                  <input v-model="home.heroSecondaryCtaUrl" type="text" placeholder="/who-is-hiring" />
                </label>
              </div>
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>首页动态</h4>
                  <p class="site-section-note">首页当前展示的内容信号与重点数据。</p>
                </div>
              </div>

              <HomeSignalsField v-model="home.homeSignals" />
              <HomeStatsField v-model="home.homeStats" />
            </article>
          </div>
        </section>

        <section v-else class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>关于页</h3>
            <div class="panel-meta">社区介绍</div>
          </div>

          <div class="site-section-stack">
            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>页面概述</h4>
                  <p class="site-section-note">关于页的标题与开场说明。</p>
                </div>
              </div>

              <label class="field">
                <span>页面标题</span>
                <input v-model="about.title" type="text" placeholder="Rebase 是一个围绕 builder..." />
              </label>

              <label class="field">
                <span>页面摘要</span>
                <textarea v-model="about.summary" rows="3" placeholder="概述 Rebase 社区的定位与参与方式。" />
              </label>
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>搜索摘要</h4>
                  <p class="site-section-note">这一组字段可以后补，先保持简短即可。</p>
                </div>
              </div>

              <div class="field-grid field-grid-2 field-grid-compact">
                <label class="field">
                  <span>SEO 标题</span>
                  <input v-model="about.seoTitle" type="text" placeholder="关于 Rebase 社区" />
                </label>
                <label class="field">
                  <span>SEO 描述</span>
                  <input v-model="about.seoDescription" type="text" placeholder="了解 Rebase 社区的定位、内容与参与方式。" />
                </label>
              </div>
            </article>

            <article class="site-section-card">
              <div class="site-section-head">
                <div class="stacked-gap-tight">
                  <h4>内容分段</h4>
                  <p class="site-section-note">按主题拆开介绍，支持 Markdown 链接、列表与地址展示。</p>
                </div>
              </div>

              <AboutSectionsField v-model="about.sections" />
            </article>
          </div>
        </section>
      </div>

      <aside class="stacked-gap editor-sidebar sticky-stack">
        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>站点概览</h3>
            <div class="panel-meta">{{ activeSectionMeta.label }}</div>
          </div>

          <div class="compact-stat-grid compact-stat-grid-4">
            <article v-for="item in siteStats" :key="item.label" class="compact-stat-card">
              <span class="compact-stat-label">{{ item.label }}</span>
              <strong>{{ item.value }}</strong>
              <small>{{ item.detail }}</small>
            </article>
          </div>
        </section>

        <section class="panel stacked-gap">
          <div class="panel-toolbar">
            <h3>编辑提示</h3>
            <div class="panel-meta">{{ domainSummary.length }} 个已填域名</div>
          </div>
          <dl class="summary-grid">
            <div class="summary-item">
              <dt>当前板块</dt>
              <dd>{{ activeSectionMeta.label }}</dd>
            </div>
            <div class="summary-item">
              <dt>本区重点</dt>
              <dd class="muted">{{ activeSectionMeta.detail }}</dd>
            </div>
            <div class="summary-item">
              <dt>主域名</dt>
              <dd class="muted">{{ settings.primaryDomain || '未填写' }}</dd>
            </div>
            <div class="summary-item">
              <dt>首屏按钮</dt>
              <dd class="muted">{{ ctaSummary }}</dd>
            </div>
            <div class="summary-item">
              <dt>保存方式</dt>
              <dd class="muted">顶部统一保存，切换板块不会丢失当前输入。</dd>
            </div>
          </dl>
        </section>
      </aside>
    </div>
  </section>
</template>
