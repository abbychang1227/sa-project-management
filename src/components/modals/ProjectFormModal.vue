<script setup>
import { computed, watch } from 'vue';

const props = defineProps({
  visible: Boolean,

  form: {
    type: Object,
    default: () => ({}),
  },

  editing: Boolean,
});

const emit = defineEmits(['close', 'save']);

// ============================================================
// 上週實際
// ============================================================

const lastWeekItems = computed({
  get() {
    return String(props.form.lastWeek || '')
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  },

  set(items) {
    props.form.lastWeek = items
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join('\n');
  },
});

// ============================================================
// 本週預計
// ============================================================

const thisWeekItems = computed({
  get() {
    return String(props.form.thisWeek || '')
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  },

  set(items) {
    props.form.thisWeek = items
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join('\n');
  },
});

// ============================================================
// 確保至少有 3 個編輯欄位
// ============================================================

function ensureThreeItems() {
  const last = [...lastWeekItems.value];

  const current = [...thisWeekItems.value];

  while (last.length < 3) {
    last.push('');
  }

  while (current.length < 3) {
    current.push('');
  }

  props.form.lastWeek = last.join('\n');

  props.form.thisWeek = current.join('\n');
}

// ============================================================
// 當 Modal 開啟時初始化
// ============================================================

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      ensureThreeItems();
    }
  }
);

// ============================================================
// 取得第 N 項
// ============================================================

function getLastValue(index) {
  return lastWeekItems.value[index] || '';
}

function setLastValue(index, value) {
  const items = [...lastWeekItems.value];

  while (items.length <= index) {
    items.push('');
  }

  items[index] = value;

  lastWeekItems.value = items;
}

function getThisValue(index) {
  return thisWeekItems.value[index] || '';
}

function setThisValue(index, value) {
  const items = [...thisWeekItems.value];

  while (items.length <= index) {
    items.push('');
  }

  items[index] = value;

  thisWeekItems.value = items;
}

// ============================================================
// 儲存
// ============================================================

function save() {
  emit('save');
}

function handleBackdropClick() {
  // 編輯中的資料不因誤觸背景而關閉
}
</script>

<template>
  <div v-if="visible" class="backdrop" @click.self="handleBackdropClick">
    <div class="modal">
      <!-- ====================================================
           Header
      ===================================================== -->

      <div class="head">
        <h3>
          {{ editing ? '編輯專案' : '新增專案' }}
        </h3>

        <button type="button" @click="emit('close')">×</button>
      </div>

      <!-- ====================================================
           專案資料
      ===================================================== -->

      <div class="grid">
        <label>
          專案名稱

          <input v-model="form.name" />
        </label>

        <label>
          客戶／單位

          <input v-model="form.customer" />
        </label>

        <label>
          SA

          <input v-model="form.sa" />
        </label>

        <label>
          開發人員

          <input v-model="form.developer" />
        </label>

        <label>
          預計結案日

          <input v-model="form.endDate" type="date" />
        </label>

        <label>
          狀態

          <select v-model="form.status">
            <option value="提案中">提案中</option>
  <option value="開發中">開發中</option>
  <option value="驗收中">驗收中</option>
  <option value="維運中">維運中</option>

            <option value="暫緩">暫緩</option>
          </select>
        </label>

        <label>
          完成率

          <input
            v-model.number="form.progress"
            type="number"
            min="0"
            max="100"
          />
        </label>

        <!-- ==================================================
             上週實際
        =================================================== -->

        <!-- <section class="work-section">
          <div class="work-title">上週實際</div>

          <div v-for="index in 3" :key="`last-${index}`" class="numbered-input">
            <span> {{ index }}. </span>

            <input
              :value="getLastValue(index - 1)"
              placeholder="請輸入上週實際"
              @input="setLastValue(index - 1, $event.target.value)"
            />
          </div>
        </section> -->

        <!-- ==================================================
             本週預計
        =================================================== -->

        <!-- <section class="work-section full">
          <div class="work-title">本週預計</div>

          <div v-for="index in 3" :key="`this-${index}`" class="numbered-input">
            <span> {{ index }}. </span>

            <input
              :value="getThisValue(index - 1)"
              placeholder="請輸入本週預計"
              @input="setThisValue(index - 1, $event.target.value)"
            />
          </div>
        </section> -->

        <!-- ==================================================
             待辦
        =================================================== -->
<!-- 
        <label>
          待辦事項

          <input v-model="form.todo" />
        </label> -->

        <!-- ==================================================
             備註
        =================================================== -->

        <!-- <label>
          備註

          <input v-model="form.notes" />
        </label> -->
      </div>

      <!-- ====================================================
           Actions
      ===================================================== -->

      <div class="actions">
        <button type="button" class="secondary" @click="emit('close')">
          取消
        </button>

        <button type="button" class="primary" @click="save">儲存</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.backdrop {
  position: fixed;

  inset: 0;

  background: rgba(37, 55, 70, 0.42);

  display: grid;

  place-items: center;

  padding: 20px;

  z-index: 50;
}

.modal {
  width: min(820px, 100%);

  max-height: 90vh;

  overflow: auto;

  background: #fff;

  border-radius: 16px;

  padding: 28px;
}

/* ============================================================
   Header
============================================================ */

.head {
  display: flex;

  justify-content: space-between;

  align-items: center;

  margin-bottom: 22px;
}

.head h3 {
  margin: 0;

  font-size: 26px;

  color: var(--pm-text);
}

.head button {
  border: 0;

  background: var(--pm-soft);

  width: 38px;

  height: 38px;

  border-radius: 50%;

  font-size: 24px;

  cursor: pointer;
}

/* ============================================================
   Grid
============================================================ */

.grid {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 18px;
}

.grid label {
  display: flex;

  flex-direction: column;

  gap: 8px;

  font-size: 17px;

  font-weight: 700;

  color: var(--pm-text);
}

.grid input,
.grid select {
  width: 100%;

  box-sizing: border-box;

  border: 1px solid var(--pm-border);

  border-radius: 9px;

  padding: 12px;

  font-size: 17px;

  color: var(--pm-text);

  background: #fff;
}

/* ============================================================
   工作區
============================================================ */

.work-section {
  display: flex;

  flex-direction: column;

  gap: 10px;

  min-width: 0;
}

.work-section.full {
  grid-column: 1 / -1;
}

.work-title {
  color: var(--pm-text);

  font-size: 17px;

  font-weight: 700;
}

.numbered-input {
  display: grid;

  grid-template-columns: 28px minmax(0, 1fr);

  align-items: center;

  gap: 8px;
}

.numbered-input > span {
  color: var(--pm-primary-dark);

  font-size: 17px;

  font-weight: 800;

  text-align: right;
}

.numbered-input input {
  min-width: 0;
}

/* ============================================================
   Actions
============================================================ */

.actions {
  display: flex;

  justify-content: flex-end;

  gap: 10px;

  margin-top: 24px;
}

.primary,
.secondary {
  border: 0;

  border-radius: 9px;

  padding: 12px 17px;

  font-size: 17px;

  font-weight: 700;

  cursor: pointer;
}

.primary {
  background: var(--pm-primary);

  color: #fff;
}

.secondary {
  background: var(--pm-soft);

  color: var(--pm-text);
}

/* ============================================================
   RWD
============================================================ */

@media (max-width: 700px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .work-section.full {
    grid-column: auto;
  }
}
</style>
