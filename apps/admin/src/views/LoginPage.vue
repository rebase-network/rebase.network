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
          <p>
            这里不是一个“面向数据库”的控制台，而是面向社区运营工作流的内容工作台。文章、GeekDaily、招聘、活动、贡献者、站点结构与人员权限都在这里统一维护。
          </p>
        </div>

        <div class="login-highlight-grid">
          <article class="login-highlight-card">
            <span>内容组织</span>
            <strong>首页、About、文章与 GeekDaily</strong>
            <p>将社区持续更新的内容整理成清晰、可发布、可回看的公共入口。</p>
          </article>
          <article class="login-highlight-card">
            <span>机会流转</span>
            <strong>招聘、活动与贡献者信息</strong>
            <p>让运营同学通过结构化表单维护社区机会与参与路径，而不是直接操作数据库。</p>
          </article>
          <article class="login-highlight-card">
            <span>权限边界</span>
            <strong>Better Auth + 角色权限</strong>
            <p>只有工作人员可以进入后台，所有敏感变更都有可追溯的角色与审计记录。</p>
          </article>
        </div>
      </aside>

      <section class="panel login-card stacked-gap">
        <div class="login-card-head stacked-gap-tight">
          <div class="brand-tag">local bootstrap</div>
          <h2>登录控制台</h2>
          <p>本地环境已预置开发管理员账号，便于快速验证后台工作流。</p>
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
