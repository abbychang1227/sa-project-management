
<script setup>
defineProps({ stats: Object })
</script>

<template>
  <div class="stats">
    <div class="stat-card">
      <div class="stat-label">總專案</div>
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-description">目前管理中的專案</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">進行中</div>
      <div class="stat-value">{{ stats.normal }}</div>
      <div class="stat-description"><span class="dot green"></span>目前正常進行</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">暫緩</div>
      <div class="stat-value">{{ stats.paused }}</div>
      <div class="stat-description"><span class="dot gray"></span>目前暫緩專案</div>
    </div>
  </div>
</template>

<style scoped>
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-bottom:22px}
.stat-card{background:#fff;border:1px solid var(--pm-border);border-radius:14px;padding:22px 24px}
.stat-label{color:var(--pm-muted);font-size:16px}.stat-value{font-size:36px;line-height:1.1;font-weight:750;color:var(--pm-primary-dark);margin:9px 0}
.stat-description{font-size:16px;color:var(--pm-muted)}.dot{width:9px;height:9px;border-radius:50%;display:inline-block;margin-right:7px}.dot.green{background:var(--pm-success)}.dot.gray{background:var(--pm-paused)}
@media(max-width:900px){.stats{grid-template-columns:1fr}} 
</style>
