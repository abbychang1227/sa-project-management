<script setup>
defineProps({ currentPage: String });
const emit = defineEmits(['navigate']);
</script>
<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="brand-icon">SA</div>
      <div>
        <!-- <div class="brand-name">Project Flow</div> -->
        <div class="brand-subtitle">SA 專案控管 </div>
      </div>
    </div>
    <nav class="nav">
      <div class="nav-section">專案管理</div>
      <button
        class="nav-item"
        :class="{ active: currentPage === 'overview' }"
        @click="emit('navigate', 'overview')"
      >
        ▦ <span>專案總覽</span>
      </button>
      <button
        class="nav-item"
        :class="{ active: currentPage === 'all-gantt' }"
        @click="emit('navigate', 'all-gantt')"
      >
        ▤ <span>總專案甘特</span>
      </button>
      <div class="nav-section">系統設定</div>
      <button
        class="nav-item"
        :class="{ active: currentPage === 'templates' }"
        @click="emit('navigate', 'templates')"
      >
        ◈ <span>甘特模板管理</span>
      </button>
    </nav>
    <!-- <div class="sidebar-footer"><div class="user-avatar">A</div><div><div class="user-name">專案管理者</div><div class="user-role">Administrator</div></div></div> -->
  </aside>
</template>
<style scoped>
.sidebar {
  width: 250px;
  background: var(--pm-primary-dark);
  color: #fff;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
}
.brand {
  height: 88px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14);
}
.brand-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  background: #fff;
  color: var(--pm-primary-dark);
  font-weight: 800;
}
.brand-name {
  font-weight: 800;
  font-size: 19px;
}
.brand-subtitle {
  font-size: 20px;
  color: #dce8e7;
 
}
.nav {
  padding: 22px 12px;
}
.nav-section {
  color: #bfd0d0;
  font-size: 18px;
  font-weight: 500;
  padding: 13px 12px;
  letter-spacing: 0.05em;
}
.nav-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #e7efee;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 12px;
  border-radius: 9px;
  cursor: pointer;
  text-align: left;
  font-size: 17px;
  margin-bottom: 5px;
}
.nav-item:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}
.nav-item.active {
  background: #fff;
  color: var(--pm-primary-dark);
  font-weight: 600;
}
.sidebar-footer {
  margin-top: auto;
  padding: 19px;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  display: flex;
  align-items: center;
  gap: 10px;
}
.user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #6e8996;
  display: grid;
  place-items: center;
  font-weight: 700;
}
.user-name {
  font-size: 16px;
}
.user-role {
  font-size: 14px;
  color: #dce8e7;
}
</style>
