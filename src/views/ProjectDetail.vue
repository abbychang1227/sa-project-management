<script setup>
import { computed, ref } from 'vue';
import GanttBoard from '../components/GanttBoard.vue';
import TaskFormModal from '../components/modals/TaskFormModal.vue';
import WeeklyProgressModal from '../components/modals/WeeklyProgressModal.vue';
import LinkFormModal from '../components/modals/LinkFormModal.vue';
import TaskDetailModal from '../components/modals/TaskDetailModal.vue';
const props = defineProps({
  project: Object,
  tasks: Array,
  reports: Array,
  links: Array,
  templates: Array,
});

const emit = defineEmits([
  'back',
  'edit-project',
  'delete-project',

  'add-task',
  'edit-task',
  'delete-task',

  'add-weekly',
  'edit-weekly',

  'add-link',
  'delete-link',

  'apply-template',
]);

const tab = ref('weekly');

const taskModal = ref(false);
const editingTask = ref(false);
const taskForm = ref({});

const weeklyModal = ref(false);
const weeklyForm = ref({});

const linkModal = ref(false);

const linkForm = ref({
  name: '',
  url: '',
});

const showTemplates = ref(false);
const selectedTask = ref(null);

// ============================================================
// 甘特項目
// ============================================================

const projectTasks = computed(() => {
  if (!props.project) return [];

  return props.tasks.filter(
    (task) => String(task.projectId) === String(props.project.id)
  );
});

// ============================================================
// 週報排序
// ============================================================

const sortedReports = computed(() => {
  return [...props.reports].sort((a, b) => {
    const aWeek = Number(String(a.week || '').replace(/\D/g, '')) || 0;

    const bWeek = Number(String(b.week || '').replace(/\D/g, '')) || 0;

    return bWeek - aWeek;
  });
});

// ============================================================
// 甘特關聯週報
// ============================================================

const linkedReports = computed(() => {
  if (!selectedTask.value) {
    return [];
  }

  return sortedReports.value.filter((report) => {
    const works = [
      ...(Array.isArray(report.lastWeekWorks) ? report.lastWeekWorks : []),

      ...(Array.isArray(report.thisWeekWorks) ? report.thisWeekWorks : []),

      ...(Array.isArray(report.works) ? report.works : []),
    ];

    return works.some((work) => workHasTask(work, selectedTask.value.id));
  });
});

// ============================================================
// 甘特項目 Modal
// ============================================================

function openTask(task = null) {
  editingTask.value = !!task;

  taskForm.value = task
    ? {
        name: task.name,
        start: task.start,
        end: task.end,
        progress: task.progress,
        description: task.description || '',
      }
    : {
        name: '',
        start: '2026-08-17',
        end: '2026-09-30',
        progress: 0,
        description: '',
      };

  taskModal.value = true;
}

function saveTask() {
  emit(editingTask.value ? 'edit-task' : 'add-task', {
    form: taskForm.value,
    task: editingTask.value ? taskForm.value : null,
  });

  taskModal.value = false;
}

// ============================================================
// 日期工具
// ============================================================

function getMonday(date) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function getWeekNumber(date) {
  const d = new Date(date);

  d.setHours(0, 0, 0, 0);

  const day = d.getDay() || 7;

  d.setDate(d.getDate() + 4 - day);

  const yearStart = new Date(d.getFullYear(), 0, 1);

  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

// ============================================================
// 新增週報
// ============================================================

function openWeekly() {
  const monday = getMonday(new Date());

  const friday = new Date(monday);

  friday.setDate(monday.getDate() + 4);

  const weekNumber = getWeekNumber(monday);

  weeklyForm.value = {
    id: null,

    week: `W${weekNumber}`,

    startDate: formatDate(monday),

    endDate: formatDate(friday),

    range: `${formatDate(monday).replace(/-/g, '/')} ～ ${formatDate(
      friday
    ).replace(/-/g, '/')}`,

    lastWeekActual: '',
    thisWeekPlan: '',

    lastWeekWorks: [createWorkItem(), createWorkItem(), createWorkItem()],

    thisWeekWorks: [createWorkItem(), createWorkItem(), createWorkItem()],

    todo: '',
    notes: '',
  };

  weeklyModal.value = true;
}

// ============================================================
// 建立工作事項
// ============================================================

function createWorkItem() {
  return {
    id: Date.now() + Math.random(),

    description: '',

    taskId: '',
  };
}

// ============================================================
// 編輯週報
// ============================================================

function openWeeklyEdit(report) {
  weeklyForm.value = {
    id: report.id,

    week: report.week || '',

    startDate: report.startDate || '',

    endDate: report.endDate || '',

    range: report.range || '',

    lastWeekActual: report.lastWeekActual || '',

    thisWeekPlan: report.thisWeekPlan || '',

    lastWeekWorks: getLastWeekWorks(report),

    thisWeekWorks: getThisWeekWorks(report),

    todo: report.todo || '',

    notes: report.notes || '',
  };

  weeklyModal.value = true;
}

// ============================================================
// 儲存週報
// ============================================================

function saveWeekly(form) {
  if (form?.id) {
    emit('edit-weekly', form);
  } else {
    emit('add-weekly', form);
  }

  weeklyModal.value = false;
}

// ============================================================
// 工作事項：上週實際
// ============================================================

function getLastWeekWorks(report) {
  if (Array.isArray(report.lastWeekWorks)) {
    return report.lastWeekWorks
      .filter((work) => work && String(work.description || '').trim())
      .map((work) => ({
        ...work,

        taskId:
          work.taskId ??
          (Array.isArray(work.taskIds) && work.taskIds.length
            ? String(work.taskIds[0])
            : ''),
      }));
  }

  if (report.lastWeekActual) {
    return [
      {
        id: `${report.id}-last-1`,

        description: report.lastWeekActual,

        taskId: '',
        taskIds: [],
      },
    ];
  }

  return [];
}

// ============================================================
// 工作事項：本週預計
// ============================================================

function getThisWeekWorks(report) {
  if (Array.isArray(report.thisWeekWorks)) {
    return report.thisWeekWorks
      .filter((work) => work && String(work.description || '').trim())
      .map((work) => ({
        ...work,

        taskId:
          work.taskId ??
          (Array.isArray(work.taskIds) && work.taskIds.length
            ? String(work.taskIds[0])
            : ''),
      }));
  }

  if (Array.isArray(report.works)) {
    return report.works
      .filter((work) => work && String(work.description || '').trim())
      .map((work) => ({
        ...work,

        taskId:
          Array.isArray(work.taskIds) && work.taskIds.length
            ? String(work.taskIds[0])
            : '',
      }));
  }

  if (report.thisWeekPlan) {
    return [
      {
        id: `${report.id}-this-1`,

        description: report.thisWeekPlan,

        taskId: '',
        taskIds: [],
      },
    ];
  }

  return [];
}

// ============================================================
// 甘特名稱
// ============================================================

function getTaskName(taskId) {
  if (taskId === null || taskId === undefined || taskId === '') {
    return '';
  }

  const task = projectTasks.value.find(
    (item) => String(item.id) === String(taskId)
  );

  return task?.name || '';
}

// ============================================================
// 雲端連結
// ============================================================

function openLink() {
  linkForm.value = {
    name: '',
    url: '',
  };

  linkModal.value = true;
}

function saveLink() {
  emit('add-link', linkForm.value);

  linkModal.value = false;
}

// ============================================================
// 甘特詳細
// ============================================================

function openTaskDetail(task) {
  selectedTask.value = task;
}

function showTaskDetail(task) {
  selectedTask.value = task;
}

defineExpose({
  showTaskDetail,
});

function taskNames(ids = []) {
  return ids
    .map(
      (id) =>
        projectTasks.value.find((task) => String(task.id) === String(id))?.name
    )
    .filter(Boolean);
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
</script>

<template>
  <div class="content">
    <!-- ======================================================
       返回
  ====================================================== -->

    <button class="back" @click="emit('back')">← 返回專案總覽</button>

    <!-- ======================================================
       專案資訊
  ====================================================== -->

    <div class="head-card">
      <div>
        <div class="eyebrow">
          {{ project.customer }}
        </div>

        <h2>
          {{ project.name }}
        </h2>

        <!-- <div class="meta">
          <span> SA：{{ project.sa }} </span>

          <span> 開發：{{ project.developer }} </span>

          <span> 結案日：{{ project.endDate }} </span>
        </div> -->
      </div>

      <div class="head-actions">
        <!-- <strong>
        {{ project.progress }}%
      </strong> -->

        <button class="secondary" @click="emit('edit-project')">
          編輯專案
        </button>

        <button class="danger" @click="emit('delete-project')">刪除</button>
      </div>
    </div>

    <!-- ======================================================
       Tabs
  ====================================================== -->

    <div class="tabs">
      <div class="tabs-left">
        <button :class="{ active: tab === 'weekly' }" @click="tab = 'weekly'">
          每週進度
        </button>

        <button :class="{ active: tab === 'gantt' }" @click="tab = 'gantt'">
          甘特圖
        </button>

        <button :class="{ active: tab === 'links' }" @click="tab = 'links'">
          雲端資料
        </button>
      </div>

      <button v-if="tab === 'weekly'" class="add-weekly" @click="openWeekly">
        ＋ 新增本週進度
      </button>
    </div>

    <!-- ======================================================
       每週進度
  ====================================================== -->

    <div v-if="tab === 'weekly'" class="weekly-layout">
      <!-- ==================================================
         左側：週報
    ================================================== -->

      <section class="weekly-side">
        <article v-for="r in sortedReports" :key="r.id" class="report-block">
          <!-- 頭部 -->

          <div class="weekly-head">
            <div>
              <span>
                {{ r.range }}
              </span>

              <h3>
                {{ r.week }}
              </h3>
            </div>

            <div class="weekly-head-actions">
              <em> 已填寫 </em>

              <button
                type="button"
                class="edit-weekly-btn"
                @click="openWeeklyEdit(r)"
              >
                編輯
              </button>
            </div>
          </div>

          <!-- ------------------------------
             上週實際
        ------------------------------- -->

          <div class="report-section">
            <div class="report-section-title">上週實際</div>

            <div v-if="getLastWeekWorks(r).length" class="report-works">
              <div
                v-for="(work, index) in getLastWeekWorks(r)"
                :key="work.id || `${r.id}-last-${index}`"
                class="report-work"
              >
                <div class="work-number">{{ index + 1 }}.</div>

                <div class="report-work-content">
                  <div class="report-work-text">
                    {{ work.description }}
                  </div>

                  <span
                    v-if="
                      getTaskName(
                        work.taskId ||
                          (Array.isArray(work.taskIds) && work.taskIds.length
                            ? work.taskIds[0]
                            : '')
                      )
                    "
                    class="gantt-tag"
                  >
                    {{
                      getTaskName(
                        work.taskId ||
                          (Array.isArray(work.taskIds) && work.taskIds.length
                            ? work.taskIds[0]
                            : '')
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>

            <p v-else class="empty-text">尚未填寫</p>
          </div>

          <!-- ------------------------------
             本週預計
        ------------------------------- -->

          <div class="report-section">
            <div class="report-section-title">本週預計</div>

            <div v-if="getThisWeekWorks(r).length" class="report-works">
              <div
                v-for="(work, index) in getThisWeekWorks(r)"
                :key="work.id || `${r.id}-this-${index}`"
                class="report-work"
              >
                <div class="work-number">{{ index + 1 }}.</div>

                <div class="report-work-content">
                  <div class="report-work-text">
                    {{ work.description }}
                  </div>

                  <span
                    v-if="
                      getTaskName(
                        work.taskId ||
                          (Array.isArray(work.taskIds) && work.taskIds.length
                            ? work.taskIds[0]
                            : '')
                      )
                    "
                    class="gantt-tag"
                  >
                    {{
                      getTaskName(
                        work.taskId ||
                          (Array.isArray(work.taskIds) && work.taskIds.length
                            ? work.taskIds[0]
                            : '')
                      )
                    }}
                  </span>
                </div>
              </div>
            </div>

            <p v-else class="empty-text">尚未填寫</p>
          </div>

          <!-- ------------------------------
             待辦
        ------------------------------- -->

          <div class="report-section">
            <div class="report-section-title">待辦</div>

            <p>
              {{ r.todo || '—' }}
            </p>
          </div>

          <!-- ------------------------------
             備註
        ------------------------------- -->

          <div class="report-section">
            <div class="report-section-title">備註</div>

            <p>
              {{ r.notes || '—' }}
            </p>
          </div>
        </article>
      </section>

      <!-- ==================================================
         右側：新增
    ================================================== -->

      <!-- <section class="weekly-main">
        <button class="primary full" @click="openWeekly">
          ＋ 新增本週進度
        </button>
      </section> -->
    </div>

    <!-- ======================================================
       甘特圖
  ====================================================== -->

    <div v-else-if="tab === 'gantt'">
      <div class="sub">
        <div>
          <h3>專案甘特圖</h3>

          <p>專案大方向；點擊甘特項目可查看詳細資料與關聯週報。</p>
        </div>

        <button class="primary" @click="openTask()">＋ 新增甘特項目</button>
      </div>

      <GanttBoard :tasks="projectTasks" @select="openTaskDetail" />
    </div>

    <!-- ======================================================
       雲端資料
  ====================================================== -->

    <div v-else-if="tab === 'links'" class="links-page">
      <div class="sub">
        <div>
          <h3>雲端資料</h3>

          <p>集中管理本專案相關文件與雲端連結。</p>
        </div>

        <button class="primary" @click="openLink">＋ 新增連結</button>
      </div>

      <div v-if="props.links.length" class="links-list">
        <div v-for="link in props.links" :key="link.id" class="link-item">
          <div>
            <strong>
              {{ link.name }}
            </strong>

            <div class="link-url">
              {{ link.url }}
            </div>
          </div>

          <div class="link-actions">
            <a :href="link.url" target="_blank" rel="noreferrer"> 開啟 </a>

            <button class="delete" @click="emit('delete-link', link)">
              刪除
            </button>
          </div>
        </div>
      </div>

      <p v-else class="muted">目前尚無雲端資料。</p>
    </div>

    <!-- ======================================================
       甘特詳細 Modal
  ====================================================== -->

    <!-- <div
      v-if="selectedTask"
      class="modal-backdrop"
      @click.self="selectedTask = null"
    >
      <div class="task-detail">
        <div class="detail-head">
          <div>
            <span> 甘特項目 </span>

            <h3>
              {{ selectedTask.name }}
            </h3>
          </div>

          <button class="close" @click="selectedTask = null">×</button>
        </div>

        <div class="detail-grid">
          <div>
            <span>開始日期</span>
            <strong>
              {{ selectedTask.start }}
            </strong>
          </div>

          <div>
            <span>完成日期</span>
            <strong>
              {{ selectedTask.end }}
            </strong>
          </div>

          <div>
            <span>完成率</span>
            <strong> {{ selectedTask.progress }}% </strong>
          </div>

          <div>
            <span>狀態</span>
            <strong>
              {{ selectedTask.status }}
            </strong>
          </div>
        </div>

        <div class="detail-section">
          <span> 工作說明 </span>

          <p>
            {{ selectedTask.description || '目前尚未填寫工作說明。' }}
          </p>
        </div>

        <div class="detail-section">
          <span> 關聯週報 </span>

          <div v-if="linkedReports.length" class="linked-reports">
            <div v-for="r in linkedReports" :key="r.id" class="linked-report">
              <div>
                <b>
                  {{ r.week }}
                </b>

                <span>
                  {{ r.range }}
                </span>
              </div>

              <p
                v-for="w in [
                  ...(r.lastWeekWorks || []),
                  ...(r.thisWeekWorks || []),
                  ...(r.works || []),
                ].filter((x) => workHasTask(x, selectedTask.id))"
                :key="w.id"
              >
                {{ w.description }}
              </p>
            </div>
          </div>

          <p v-else class="muted">目前尚無週報工作關聯此甘特項目。</p>
        </div>

        <button
          class="primary full"
          @click="
            openTask(selectedTask);
            selectedTask = null;
          "
        >
          編輯此甘特項目
        </button>
      </div>
    </div> -->

    <!-- ======================================================
       Modals
  ====================================================== -->
    <TaskDetailModal
      :visible="!!selectedTask"
      :task="selectedTask"
      :linked-reports="linkedReports"
      @close="selectedTask = null"
      @edit="openTask"
    />

    <TaskFormModal
      :visible="taskModal"
      :form="taskForm"
      :editing="editingTask"
      @close="taskModal = false"
      @save="saveTask"
    />

    <WeeklyProgressModal
      :visible="weeklyModal"
      :form="weeklyForm"
      :tasks="projectTasks"
      @close="weeklyModal = false"
      @save="saveWeekly"
    />

    <LinkFormModal
      :visible="linkModal"
      :form="linkForm"
      @close="linkModal = false"
      @save="saveLink"
    />
  </div>
</template>

<style scoped>
.edit-weekly-btn {
  border: 1px solid var(--pm-border);
  border-radius: 6px;

  padding: 4px 10px;

  background: var(--pm-card);
  color: var(--pm-primary-dark);

  font-size: 14px;
  font-weight: 700;

  cursor: pointer;

  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.edit-weekly-btn:hover {
  background: var(--pm-soft);
  border-color: var(--pm-primary);
}
.content {
  padding: 30px 34px;
}

.back {
  border: 0;
  background: transparent;
  color: var(--pm-muted);
  cursor: pointer;
  margin-bottom: 18px;
  font-size: 17px;
}

.head-card {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 15px;
  padding: 26px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.eyebrow {
  color: var(--pm-muted);
  font-size: 16px;
}

.head-card h2 {
  margin: 6px 0 11px;
  font-size: 31px;
}

.meta {
  display: flex;
  gap: 20px;
  color: var(--pm-muted);
  font-size: 17px;
}

.head-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.head-actions strong {
  font-size: 40px;
}

.secondary,
.danger,
.primary {
  border: 0;
  border-radius: 9px;
  padding: 12px 16px;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}

.secondary {
  background: var(--pm-soft);
  color: var(--pm-text);
}

.danger {
  background: #fbe9e9;
  color: #b45e5e;
}

.primary {
  background: var(--pm-primary);
  color: #fff;
}

.tabs {
  display: flex;
  gap: 5px;
  margin: 20px 0;
  border-bottom: 1px solid var(--pm-border);
}

.tabs button {
  border: 0;
  background: transparent;
  padding: 14px 21px;
  color: var(--pm-muted);
  cursor: pointer;
  font-size: 18px;
}

.tabs button.active {
  color: var(--pm-primary-dark);
  border-bottom: 3px solid var(--pm-primary);
  font-weight: 800;
}

.add-weekly {
  border: 0;
  background: transparent;

  padding: 6px 10px;

  color: var(--pm-primary-dark);

  font-size: 16px;
  font-weight: 800;

  cursor: pointer;

  border-radius: 6px;

  transition: background-color 0.15s ease;
}

.add-weekly:hover {
  background: var(--pm-soft);
}
/* ============================================================
   每週進度
============================================================ */

.weekly-layout {
  display: block;
}

.weekly-side {
  display: grid;
  gap: 15px;
  align-content: start;
}

.weekly-main {
  margin-top: 15px;
}

.report-block {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  padding: 22px;
}

.weekly-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf1f1;
}

.weekly-head h3 {
  margin: 6px 0 0;
  font-size: 23px;
}

.weekly-head > div:first-child span {
  color: var(--pm-muted);
  font-size: 16px;
}

.weekly-head-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.weekly-head-actions em {
  font-style: normal;
  color: var(--pm-accent);
  font-size: 16px;
  font-weight: 700;
}

.edit-report {
  border: 1px solid var(--pm-border);
  border-radius: 7px;
  padding: 7px 12px;
  background: var(--pm-soft);
  color: var(--pm-primary-dark);
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.edit-report:hover {
  background: var(--pm-accent-soft);
}

.report-section {
  padding: 16px 0;
  border-bottom: 1px solid #edf1f1;
}

.report-section:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.report-section-title {
  margin-bottom: 9px;
  color: var(--pm-muted);
  font-size: 16px;
}

.report-section > p {
  margin: 0;
  color: var(--pm-text);
  font-size: 17px;
  line-height: 1.7;
  white-space: pre-line;
}

.report-works {
  display: grid;
  gap: 9px;
}

.report-work {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.work-number {
  flex-shrink: 0;
  width: 22px;
  margin-top: 1px;
  color: var(--pm-primary);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.55;
}

.report-work-content {
  min-width: 0;
}

.report-work-text {
  color: var(--pm-text);
  font-size: 17px;
  line-height: 1.55;
}

.gantt-tag {
  display: inline-block;
  margin-top: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--pm-accent-soft);
  color: var(--pm-primary-dark);
  font-size: 13px;
  line-height: 1.4;
}

.legacy-text {
  margin: 0;
  color: var(--pm-text);
  font-size: 17px;
  line-height: 1.7;
  white-space: pre-line;
}

.empty-text {
  margin: 0;
  color: var(--pm-muted);
  font-size: 16px;
}

.full {
  width: 100%;
}

/* ============================================================
   甘特圖
============================================================ */

.sub {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.sub h3 {
  margin: 0 0 5px;
  font-size: 24px;
}

.sub p {
  margin: 0;
  color: var(--pm-muted);
  font-size: 17px;
}

.sub button + button {
  margin-left: 9px;
}

.template-box {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  margin-top: 14px;
  padding: 18px;
}

.template-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-top: 1px solid #edf1f1;
  gap: 15px;
}

.template-row p {
  margin: 5px 0 0;
  color: var(--pm-muted);
  font-size: 16px;
}

.template-row button {
  border: 0;
  background: var(--pm-soft);
  border-radius: 7px;
  padding: 9px 12px;
  cursor: pointer;
  font-size: 16px;
}

/* ============================================================
   雲端資料
============================================================ */

.links-card {
  background: #fff;
  border: 1px solid var(--pm-border);
  border-radius: 14px;
  padding: 22px;
}

.links-head {
  display: flex;
  justify-content: space-between;
}

.links-head h3 {
  margin: 0 0 6px;
  font-size: 24px;
}

.links-head p {
  margin: 0;
  color: var(--pm-muted);
  font-size: 17px;
}

.link {
  display: flex;
  align-items: center;
  gap: 13px;
  border-top: 1px solid #edf1f1;
  padding: 18px 0;
}

.link-icon {
  width: 40px;
  height: 40px;
  background: var(--pm-accent-soft);
  border-radius: 9px;
  display: grid;
  place-items: center;
}

.link-info {
  flex: 1;
}

.link-info strong,
.link-info span {
  display: block;
  font-size: 17px;
}

.link-info span {
  color: var(--pm-muted);
  font-size: 15px;
  margin-top: 4px;
}

.link a,
.link button {
  border: 0;
  background: transparent;
  cursor: pointer;
  font-weight: 700;
  font-size: 17px;
  color: var(--pm-primary);
}

.link .delete {
  color: #b45e5e;
}

.empty {
  text-align: center;
  color: var(--pm-muted);
  padding: 35px;
}

/* ============================================================
   甘特詳細
============================================================ */

.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(37, 55, 70, 0.42);
  display: grid;
  place-items: center;
  padding: 20px;
  z-index: 20;
}

.task-detail {
  width: min(650px, 100%);
  max-height: 90vh;
  overflow: auto;
  background: #fff;
  border-radius: 16px;
  padding: 26px;
  box-shadow: 0 20px 50px rgba(37, 55, 70, 0.18);
}

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
  font-size: 27px;
}

.close {
  border: 0;
  background: var(--pm-soft);
  border-radius: 50%;
  width: 38px;
  height: 38px;
  font-size: 24px;
  cursor: pointer;
}

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
  font-size: 17px;
}

.detail-section {
  border-top: 1px solid #edf1f1;
  padding: 18px 0;
}

.detail-section p {
  font-size: 17px;
  line-height: 1.7;
  margin: 8px 0 0;
}

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

.linked-report > div {
  display: flex;
  gap: 12px;
  align-items: center;
}

.linked-report b {
  color: var(--pm-primary-dark);
  font-size: 17px;
}

.linked-report span {
  color: var(--pm-muted);
  font-size: 15px;
}

.linked-report p {
  margin: 5px 0 0;
  font-size: 16px;
}

.muted {
  color: var(--pm-muted);
}

/* ============================================================
   RWD
============================================================ */

@media (max-width: 1000px) {
  .head-card {
    align-items: flex-start;
    gap: 20px;
  }

  .head-actions {
    flex-wrap: wrap;
  }
}

@media (max-width: 760px) {
  .content {
    padding: 20px 16px;
  }

  .head-card {
    flex-direction: column;
  }

  .work {
    flex-direction: column;
  }

  .work-tags {
    justify-content: flex-start;
  }

  .weekly-head {
    gap: 12px;
  }

  .weekly-head-actions {
    flex-direction: column;
    align-items: flex-end;
  }
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
