<script setup>
const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },

  task: {
    type: Object,
    default: null,
  },

  linkedReports: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits([
  'close',
  'edit',
  'delete',
]);

// ============================================================
// 取得週報中與目前甘特項目有關聯的工作
// 並去除重複資料
// ============================================================

function getLinkedWorks(report) {
  if (!props.task || !report) {
    return [];
  }

  const allWorks = [
    ...(Array.isArray(report.lastWeekWorks) ? report.lastWeekWorks : []),

    ...(Array.isArray(report.thisWeekWorks) ? report.thisWeekWorks : []),

    ...(Array.isArray(report.works) ? report.works : []),
  ];

  const matchedWorks = allWorks.filter((work) => {
    if (!work) {
      return false;
    }

    // 新格式：taskId
    if (
      work.taskId !== undefined &&
      work.taskId !== null &&
      work.taskId !== ''
    ) {
      return String(work.taskId) === String(props.task.id);
    }

    // 舊格式：taskIds
    if (Array.isArray(work.taskIds)) {
      return work.taskIds.some((id) => String(id) === String(props.task.id));
    }

    return false;
  });

  // ==========================================================
  // 去除重複
  // ==========================================================

  const seen = new Set();

  return matchedWorks.filter((work) => {
    const description = String(work.description || '').trim();

    const key = description;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}
</script>

<template>
  <div
    v-if="visible && task"
    class="modal-backdrop"
    @click.self="emit('close')"
  >
    <div class="task-detail">
      <!-- ==================================================
           標題
      ================================================== -->

      <div class="detail-head">
        <div>
          <span> 甘特項目 </span>

          <h3>
            {{ task.name }}
          </h3>
        </div>

        <button type="button" class="close" @click="emit('close')">×</button>
      </div>

      <!-- ==================================================
           基本資訊
      ================================================== -->

      <div class="detail-grid">
        <div>
          <span>開始日期</span>

          <strong>
            {{ task.start }}
          </strong>
        </div>

        <div>
          <span>完成日期</span>

          <strong>
            {{ task.end }}
          </strong>
        </div>

        <div>
          <span>完成率</span>

          <strong> {{ task.progress }}% </strong>
        </div>

        <div>
          <span>狀態</span>

          <strong>
            {{ task.status || '未開始' }}
          </strong>
        </div>
      </div>

      <!-- ==================================================
           工作說明
      ================================================== -->

      <!-- <div class="detail-section">
        <span> 工作說明 </span>

        <p>
          {{ task.description || '目前尚未填寫工作說明。' }}
        </p>
      </div> -->

      <!-- ==================================================
           關聯週報
      ================================================== -->

      <div class="detail-section">
        <span> 關聯週報 </span>

        <div v-if="linkedReports.length" class="linked-reports">
        <div
          v-for="report in linkedReports"
          :key="report.id"
          class="linked-report"
        >
          <div class="linked-report-head">
            <b>
              {{ report.week }}
            </b>
      
            <span>
              {{ report.range }}
            </span>
          </div>
      
          <p
            v-for="work in getLinkedWorks(report)"
            :key="work.id || work.description"
          >
            {{ work.description }}
          </p>
        </div>
      </div>
      
      <p v-else class="muted">
        目前尚無週報工作關聯此甘特項目。
      </p>
      </div>

      <!-- ==================================================
           編輯
      ================================================== -->

      <button type="button" class="primary full" @click="emit('edit', task)">
        編輯此甘特項目
      </button>

      <button
  type="button"
  class="delete-task full"
  @click="emit('delete', task)"
>
  刪除此甘特項目
</button>
    </div>
  </div>
</template>

<style scoped>
/* ============================================================
   Modal 背景
============================================================ */

.modal-backdrop {
  position: fixed;
  inset: 0;

  background: rgba(37, 55, 70, 0.42);

  display: grid;
  place-items: center;

  padding: 20px;

  z-index: 50;
}

/* ============================================================
   Modal
============================================================ */

.task-detail {
  width: min(650px, 100%);

  max-height: 90vh;

  overflow: auto;

  background: #fff;

  border-radius: 16px;

  padding: 26px;

  box-shadow: 0 20px 50px rgba(37, 55, 70, 0.18);
}

/* ============================================================
   標題
============================================================ */

.detail-head {
  display: flex;

  justify-content: space-between;

  align-items: flex-start;
}

.detail-head span,
.detail-section > span {
  color: var(--pm-muted);

  font-size: 16px;
}

.detail-head h3 {
  margin: 6px 0 0;

  color: var(--pm-text);

  font-size: 27px;

  line-height: 1.3;
}

/* ============================================================
   關閉
============================================================ */

.close {
  border: 0;

  background: var(--pm-soft);

  color: var(--pm-text);

  border-radius: 50%;

  width: 38px;
  height: 38px;

  font-size: 24px;

  cursor: pointer;

  flex-shrink: 0;
}

.close:hover {
  background: var(--pm-accent-soft);
}

/* ============================================================
   基本資訊
============================================================ */

.detail-grid {
  display: grid;

  grid-template-columns: repeat(2, 1fr);

  gap: 11px;

  margin: 21px 0;
}

.detail-grid > div {
  background: var(--pm-soft);

  border-radius: 9px;

  padding: 14px;
}

.detail-grid span {
  display: block;

  color: var(--pm-muted);

  font-size: 15px;

  margin-bottom: 6px;
}

.detail-grid strong {
  color: var(--pm-text);

  font-size: 17px;
}

/* ============================================================
   區塊
============================================================ */

.detail-section {
  border-top: 1px solid #edf1f1;

  padding: 18px 0;
}

.detail-section p {
  color: var(--pm-text);

  font-size: 17px;

  line-height: 1.7;

  margin: 8px 0 0;
}

/* ============================================================
   關聯週報
============================================================ */

.linked-reports {
  display: grid;

  gap: 10px;

  margin-top: 10px;
}

.linked-report {
  background: var(--pm-soft);

  border: 1px solid var(--pm-border);

  border-radius: 9px;

  padding: 12px 14px;
}

.linked-report-head {
  display: flex;

  gap: 12px;

  align-items: center;
}

.linked-report b {
  color: var(--pm-primary-dark);

  font-size: 17px;
}

.linked-report-head span {
  color: var(--pm-muted);

  font-size: 15px;
}

.linked-report p {
  margin: 6px 0 0;

  color: var(--pm-text);

  font-size: 16px;

  line-height: 1.5;
}

/* ============================================================
   無關聯
============================================================ */

.muted {
  color: var(--pm-muted);
}

/* ============================================================
   編輯按鈕
============================================================ */

.full {
  width: 100%;
}

.primary {
  border: 0;

  border-radius: 9px;

  padding: 12px 16px;

  background: var(--pm-primary);

  color: #fff;

  font-size: 17px;

  font-weight: 700;

  cursor: pointer;
}

.primary:hover {
  background: var(--pm-primary-dark);
}


.delete-task {
  margin-top: 10px;

  border: 1px solid #e7bcbc;
  border-radius: 9px;

  padding: 12px 16px;

  background: #fff;
  color: #b45e5e;

  font-size: 17px;
  font-weight: 700;

  cursor: pointer;
}

.delete-task:hover {
  background: #fff1f1;
}
/* ============================================================
   RWD
============================================================ */

@media (max-width: 600px) {
  .task-detail {
    padding: 20px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }

  .linked-report-head {
    align-items: flex-start;

    flex-direction: column;

    gap: 3px;
  }
}
</style>
