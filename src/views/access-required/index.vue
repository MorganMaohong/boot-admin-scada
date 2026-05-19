<template>
  <div class="access-page">
    <div class="access-page__panel">
      <div class="access-page__badge">SCADA</div>
      <h1 class="access-page__title">请从主系统进入</h1>
      <p class="access-page__desc">当前系统仅接受主系统链接携带的 accessToken，不提供独立登录入口。</p>
      <p class="access-page__hint">请先登录 iotweb，再从主系统菜单打开当前页面。</p>
      <button class="access-page__button" type="button" @click="goBack">返回上一页</button>
    </div>
  </div>
</template>

<script setup lang="ts">
function goBack() {
  if (document.referrer) {
    window.location.href = document.referrer
    return
  }
  window.history.back()
}
</script>

<style scoped lang="scss">
.access-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background:
    radial-gradient(circle at top, rgba(59, 130, 246, 0.18), transparent 34%),
    linear-gradient(160deg, #0f172a 0%, #111827 45%, #1e293b 100%);
}

.access-page__panel {
  width: min(100%, 520px);
  padding: 36px 32px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 24px 80px rgba(15, 23, 42, 0.24);
  text-align: center;
}

.access-page__badge {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 700;
}

.access-page__title {
  margin: 18px 0 10px;
  font-size: 32px;
  line-height: 1.2;
  color: #0f172a;
}

.access-page__desc,
.access-page__hint {
  margin: 0;
  color: #475569;
  line-height: 1.7;
}

.access-page__hint {
  margin-top: 10px;
  margin-bottom: 24px;
}

.access-page__button {
  border: none;
  border-radius: 12px;
  background: #2563eb;
  color: #fff;
  height: 44px;
  padding: 0 24px;
  font-size: 15px;
  cursor: pointer;
}
</style>
