<script setup lang="ts">
import { adminModules } from '@rebase/shared';

const counts = [
  { label: 'planned modules', value: adminModules.length },
  { label: 'public routes already live', value: 7 },
  { label: 'new planning docs', value: 3 },
];
</script>

<template>
  <section class="module-shell">
    <article class="hero-panel">
      <p class="eyebrow">rebase admin direction</p>
      <h2>Build a task-oriented workspace for community staff.</h2>
      <p>
        This foundation shell marks the shift away from a generic CMS prototype and toward a dedicated Rebase admin.
      </p>
    </article>

    <div class="dashboard-grid">
      <article v-for="item in counts" :key="item.label" class="panel stat-card">
        <span class="eyebrow">{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
      </article>
    </div>
  </section>
</template>
