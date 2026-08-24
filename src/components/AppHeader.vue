<script setup>
defineProps({
  title: {
    type: String,
    default: '',
  },

  breadcrumb: {
    type: String,
    default: '',
  },

  showExport: {
    type: Boolean,
    default: false,
  },

  exportLabel: {
    type: String,
    default: '匯出 Excel',
  },

  showAdd: {
    type: Boolean,
    default: false,
  },

  addLabel: {
    type: String,
    default: '新增專案',
  },
})

const emit = defineEmits(['export', 'add'])
</script>

<template>
  <!-- 沒有任何 Header 操作時，整個 Header 不顯示 -->
  <header
    v-if="showExport || showAdd"
    class="header"
  >
    <div class="header-title">
      <!-- 目前不顯示頁面標題，避免和頁面內容重複 -->
    </div>

    <div class="header-actions">
      <!-- 匯出 -->
      <button
        v-if="showExport"
        type="button"
        class="btn btn-secondary"
        @click="emit('export')"
      >
        ↓ {{ exportLabel }}
      </button>

      <!-- 新增專案 -->
      <button
        v-if="showAdd"
        type="button"
        class="btn btn-primary"
        @click="emit('add')"
      >
        ＋ {{ addLabel }}
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  min-height: 70px;
  padding: 10px 34px;

  background: #fff;
  border-bottom: 1px solid var(--pm-border);

  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 20px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.btn {
  border: 0;
  border-radius: 8px;

  padding: 10px 16px;

  font-size: 16px;
  line-height: 1.4;
  font-weight: 700;

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--pm-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--pm-primary-dark);
}

.btn-secondary {
  background: var(--pm-soft);
  color: var(--pm-text);
}

.btn-secondary:hover {
  background: var(--pm-accent-soft);
}
</style>