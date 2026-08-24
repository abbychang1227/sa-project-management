
<script setup>
defineProps({ visible:Boolean, form:Object })
const emit=defineEmits(['close','save'])
</script>
<template>
  <div v-if="visible" class="backdrop" @click.self="emit('close')"><div class="modal">
    <div class="head"><h3>新增雲端連結</h3><button @click="emit('close')">×</button></div>
    <label>連結名稱<input v-model="form.name" placeholder="例如：UI 動態示意畫面"></label>
    <label>網址<input v-model="form.url" placeholder="https://..."></label>
    <div class="actions"><button class="secondary" @click="emit('close')">取消</button><button class="primary" @click="emit('save')">儲存</button></div>
  </div></div>
</template>
<style scoped>
.backdrop{position:fixed;inset:0;background:rgba(37,55,70,.42);display:grid;place-items:center;padding:20px;z-index:50}.modal{width:min(560px,100%);background:#fff;border-radius:16px;padding:28px}.head{display:flex;justify-content:space-between;margin-bottom:22px}.head h3{margin:0;font-size:26px}.head button{border:0;background:var(--pm-soft);width:38px;height:38px;border-radius:50%;font-size:24px}label{display:flex;flex-direction:column;gap:8px;font-size:17px;font-weight:700;margin-bottom:18px}input{border:1px solid var(--pm-border);border-radius:9px;padding:12px;font-size:17px}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.primary,.secondary{border:0;border-radius:9px;padding:12px 17px;font-size:17px;font-weight:700;cursor:pointer}.primary{background:var(--pm-primary);color:#fff}.secondary{background:var(--pm-soft);color:var(--pm-text)}
</style>
