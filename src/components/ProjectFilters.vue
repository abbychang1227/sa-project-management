
<script setup>
defineProps({ search: String, statusFilter: String, saFilter: String, customerFilter: String, customers: Array })
const emit = defineEmits(['update:search','update:statusFilter','update:saFilter','update:customerFilter'])
</script>

<template>
  <div class="toolbar">
    <label class="search">
      <span>⌕</span>
      <input :value="search" @input="emit('update:search', $event.target.value)" placeholder="搜尋專案名稱或客戶..." />
    </label>

    <select :value="statusFilter" @change="emit('update:statusFilter', $event.target.value)">
      <option>全部狀態</option>
      <option>進行中</option>
      <option>暫緩</option>
    </select>

    <select :value="saFilter" @change="emit('update:saFilter', $event.target.value)">
      <option>全部 SA</option>
      <option>Amy</option>
      <option>John</option>
    </select>

    <select :value="customerFilter" @change="emit('update:customerFilter', $event.target.value)">
      <option>全部客戶</option>
      <option v-for="customer in customers" :key="customer">{{ customer }}</option>
    </select>
  </div>
</template>

<style scoped>
.toolbar{display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap}
.search{width:350px;height:48px;background:#fff;border:1px solid var(--pm-border);border-radius:10px;display:flex;align-items:center;gap:10px;padding:0 14px;color:var(--pm-muted)}
.search span{font-size:22px}.search input{border:0;outline:0;width:100%;font-size:17px;color:var(--pm-text)}
.toolbar select{height:48px;padding:0 14px;border:1px solid var(--pm-border);border-radius:10px;background:#fff;color:var(--pm-text);font-size:17px}
@media(max-width:760px){.search{width:100%}}
</style>
