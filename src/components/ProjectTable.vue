<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  projects: {
    type: Array,
    default: () => [],
  },

  reports: {
    type: Array,
    default: () => [],
  },

  tasks: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['open']);

// ============================================================
// 找專案最新週報
// ============================================================

function getLatestReport(project) {
  const projectReports = props.reports.filter(
    (report) => String(report.projectId) === String(project.id)
  );

  if (!projectReports.length) {
    return null;
  }

  return [...projectReports].sort((a, b) => {
    const aWeek = Number(String(a.week || '').replace(/\D/g, '')) || 0;

    const bWeek = Number(String(b.week || '').replace(/\D/g, '')) || 0;

    if (aWeek !== bWeek) {
      return bWeek - aWeek;
    }

    return Number(b.id || 0) - Number(a.id || 0);
  })[0];
}

// ============================================================
// 找甘特名稱
// ============================================================

function getTaskName(taskId) {
  const task = props.tasks.find((item) => String(item.id) === String(taskId));

  return task?.name || '';
}

// ============================================================
// 取得工作事項
// ============================================================

function getWorks(project, type) {
  const report = getLatestReport(project);

  // ----------------------------------------------------------
  // 沒有週報 → 使用舊專案欄位
  // ----------------------------------------------------------

  if (!report) {
    const text = type === 'last' ? project.lastWeek : project.thisWeek;

    if (!text) {
      return [];
    }

    return String(text)
      .split(/\r?\n/)
      .map((text) => ({
        description: text.trim(),
        taskIds: [],
      }))
      .filter((work) => work.description);
  }

  // ----------------------------------------------------------
  // 新版資料
  // ----------------------------------------------------------

  const works = type === 'last' ? report.lastWeekWorks : report.thisWeekWorks;

  if (Array.isArray(works)) {
    return works
      .filter((work) => work && String(work.description || '').trim())
      .map((work) => ({
        ...work,

        description: String(work.description || '').trim(),

        taskIds: Array.isArray(work.taskIds)
          ? work.taskIds
          : work.taskId
          ? [work.taskId]
          : [],
      }));
  }

  // ----------------------------------------------------------
  // 舊版 weeklyReports 相容
  // ----------------------------------------------------------

  if (type === 'this' && Array.isArray(report.works)) {
    return report.works
      .filter((work) => work && String(work.description || '').trim())
      .map((work) => ({
        ...work,

        description: String(work.description || '').trim(),

        taskIds: Array.isArray(work.taskIds) ? work.taskIds : [],
      }));
  }

  // ----------------------------------------------------------
  // 舊文字欄位
  // ----------------------------------------------------------

  const text = type === 'last' ? report.lastWeekActual : report.thisWeekPlan;

  if (!text) {
    return [];
  }

  return String(text)
    .split(/\r?\n/)
    .map((text) => ({
      description: text.trim(),
      taskIds: [],
    }))
    .filter((work) => work.description);
}

// ============================================================
// 取得甘特標籤
// ============================================================

function getTaskNames(work) {
  const ids = Array.isArray(work.taskIds) ? work.taskIds : [];

  return ids.map((id) => getTaskName(id)).filter(Boolean);
}

// ============================================================
// 是否有甘特
// ============================================================

function hasGantt(work) {
  return getTaskNames(work).length > 0;
}

// ============================================================
// 總覽：查看甘特關聯週報
// ============================================================

const selectedGanttTask = ref(null);

function openTaskRelations(taskId) {
  const task = props.tasks.find((item) => String(item.id) === String(taskId));

  if (!task) {
    return;
  }

  selectedGanttTask.value = task;
}

function closeTaskRelations() {
  selectedGanttTask.value = null;
}

function workHasTask(work, taskId) {
  if (!work) {
    return false;
  }

  if (work.taskId !== undefined && work.taskId !== null && work.taskId !== '') {
    if (String(work.taskId) === String(taskId)) {
      return true;
    }
  }

  if (Array.isArray(work.taskIds)) {
    return work.taskIds.some((id) => String(id) === String(taskId));
  }

  return false;
}

function getLinkedReports(taskId) {
  return props.reports
    .filter((report) => {
      const works = [
        ...(Array.isArray(report.lastWeekWorks) ? report.lastWeekWorks : []),

        ...(Array.isArray(report.thisWeekWorks) ? report.thisWeekWorks : []),

        ...(Array.isArray(report.works) ? report.works : []),
      ];

      return works.some((work) => workHasTask(work, taskId));
    })
    .sort((a, b) => {
      const aWeek = Number(String(a.week || '').replace(/\D/g, '')) || 0;

      const bWeek = Number(String(b.week || '').replace(/\D/g, '')) || 0;

      return bWeek - aWeek;
    });
}

function getReportWorks(report, taskId) {
  const allWorks = [
    ...(Array.isArray(report.lastWeekWorks) ? report.lastWeekWorks : []),

    ...(Array.isArray(report.thisWeekWorks) ? report.thisWeekWorks : []),

    ...(Array.isArray(report.works) ? report.works : []),
  ].filter((work) => workHasTask(work, taskId));

  // 去除重複工作
  const seen = new Set();

  return allWorks.filter((work) => {
    const description = String(work?.description || '').trim();

    if (!description) {
      return false;
    }

    if (seen.has(description)) {
      return false;
    }

    seen.add(description);

    return true;
  });
}
</script>

<template>
  <div class="table-card">
    <table class="project-table">
      <thead>
        <tr>
          <th>專案</th>

          <th>客戶／單位</th>

          <th>SA</th>

          <th>開發</th>

          <th>狀態</th>

          <th>上週實際</th>

          <th>本週預計</th>

          <th>待辦</th>

          <th>備註</th>
        </tr>
      </thead>

      <tbody>
        <tr v-for="project in props.projects" :key="project.id">
          <!-- ==================================================
             專案
        ================================================== -->

          <td>
            <button
              type="button"
              class="project-name project-link"
              @click.stop="emit('open', project)"
            >
              {{ project.name }}
            </button>
          </td>
          <!-- ==================================================
             客戶
        ================================================== -->

          <td>
            {{ project.customer || '—' }}
          </td>

          <!-- ==================================================
             SA
        ================================================== -->

          <td>
            <div v-if="project.sa" class="person">
              <div class="avatar">
                {{ project.sa[0] }}
              </div>

              <span>
                {{ project.sa }}
              </span>
            </div>

            <span v-else> — </span>
          </td>

          <!-- ==================================================
             開發
        ================================================== -->

          <td>
            {{ project.developer || '—' }}
          </td>

          <!-- ==================================================
             狀態
        ================================================== -->

          <td>
            <div
              class="status"
              :class="
                project.statusType ||
                (project.status === '暫緩' ? 'paused' : 'normal')
              "
            >
              <span class="status-dot"></span>

              <span>
                {{ project.status || '—' }}
              </span>
            </div>
          </td>

          <!-- ==================================================
             上週實際
        ================================================== -->

          <td class="text-cell">
            <div v-if="getWorks(project, 'last').length" class="work-list">
              <div
                v-for="(work, index) in getWorks(project, 'last')"
                :key="`${project.id}-last-${index}`"
                class="work-line"
              >
                <div class="work-content">
                  <div class="work-description">
                    <span class="work-number"> {{ index + 1 }}. </span>

                    <span>
                      {{ work.description }}
                    </span>
                  </div>

                  <!-- 甘特標籤 -->

                  <div v-if="hasGantt(work)" class="gantt-tags">
                    <button
                      v-for="taskId in work.taskIds"
                      :key="taskId"
                      type="button"
                      class="gantt-tag"
                      @click.stop="openTaskRelations(taskId)"
                    >
                      {{ getTaskName(taskId) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <span v-else class="empty-work"> — </span>
          </td>

          <!-- ==================================================
             本週預計
        ================================================== -->

          <td class="text-cell">
            <div v-if="getWorks(project, 'this').length" class="work-list">
              <div
                v-for="(work, index) in getWorks(project, 'this')"
                :key="`${project.id}-this-${index}`"
                class="work-line"
              >
                <div class="work-content">
                  <div class="work-description">
                    <span class="work-number"> {{ index + 1 }}. </span>

                    <span>
                      {{ work.description }}
                    </span>
                  </div>

                  <!-- 甘特標籤 -->

                  <div v-if="hasGantt(work)" class="gantt-tags">
                    <button
                      v-for="taskId in work.taskIds"
                      :key="taskId"
                      type="button"
                      class="gantt-tag"
                      @click.stop="openTaskRelations(taskId)"
                    >
                      {{ getTaskName(taskId) }}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <span v-else class="empty-work"> — </span>
          </td>

          <!-- ==================================================
             待辦
        ================================================== -->

          <td class="text-cell">
            {{ project.todo || '—' }}
          </td>

          <!-- ==================================================
             備註
        ================================================== -->

          <td class="text-cell">
            {{ project.notes || '—' }}
          </td>
        </tr>

        <!-- ====================================================
           沒有資料
      ===================================================== -->

        <tr v-if="!props.projects.length">
          <td colspan="9" class="empty-row">目前沒有符合條件的專案。</td>
        </tr>
      </tbody>
    </table>

    <!-- ============================================================
     甘特關聯週報
============================================================ -->

    <div
      v-if="selectedGanttTask"
      class="modal-backdrop"
      @click.self="closeTaskRelations"
    >
      <div class="gantt-relation-modal">
        <div class="gantt-relation-head">
          <div>
            <span>甘特項目</span>

            <h3>
              {{ selectedGanttTask.name }}
            </h3>
          </div>

          <button
            type="button"
            class="gantt-relation-close"
            @click="closeTaskRelations"
          >
            ×
          </button>
        </div>

        <div class="gantt-relation-body">
          <div class="relation-title">關聯週報</div>

          <div
            v-if="getLinkedReports(selectedGanttTask.id).length"
            class="relation-list"
          >
            <div
              v-for="report in getLinkedReports(selectedGanttTask.id)"
              :key="report.id"
              class="relation-item"
            >
              <div class="relation-week">
                <strong>
                  {{ report.week }}
                </strong>

                <span>
                  {{ report.range }}
                </span>
              </div>

              <div
                v-for="work in getReportWorks(report, selectedGanttTask.id)"
                :key="work.id"
                class="relation-work"
              >
                {{ work.description }}
              </div>
            </div>
          </div>

          <div v-else class="relation-empty">
            目前尚無週報工作關聯此甘特項目。
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.table-card {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  overflow: hidden;
}
.table-header {
  padding: 22px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--pm-border);
}
.table-header h2 {
  font-size: 22px;
  margin: 0 0 5px;
}
.table-header p {
  font-size: 16px;
  color: var(--pm-muted);
  margin: 0;
}
.count {
  font-size: 16px;
  color: var(--pm-primary-dark);
  background: var(--pm-accent-soft);
  padding: 8px 13px;
  border-radius: 20px;
}
.table-wrapper {
  overflow-x: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1500px;
}
th {
  background: var(--pm-soft);
  color: var(--pm-muted);
  font-size: 16px;
  font-weight: 700;
  text-align: left;
  padding: 14px 15px;
  white-space: nowrap;
  border-bottom: 1px solid var(--pm-border);
}
td {
  padding: 17px 15px;
  border-bottom: 1px solid #edf1f1;
  font-size: 16px;
  vertical-align: top;
}
.project-row {
  cursor: pointer;
}
.project-row:hover {
  background: #f7faf9;
}
.project-name {
  font-weight: 700;
  color: var(--pm-primary-dark);
  min-width: 230px;
}
.person {
  display: flex;
  align-items: center;
  gap: 8px;
}
.avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #dde9e6;
  display: grid;
  place-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--pm-primary-dark);
}
.status {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  white-space: nowrap;
}
.status-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
}
.status.normal {
  color: #4d866a;
}
.status.normal .status-dot {
  background: var(--pm-success);
}
.status.paused {
  color: #6e7b80;
}
.status.paused .status-dot {
  background: var(--pm-paused);
}
.progress-wrapper {
  min-width: 95px;
}
.progress-text {
  font-weight: 700;
  margin-bottom: 6px;
}
.progress {
  height: 7px;
  background: #dfe8e7;
  border-radius: 6px;
  overflow: hidden;
}
.progress-bar {
  height: 100%;
  background: var(--pm-accent);
  border-radius: 6px;
}
.text-cell {
  color: #455963;
  line-height: 1.55;
  min-width: 175px;
}

.work-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.work-line {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  line-height: 1.55;
}

.work-number {
  flex-shrink: 0;
  color: var(--pm-primary-dark);
  font-weight: 700;
}

.empty-work {
  color: var(--pm-muted);
}

.work-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.work-line {
  display: flex;
  align-items: flex-start;
}

.work-content {
  min-width: 0;
}

.work-description {
  display: flex;
  align-items: flex-start;
  gap: 5px;
  line-height: 1.5;
}

.work-number {
  flex-shrink: 0;
  font-weight: 700;
  color: var(--pm-primary-dark);
}

.gantt-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 4px;
  margin-left: 18px;
}

.gantt-tag {
  display: inline-flex;
  align-items: center;

  padding: 3px 7px;

  border-radius: 5px;

  background: var(--pm-accent-soft);
  color: var(--pm-primary-dark);

  font-size: 12px;
  line-height: 1.3;
  white-space: nowrap;
}

.gantt-tag {
  border: 0;
  cursor: pointer;
  font-family: inherit;
}

.gantt-tag:hover {
  background: var(--pm-accent);
  color: #fff;
}

.empty-work {
  color: var(--pm-muted);
}

.empty-row {
  padding: 30px;
  text-align: center;
  color: var(--pm-muted);
}

.project-link {
  display: block;
  width: 100%;

  padding: 0;
  margin: 0;

  border: 0;
  background: transparent;

  text-align: left;

  font: inherit;
  font-weight: 700;

  color: var(--pm-primary-dark);

  cursor: pointer;
}

.project-link:hover {
  text-decoration: underline;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(37, 55, 70, 0.42);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 50;
}

.gantt-relation-modal {
  width: min(620px, 100%);
  max-height: 85vh;
  overflow: auto;

  background: #fff;
  border-radius: 16px;
  padding: 26px;

  box-shadow: 0 20px 50px rgba(37, 55, 70, 0.18);
}

.gantt-relation-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  padding-bottom: 18px;
  border-bottom: 1px solid var(--pm-border);
}

.gantt-relation-head span {
  color: var(--pm-muted);
  font-size: 14px;
}

.gantt-relation-head h3 {
  margin: 5px 0 0;
  font-size: 24px;
}

.gantt-relation-close {
  width: 36px;
  height: 36px;

  border: 1px solid var(--pm-border);
  border-radius: 8px;

  background: #fff;
  color: var(--pm-muted);

  font-size: 20px;
  cursor: pointer;
}

.gantt-relation-body {
  padding-top: 20px;
}

.relation-title {
  margin-bottom: 12px;
  color: var(--pm-text);
  font-size: 17px;
  font-weight: 700;
}

.relation-list {
  display: grid;
  gap: 12px;
}

.relation-item {
  padding: 15px;

  background: var(--pm-soft);
  border: 1px solid var(--pm-border);
  border-radius: 10px;
}

.relation-week {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.relation-week strong {
  color: var(--pm-primary-dark);
  font-size: 17px;
}

.relation-week span {
  color: var(--pm-muted);
  font-size: 14px;
}

.relation-work {
  padding: 5px 0 0;
  color: var(--pm-text);
  font-size: 16px;
  line-height: 1.5;
}

.relation-empty {
  padding: 25px;
  text-align: center;
  color: var(--pm-muted);
}

/* ============================================================
   雲端資料新版版型
============================================================ */

.links-page {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  padding: 24px;
}

.links-page .sub {
  margin-bottom: 18px;
  padding-bottom: 18px;
  border-bottom: 1px solid #edf1f1;
}

.links-list {
  display: grid;
  gap: 0;
}

.link-item {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  padding: 18px 0;

  border-bottom: 1px solid #edf1f1;
}

.link-item:last-child {
  border-bottom: 0;
}

.link-item strong {
  display: block;

  color: var(--pm-text);

  font-size: 17px;
  font-weight: 700;
}

.link-url {
  margin-top: 5px;

  color: var(--pm-muted);

  font-size: 14px;

  word-break: break-all;
}

.link-actions {
  display: flex;
  align-items: center;
  gap: 8px;

  flex-shrink: 0;
}

.link-actions a,
.link-actions button {
  border: 1px solid var(--pm-border);
  border-radius: 7px;

  padding: 7px 11px;

  background: #fff;

  color: var(--pm-primary);

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;
  text-decoration: none;
}

.link-actions a:hover {
  background: var(--pm-soft);
}

.link-actions button.delete {
  color: #b45e5e;
}

.link-actions button.delete:hover {
  background: #fff1f1;
}
</style>
