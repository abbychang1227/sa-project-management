<script setup>
import { computed, ref } from 'vue';
import GanttBoard from '../components/GanttBoard.vue';
import TaskDetailModal from '../components/modals/TaskDetailModal.vue';

const props = defineProps({
  projects: {
    type: Array,
    default: () => [],
  },

  tasks: {
    type: Array,
    default: () => [],
  },

  reports: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['open', 'export']);

// ============================================================
// 專案篩選
// ============================================================

const selectedProjectId = ref('all');

const filteredProjects = computed(() => {
  if (selectedProjectId.value === 'all') {
    return props.projects;
  }

  return props.projects.filter(
    (project) => String(project.id) === String(selectedProjectId.value)
  );
});

// ============================================================
// 甘特項目詳細 Modal
// ============================================================

const selectedTask = ref(null);

// 點擊甘特項目
function openTask(task) {
  if (!task) {
    return;
  }

  selectedTask.value = task;
}

// 關閉甘特項目 Modal
function closeTask() {
  selectedTask.value = null;
}

// ============================================================
// 判斷週報工作是否關聯指定 Task
// ============================================================

function workHasTask(work, taskId) {
  if (!work) {
    return false;
  }

  // 新格式：單一 taskId
  if (work.taskId !== undefined && work.taskId !== null && work.taskId !== '') {
    return String(work.taskId) === String(taskId);
  }

  // 舊格式：taskIds 陣列
  if (Array.isArray(work.taskIds)) {
    return work.taskIds.some((id) => String(id) === String(taskId));
  }

  return false;
}

// ============================================================
// 找目前甘特項目所關聯的週報
// ============================================================

const linkedReports = computed(() => {
  const task = selectedTask.value;

  if (!task) {
    return [];
  }

  return props.reports
    .filter((report) => {
      // 先確認是不是同一個專案
      if (
        report.projectId !== undefined &&
        report.projectId !== null &&
        String(report.projectId) !== String(task.projectId)
      ) {
        return false;
      }

      // 支援目前資料格式
      const works = [
        ...(Array.isArray(report.lastWeekWorks) ? report.lastWeekWorks : []),

        ...(Array.isArray(report.thisWeekWorks) ? report.thisWeekWorks : []),

        ...(Array.isArray(report.works) ? report.works : []),
      ];

      return works.some((work) => workHasTask(work, task.id));
    })
    .sort((a, b) => {
      const aWeek = Number(String(a.week || '').replace(/\D/g, '')) || 0;

      const bWeek = Number(String(b.week || '').replace(/\D/g, '')) || 0;

      return bWeek - aWeek;
    });
});

// ============================================================
// 編輯甘特項目
// ============================================================

function editTask(task) {
  closeTask();

  console.log('編輯甘特項目：', task);
}

// ============================================================
// 匯出甘特
// ============================================================

function exportGantt() {
  emit('export', selectedProjectId.value);
}
</script>

<template>
  <div class="content">
    <!-- ======================================================
         頁面標題
    ======================================================= -->

    <div class="intro">
      <div class="intro-left">
        <h1>總專案甘特圖</h1>
      </div>

      <div class="intro-actions">
        <!-- 專案篩選 -->

        <div class="project-filter">
          <label for="project-filter"> 專案 </label>

          <select id="project-filter" v-model="selectedProjectId">
            <option value="all">全部專案</option>

            <option
              v-for="project in props.projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.name }}
            </option>
          </select>
        </div>

        <!-- 匯出 -->

        <button type="button" class="export" @click="exportGantt">
          匯出甘特圖 Excel
        </button>
      </div>
    </div>

    <!-- ======================================================
         專案甘特
    ======================================================= -->

    <div v-if="filteredProjects.length" class="project-list">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-block"
      >
        <!-- ==================================================
             專案標題
        =================================================== -->

        <div class="project-title">
          <button
            type="button"
            class="project-name"
            @click="emit('open', project)"
          >
            {{ project.name }}
          </button>

          <span class="project-progress"> {{ project.progress }}% </span>
        </div>

        <!-- ==================================================
             甘特
        =================================================== -->

        <GanttBoard
          :tasks="
            props.tasks.filter(
              (task) => String(task.projectId) === String(project.id)
            )
          "
          @select="openTask"
        />
      </div>
    </div>

    <!-- ======================================================
         沒有資料
    ======================================================= -->

    <div v-else class="empty-state">
      <div class="empty-title">尚無甘特資料</div>

      <div class="empty-text">目前選擇的專案沒有可顯示的甘特項目。</div>
    </div>

    <!-- ======================================================
         甘特項目詳細 Modal
    ======================================================= -->

    <TaskDetailModal
      :visible="!!selectedTask"
      :task="selectedTask"
      :linked-reports="linkedReports"
      @close="closeTask"
    />
  </div>
</template>

<style scoped>
/* ============================================================
   Content
============================================================ */

.content {
  padding: 30px 34px 40px;
}

/* ============================================================
   頁面標題
============================================================ */

.intro {
  display: flex;

  align-items: center;
  justify-content: space-between;

  gap: 24px;

  margin-bottom: 24px;
}

.intro-left {
  min-width: 0;
}

.intro h1 {
  margin: 0;

  color: var(--pm-text);

  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
}

/* ============================================================
   右側操作
============================================================ */

.intro-actions {
  display: flex;

  align-items: center;

  gap: 10px;

  flex-shrink: 0;
}

/* ============================================================
   專案篩選
============================================================ */

.project-filter {
  display: flex;

  align-items: center;

  gap: 8px;
}

.project-filter label {
  color: var(--pm-muted);

  font-size: 16px;
  font-weight: 700;

  white-space: nowrap;
}

.project-filter select {
  min-width: 210px;

  height: 42px;

  padding: 0 34px 0 12px;

  border: 1px solid var(--pm-border);

  border-radius: 8px;

  background: var(--pm-card);

  color: var(--pm-text);

  font-size: 16px;
  font-weight: 600;

  cursor: pointer;

  outline: none;
}

.project-filter select:hover {
  border-color: var(--pm-primary);
}

.project-filter select:focus {
  border-color: var(--pm-primary);

  box-shadow: 0 0 0 3px color-mix(in srgb, var(--pm-primary) 12%, transparent);
}

/* ============================================================
   匯出
============================================================ */

.export {
  height: 42px;

  flex-shrink: 0;

  border: 0;

  border-radius: 8px;

  padding: 0 17px;

  background: var(--pm-primary);

  color: #fff;

  font-size: 16px;
  font-weight: 500;

  cursor: pointer;

  transition: background-color 0.15s ease, transform 0.15s ease;
}

.export:hover {
  background: var(--pm-primary-dark);

  transform: translateY(-1px);
}

/* ============================================================
   專案區塊
============================================================ */

.project-block {
  margin-bottom: 24px;
}

/* ============================================================
   專案標題
============================================================ */

.project-title {
  min-height: 64px;

  padding: 15px 20px;

  background: var(--pm-card);

  border: 1px solid var(--pm-border);

  border-bottom: 0;

  border-radius: 14px 14px 0 0;

  display: flex;

  align-items: center;

  justify-content: space-between;

  gap: 20px;
}

.project-name {
  padding: 0;

  border: 0;

  background: transparent;

  color: var(--pm-primary-dark);

  font-size: 19px;
  font-weight: 800;

  text-align: left;

  cursor: pointer;
}

.project-name:hover {
  color: var(--pm-primary);
}

.project-progress {
  flex-shrink: 0;

  color: var(--pm-primary-dark);

  font-size: 18px;
  font-weight: 800;
}

/* ============================================================
   無資料
============================================================ */

.empty-state {
  padding: 60px 20px;

  background: var(--pm-card);

  border: 1px solid var(--pm-border);

  border-radius: 14px;

  text-align: center;
}

.empty-title {
  margin-bottom: 6px;

  color: var(--pm-text);

  font-size: 20px;
  font-weight: 800;
}

.empty-text {
  color: var(--pm-muted);

  font-size: 16px;
}

/* ============================================================
   RWD
============================================================ */

@media (max-width: 900px) {
  .intro {
    align-items: flex-start;

    flex-direction: column;
  }

  .intro-actions {
    width: 100%;
  }

  .project-filter {
    flex: 1;
  }

  .project-filter select {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .content {
    padding: 22px 18px 30px;
  }

  .intro-actions {
    align-items: stretch;

    flex-direction: column;
  }

  .project-filter {
    width: 100%;
  }

  .project-filter select {
    width: 100%;
  }

  .export {
    width: 100%;
  }
}
</style>
