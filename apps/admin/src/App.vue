<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink, RouterView, useRoute } from 'vue-router';

import { adminFoundationCards } from '@rebase/shared';

import { getVisibleAdminModules } from './lib/navigation';

const route = useRoute();
const modules = getVisibleAdminModules();
const pageTitle = computed(() => {
  const active = modules.find((item) => item.href === route.path);
  return active?.label ?? 'Rebase Admin';
});
</script>

<template>
  <div class="admin-shell">
    <aside class="sidebar">
      <RouterLink class="brand" to="/dashboard">
        <span class="brand-mark">r</span>
        <span>
          <strong>rebase admin</strong>
          <small>custom workspace foundation</small>
        </span>
      </RouterLink>

      <nav class="nav-list" aria-label="Admin navigation">
        <RouterLink v-for="item in modules" :key="item.key" class="nav-link" :to="item.href">
          <span>{{ item.label }}</span>
          <small>{{ item.summary }}</small>
        </RouterLink>
      </nav>
    </aside>

    <div class="main-shell">
      <header class="topbar">
        <div>
          <p class="eyebrow">foundation shell</p>
          <h1>{{ pageTitle }}</h1>
        </div>
        <RouterLink class="login-link" to="/login">login planning</RouterLink>
      </header>

      <main class="content-area">
        <RouterView />

        <section class="foundation-grid">
          <article v-for="item in adminFoundationCards" :key="item.title" class="panel">
            <h2>{{ item.title }}</h2>
            <p>{{ item.body }}</p>
          </article>
        </section>
      </main>
    </div>
  </div>
</template>
