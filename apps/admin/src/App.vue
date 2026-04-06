<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router';

import type { AdminMePayload } from '@rebase/shared';

import { authClient } from './lib/auth-client';
import { adminFetch } from './lib/api';
import { getVisibleAdminModules } from './lib/navigation';

const route = useRoute();
const router = useRouter();

const me = ref<AdminMePayload | null>(null);
const loadingMe = ref(false);
const showShell = computed(() => route.name !== 'login');
const sidebarModules = computed(() => getVisibleAdminModules(me.value, loadingMe.value));

const loadMe = async () => {
  if (!showShell.value) {
    return;
  }

  loadingMe.value = true;
  try {
    me.value = await adminFetch<AdminMePayload>('/api/admin/v1/me');
  } catch {
    me.value = null;
  } finally {
    loadingMe.value = false;
  }
};

const signOut = async () => {
  await authClient.signOut();
  me.value = null;
  await router.push('/login');
};

watch(
  () => route.fullPath,
  () => {
    void loadMe();
  },
);

onMounted(() => {
  void loadMe();
});
</script>

<template>
  <RouterView v-if="!showShell" />

  <div v-else class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-inner">
        <RouterLink class="brand" to="/dashboard">
          <div class="brand-mark">RB</div>
          <div>
            <strong>rebase 后台</strong>
            <small>内容运营</small>
          </div>
        </RouterLink>

        <nav class="nav sidebar-nav" aria-label="后台导航">
          <RouterLink v-for="item in sidebarModules" :key="item.key" :to="item.href" class="nav-link">
            <span>{{ item.label }}</span>
          </RouterLink>
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-account">
            <strong>{{ me?.staffAccount?.displayName ?? me?.user?.name ?? '工作人员' }}</strong>
            <span>{{ me?.user?.email ?? (loadingMe ? '正在读取账号信息…' : '未登录') }}</span>
          </div>

          <button class="nav-link nav-button" type="button" @click="signOut">退出登录</button>
        </div>
      </div>
    </aside>

    <main class="main">
      <RouterView />
    </main>
  </div>
</template>
