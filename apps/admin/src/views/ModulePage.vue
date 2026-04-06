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
      <p class="eyebrow">规划模块</p>
      <h2>{{ title }}</h2>
      <p>{{ summary }}</p>
    </article>

    <div class="module-grid">
      <article class="panel">
        <h3>为什么需要这个模块</h3>
        <p>
          Rebase 后台应该帮助工作人员更安全、更高效地完成运营任务，并由应用层负责校验与发布状态，而不是依赖临时的数据库改动。
        </p>
      </article>

      <article class="panel">
        <h3>基础能力</h3>
        <ul class="highlight-list">
          <li v-for="item in highlights" :key="item">{{ item }}</li>
        </ul>
      </article>
    </div>
  </section>
</template>
