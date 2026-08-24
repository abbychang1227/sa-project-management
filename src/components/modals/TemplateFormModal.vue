
<script setup>
defineProps({ visible: Boolean, form: Object, editing: Boolean })
const emit = defineEmits(['close','save'])
</script>
<template>
  <div v-if="visible" class="backdrop" @click.self="emit('close')"><div class="modal">
    <div class="head"><h3>{{editing?'編輯模板':'新增甘特模板'}}</h3><button @click="emit('close')">×</button></div>
    <label>模板名稱<input v-model="form.name"></label>
    <label>說明<input v-model="form.description"></label>
    <label>工作流程（每行一個，順序即甘特順序）<textarea rows="12" v-model="form.tasksText"></textarea></label>
    <div class="actions"><button class="secondary" @click="emit('close')">取消</button><button class="primary" @click="emit('save')">儲存</button></div>
  </div></div>
</template>
<style scoped>
/* ============================================================
   背景
============================================================ */

.backdrop {
  position: fixed;
  inset: 0;

  z-index: 50;

  display: grid;
  place-items: center;

  padding: 24px;

  background: rgba(37, 55, 70, 0.42);
}


/* ============================================================
   Modal
============================================================ */

.modal {
  width: min(680px, 100%);

  max-height: 90vh;

  overflow: auto;

  padding: 28px 30px 24px;

  background: #fff;

  border-radius: 16px;

  box-shadow:
    0 20px 50px rgba(37, 55, 70, 0.18);
}


/* ============================================================
   標題
============================================================ */

.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;

  gap: 20px;

  margin-bottom: 24px;
}

.head h3 {
  margin: 0;

  color: var(--pm-text);

  font-size: 27px;
  font-weight: 800;

  line-height: 1.3;
}

.head button {
  width: 38px;
  height: 38px;

  flex-shrink: 0;

  border: 0;
  border-radius: 50%;

  background: var(--pm-soft);
  color: var(--pm-text);

  font-size: 24px;
  line-height: 1;

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}

.head button:hover {
  background: var(--pm-accent-soft);
  transform: scale(1.03);
}


/* ============================================================
   表單
============================================================ */

label {
  display: flex;
  flex-direction: column;

  gap: 8px;

  margin-bottom: 20px;

  color: var(--pm-text);

  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

input,
textarea {
  width: 100%;

  box-sizing: border-box;

  border: 1px solid var(--pm-border);
  border-radius: 9px;

  background: #fff;
  color: var(--pm-text);

  padding: 11px 13px;

  font-family: inherit;
  font-size: 16px;
  line-height: 1.5;

  outline: none;

  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

input {
  height: 44px;
}

textarea {
  min-height: 190px;

  resize: vertical;
}

input:focus,
textarea:focus {
  border-color: var(--pm-primary);

  box-shadow:
    0 0 0 3px
    color-mix(
      in srgb,
      var(--pm-primary) 10%,
      transparent
    );
}


/* ============================================================
   操作按鈕
============================================================ */

.actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;

  gap: 10px;

  margin-top: 24px;

  padding-top: 18px;

  border-top: 1px solid #edf1f1;
}

.primary,
.secondary {
  min-width: 72px;

  border: 0;
  border-radius: 9px;

  padding: 11px 17px;

  font-size: 16px;
  font-weight: 700;

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}

.primary {
  background: var(--pm-primary);
  color: #fff;
}

.primary:hover {
  background: var(--pm-primary-dark);
  transform: translateY(-1px);
}

.secondary {
  background: var(--pm-soft);
  color: var(--pm-text);
}

.secondary:hover {
  background: var(--pm-accent-soft);
}


/* ============================================================
   RWD
============================================================ */

@media (max-width: 600px) {
  .backdrop {
    padding: 16px;
  }

  .modal {
    padding: 22px 20px 20px;
    border-radius: 14px;
  }

  .head h3 {
    font-size: 24px;
  }

  textarea {
    min-height: 160px;
  }

  .actions {
    margin-top: 18px;
  }
}
</style>
