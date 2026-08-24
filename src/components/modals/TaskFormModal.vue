
<script setup>
defineProps({ visible:Boolean, form:Object, editing:Boolean })
const emit=defineEmits(['close','save'])
</script>
<template>
  <div v-if="visible" class="backdrop" @click.self="emit('close')"><div class="modal">
    <div class="head"><h3>{{ editing ? '編輯甘特工作' : '新增甘特工作' }}</h3><button @click="emit('close')">×</button></div>
    <div class="one">
      <label>工作名稱<input v-model="form.name"></label>
      <label>開始日期<input v-model="form.start" type="date"></label>
      <label>結束日期<input v-model="form.end" type="date"></label>
      <label>完成率<input v-model.number="form.progress" type="number" min="0" max="100"></label>
      <!-- <label>工作說明<textarea v-model="form.description"></textarea></label> -->
    </div>
    <div class="actions"><button class="secondary" @click="emit('close')">取消</button><button class="primary" @click="emit('save')">儲存</button></div>
  </div></div>
</template>
<style scoped>
.backdrop{position:fixed;inset:0;background:rgba(37,55,70,.42);display:grid;place-items:center;padding:20px;z-index:50}.modal{width:min(560px,100%);background:#fff;border-radius:16px;padding:28px}.head{display:flex;justify-content:space-between;margin-bottom:22px}.head h3{margin:0;font-size:26px}.head button{border:0;background:var(--pm-soft);width:38px;height:38px;border-radius:50%;font-size:24px}.one{display:grid;gap:17px}.one label{display:flex;flex-direction:column;gap:8px;font-size:17px;font-weight:700}.one input,.one textarea{border:1px solid var(--pm-border);border-radius:9px;padding:12px;font-size:17px}.one textarea{min-height:100px;resize:vertical}.actions{display:flex;justify-content:flex-end;gap:10px;margin-top:24px}.primary,.secondary{border:0;border-radius:9px;padding:12px 17px;font-size:17px;font-weight:700;cursor:pointer}.primary{background:var(--pm-primary);color:#fff}.secondary{background:var(--pm-soft);color:var(--pm-text)}
</style>
