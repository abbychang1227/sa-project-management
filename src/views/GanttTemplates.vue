<script setup>
import { ref } from 'vue';
import TemplateFormModal from '../components/modals/TemplateFormModal.vue';
const props = defineProps({ templates: Array });
const emit = defineEmits(['save', 'delete']);
const show = ref(false),
  editing = ref(false);
const form = ref({});
function open(t = null) {
  editing.value = !!t;
  form.value = t
    ? {
        id: t.id,
        name: t.name,
        description: t.description,
        tasksText: t.tasks.join('\n'),
      }
    : { name: '', description: '', tasksText: '' };
  show.value = true;
}
function save() {
  emit('save', { form: form.value, editing: editing.value });
  show.value = false;
}
defineExpose({ open });
</script>

<template>
  <div class="content">
    <div class="intro">
      <div>
        <h2>甘特模板管理</h2>
        
      </div>
    </div>

    <div class="template-list">
      <div v-for="t in props.templates" :key="t.id" class="template-card">
        <!-- 類型 -->
        <div class="type-column">
          <div class="type-mark">
          {{ t.tasks.length }} 階段
          </div>

          <!-- <span class="stage-count"> {{ t.tasks.length }} 個階段 </span> -->
        </div>

        <div class="card-main">
          <!-- 標題＋右上操作 -->
          <div class="card-title-row">
            <div class="title-info">
              <h3>{{ t.name }}</h3>
            </div>

            <div class="actions">
              <button class="primary-light" @click="open(t)">編輯流程</button>

              <button class="delete" @click="emit('delete', t)">
                刪除模板
              </button>
            </div>
          </div>

          <!-- 說明 -->
          <p class="description">
            {{ t.description }}
          </p>

          <!-- 流程 -->
          <div class="flow">
            <template v-for="(x, i) in t.tasks" :key="x">
              <div class="flow-item">
                <b>{{ i + 1 }}</b>
                <span>{{ x }}</span>
              </div>

              <span v-if="i < t.tasks.length - 1" class="arrow"> → </span>
            </template>
          </div>
        </div>
      </div>
    </div>

    <button class="add-template" @click="open()">＋ 新增自訂模板</button>

    <TemplateFormModal
      :visible="show"
      :form="form"
      :editing="editing"
      @close="show = false"
      @save="save"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   頁面
============================================================ */

.content {
  padding: 30px 34px 40px;
}

.intro {
  margin-bottom: 24px;
}

.intro h2 {
  margin: 0 0 6px;
  color: var(--pm-text);
  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
}

.intro p {
  margin: 0;
  color: var(--pm-muted);
  font-size: 17px;
  line-height: 1.5;
}

/* ============================================================
   模板列表
============================================================ */

.template-list {
  display: grid;
  gap: 18px;
}

/* ============================================================
   模板卡片
============================================================ */
.template-card {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 16px;
  padding: 22px;

  display: flex;
  align-items: flex-start;

  gap: 20px;
}

.type-column {
  width: 92px;
  min-width: 92px;

  display: flex;
  flex-direction: column;
  align-items: center;

  gap: 7px;
}

.stage-count {
  color: var(--pm-muted);

  font-size: 14px;
  font-weight: 600;

  white-space: nowrap;
}

/* ============================================================
   左側類型
============================================================ */

.type-mark {
  width: 82px;
  min-width: 82px;
  height: 82px;

  display: grid;
  place-items: center;

  border-radius: 14px;

  background: var(--pm-accent-soft);
  color: var(--pm-primary-dark);

  text-align: center;

  font-size: 18px;
  font-weight: 800;

  line-height: 1.4;
}

/* ============================================================
   主要內容
============================================================ */

.card-main {
  min-width: 0;
  flex: 1;
}

/* ============================================================
   標題
============================================================ */

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  margin-bottom: 6px;
}

.card-title-row h3 {
  margin: 0;

  color: var(--pm-text);

  font-size: 23px;
  font-weight: 800;

  line-height: 1.35;
}

.card-title-row span {
  flex-shrink: 0;

  color: var(--pm-muted);

  font-size: 15px;
  font-weight: 500;

  white-space: nowrap;
}

.card-main > p {
  margin: 0 0 18px;

  color: var(--pm-muted);

  font-size: 16px;
  line-height: 1.55;
}

/* ============================================================
   流程
============================================================ */

.flow {
  display: flex;
  align-items: center;

  gap: 7px;

  flex-wrap: wrap;

  line-height: 1;
}

/* ============================================================
   流程項目
============================================================ */

.flow-item {
  display: inline-flex;
  align-items: center;

  gap: 8px;

  min-height: 40px;

  padding: 7px 11px;

  background: var(--pm-soft);

  border: 1px solid var(--pm-border);
  border-radius: 8px;

  color: var(--pm-text);

  font-size: 15px;
  font-weight: 500;

  white-space: nowrap;
}

.flow-item b {
  width: 24px;
  height: 24px;

  flex-shrink: 0;

  display: grid;
  place-items: center;

  border-radius: 50%;

  background: var(--pm-primary);
  color: #fff;

  font-size: 13px;
  font-weight: 700;
}

.arrow {
  flex-shrink: 0;

  color: var(--pm-accent);

  font-size: 18px;
  font-weight: 700;
}

/* ============================================================
   操作
============================================================ */

.actions {
  display: flex;
  align-items: center;

  gap: 14px;

  margin-top: 20px;
}

.primary-light,
.delete,
.add-template {
  border: 0;

  cursor: pointer;

  font-size: 16px;
  font-weight: 700;

  line-height: 1.4;
}

.primary-light {
  padding: 10px 16px;

  border-radius: 9px;

  background: var(--pm-primary);
  color: #fff;

  transition: background-color 0.15s ease, transform 0.15s ease;
}

.primary-light:hover {
  background: var(--pm-primary-dark);
  transform: translateY(-1px);
}

.delete {
  padding: 10px 2px;

  background: transparent;

  color: #b45e5e;
}

.delete:hover {
  color: #994848;
}

/* ============================================================
   新增模板
============================================================ */

.add-template {
  margin-top: 20px;

  padding: 12px 18px;

  border-radius: 10px;

  background: var(--pm-primary);
  color: #fff;

  transition: background-color 0.15s ease, transform 0.15s ease;
}

.add-template:hover {
  background: var(--pm-primary-dark);
  transform: translateY(-1px);
}

/* ============================================================
   RWD
============================================================ */

@media (max-width: 900px) {
  .template-card {
    gap: 16px;
  }

  .type-mark {
    width: 72px;
    min-width: 72px;
    height: 72px;

    font-size: 16px;
  }

  .flow-item {
    font-size: 14px;
  }
}

@media (max-width: 650px) {
  .content {
    padding: 22px 18px 30px;
  }

  .template-card {
    flex-direction: column;
  }

  .type-mark {
    width: 100%;
    min-width: 0;
    height: auto;

    padding: 12px;
  }

  .card-title-row {
    align-items: flex-start;
    flex-direction: column;

    gap: 4px;
  }

  .flow {
    align-items: flex-start;
  }

  .arrow {
    display: none;
  }

  .actions {
    flex-wrap: wrap;
  }
}
</style>
