<script setup>
defineProps({ stats: Object })
</script>

<template>
  <div class="stats">
    <!-- 總專案 -->
    <div class="stat-card">
      <div class="stat-label">總專案</div>
      <div class="stat-value">{{ stats.total }}</div>
      <div class="stat-description">目前管理中的專案</div>
    </div>

    <!-- 提案中 -->
    <div class="stat-card">
      <div class="stat-label">提案中</div>
      <div class="stat-value">{{ stats.proposal }}</div>
      <div class="stat-description">
        <span class="dot proposal"></span>
        提案階段專案
      </div>
    </div>

    <!-- 開發中 -->
    <div class="stat-card">
      <div class="stat-label">開發中</div>
      <div class="stat-value">{{ stats.development }}</div>
      <div class="stat-description">
        <span class="dot development"></span>
        目前開發中
      </div>
    </div>

    <!-- 驗收中 -->
    <div class="stat-card">
      <div class="stat-label">驗收中</div>
      <div class="stat-value">{{ stats.acceptance }}</div>
      <div class="stat-description">
        <span class="dot acceptance"></span>
        目前驗收中
      </div>
    </div>

    <!-- 維運中 -->
    <div class="stat-card">
      <div class="stat-label">維運中</div>
      <div class="stat-value">{{ stats.maintenance }}</div>
      <div class="stat-description">
        <span class="dot maintenance"></span>
        目前維運中
      </div>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 14px;
  margin-bottom: 22px;
}

.stat-card {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  padding: 20px;
}

.stat-label {
  color: var(--pm-muted);
  font-size: 16px;
}

.stat-value {
  font-size: 34px;
  line-height: 1.1;
  font-weight: 750;
  color: var(--pm-primary-dark);
  margin: 9px 0;
}

.stat-description {
  font-size: 15px;
  color: var(--pm-muted);
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 7px;
}

.dot.proposal {
  background: #d6a84f;
}

.dot.development {
  background: var(--pm-success);
}

.dot.acceptance {
  background: #5f8fb5;
}

.dot.maintenance {
  background: #8b6baa;
}

@media (max-width: 1200px) {
  .stats {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .stats {
    grid-template-columns: 1fr;
  }
}
</style>