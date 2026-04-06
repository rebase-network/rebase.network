<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';

import { authClient } from '../lib/auth-client';

const router = useRouter();
const form = reactive({
  email: 'admin@rebase.local',
  password: 'RebaseAdmin123456!',
});
const loading = ref(false);
const errorMessage = ref('');

const localizeAuthErrorMessage = (message: string | null | undefined) => {
  if (!message) {
    return '登录失败，请检查账号信息后重试。';
  }

  switch (message.trim()) {
    case 'Invalid email or password':
    case 'Invalid email or password.':
      return '邮箱或密码错误。';
    case 'Email is required':
    case 'Email is required.':
      return '请输入邮箱。';
    case 'Password is required':
    case 'Password is required.':
      return '请输入密码。';
    default:
      return '登录失败，请检查账号信息后重试。';
  }
};

const signIn = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const result = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });

    if (result.error) {
      errorMessage.value = localizeAuthErrorMessage(result.error.message);
      return;
    }

    await router.push('/dashboard');
  } catch (error) {
    errorMessage.value = error instanceof Error ? localizeAuthErrorMessage(error.message) : '登录失败。';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <main class="login-shell">
    <section class="login-layout">
      <aside class="login-hero">
        <div class="brand-tag">工作人员后台</div>
        <div class="login-hero-copy">
          <h1>Rebase 社区运营后台</h1>
          <p>统一维护文章、极客日报、招聘、活动、贡献者与站点内容。</p>
        </div>

        <div class="login-highlight-grid">
          <article class="login-highlight-card">
            <span>内容组织</span>
            <strong>首页、About、文章与极客日报</strong>
            <p>编辑、发布、回看。</p>
          </article>
          <article class="login-highlight-card">
            <span>机会流转</span>
            <strong>招聘、活动与贡献者信息</strong>
            <p>结构化录入与维护。</p>
          </article>
          <article class="login-highlight-card">
            <span>权限边界</span>
            <strong>Better Auth + 角色权限</strong>
            <p>仅工作人员可访问。</p>
          </article>
        </div>
      </aside>

      <section class="panel login-card stacked-gap">
        <div class="login-card-head stacked-gap-tight">
          <div class="brand-tag">本地调试</div>
          <h2>登录控制台</h2>
          <p>使用本地默认账号即可进入。</p>
        </div>

        <div class="login-credential-note">
          <span class="preview-label">本地默认账号</span>
          <p>
            <code>admin@rebase.local</code>
            <span>/</span>
            <code>RebaseAdmin123456!</code>
          </p>
        </div>

        <form class="login-form" @submit.prevent="signIn">
          <label class="field">
            <span>邮箱</span>
            <input v-model="form.email" type="email" autocomplete="email" required />
          </label>

          <label class="field">
            <span>密码</span>
            <input v-model="form.password" type="password" autocomplete="current-password" required />
          </label>

          <button class="button-link button-primary login-submit" type="submit" :disabled="loading">
            {{ loading ? '登录中…' : '登录后台' }}
          </button>
        </form>

        <p v-if="errorMessage" class="login-error">{{ errorMessage }}</p>
      </section>
    </section>
  </main>
</template>
