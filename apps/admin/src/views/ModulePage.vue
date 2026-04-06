<script setup lang="ts">
defineProps<{
  title: string;
  summary: string;
  highlights: string[];
}>();
</script>

<template>
  <section class="module-shell">
    <article class="hero-panel">
      <p class="eyebrow">planned module</p>
      <h2>{{ title }}</h2>
      <p>{{ summary }}</p>
    </article>

    <div class="module-grid">
      <article class="panel">
        <h3>Why this module exists</h3>
        <p>
          The Rebase admin should help staff complete editorial tasks safely and quickly, with validations and publish states
          handled by the application instead of ad hoc database edits.
        </p>
      </article>

      <article class="panel">
        <h3>Foundation highlights</h3>
        <ul class="highlight-list">
          <li v-for="item in highlights" :key="item">{{ item }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>
