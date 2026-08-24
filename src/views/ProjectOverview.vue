<script setup>
import { computed, ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'
import ProjectStats from '../components/ProjectStats.vue'
import ProjectFilters from '../components/ProjectFilters.vue'
import ProjectTable from '../components/ProjectTable.vue'
import ProjectFormModal from '../components/modals/ProjectFormModal.vue'

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
})

const emit = defineEmits([
  'open',
  'save',
])

const search = ref('')
const statusFilter = ref('全部狀態')
const saFilter = ref('全部 SA')
const customerFilter = ref('全部客戶')

const showModal = ref(false)
const editing = ref(false)
const form = ref({})


// ============================================================
// Supabase 專案資料
// ============================================================

const dbProjects = ref([])

async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('id', { ascending: true })

  if (error) {
    console.error('讀取 projects 失敗:', error)
    return
  }

  dbProjects.value = data || []

  console.log(
    'ProjectOverview 已讀取 Supabase projects:',
    dbProjects.value
  )
}

onMounted(() => {
  loadProjects()
})

const projectList = computed(() =>
  dbProjects.value.length
    ? dbProjects.value
    : props.projects
)


// ============================================================
// 客戶
// ============================================================

const customers = computed(() => [
  ...new Set(
    projectList.value
      .map(p => p.customer)
      .filter(Boolean)
  ),
])


// ============================================================
// 篩選
// ============================================================

const filteredProjects = computed(() =>
  projectList.value.filter(project => {

    const q =
      search.value
        .trim()
        .toLowerCase()

    return (
      (
        !q ||
        String(project.name || '')
          .toLowerCase()
          .includes(q) ||
        String(project.customer || '')
          .toLowerCase()
          .includes(q)
      ) &&

      (
        statusFilter.value === '全部狀態' ||
        project.status === statusFilter.value
      ) &&

      (
        saFilter.value === '全部 SA' ||
        project.sa === saFilter.value
      ) &&

      (
        customerFilter.value === '全部客戶' ||
        project.customer === customerFilter.value
      )
    )
  })
)


// ============================================================
// 找最新週報
// ============================================================

function getLatestReport(project) {

  const list =
    props.reports.filter(
      report =>
        String(report.projectId) ===
        String(project.id)
    )

  if (!list.length) {
    return null
  }

  return [...list].sort((a, b) => {

    const aWeek =
      Number(
        String(a.week || '')
          .replace(/\D/g, '')
      ) || 0

    const bWeek =
      Number(
        String(b.week || '')
          .replace(/\D/g, '')
      ) || 0

    if (aWeek !== bWeek) {
      return bWeek - aWeek
    }

    return (
      Number(b.id || 0) -
      Number(a.id || 0)
    )
  })[0]
}


// ============================================================
// 工作事項
// ============================================================

function getWorks(project, type) {

  const report =
    getLatestReport(project)

  if (!report) {

    const text =
      type === 'last'
        ? project.lastWeek
        : project.thisWeek

    if (!text) {
      return []
    }

    return String(text)
      .split(/\r?\n/)
      .map(x => x.trim())
      .filter(Boolean)
  }


  const works =
    type === 'last'
      ? report.lastWeekWorks
      : report.thisWeekWorks

  if (Array.isArray(works)) {

    return works
      .map(work =>
        String(
          work?.description || ''
        ).trim()
      )
      .filter(Boolean)

  }


  // 舊資料相容

  const text =
    type === 'last'
      ? report.lastWeekActual
      : report.thisWeekPlan

  if (!text) {
    return []
  }

  return String(text)
    .split(/\r?\n/)
    .map(x => x.trim())
    .filter(Boolean)
}


// ============================================================
// 統計
// ============================================================

const stats = computed(() => ({
  total:
    projectList.value.length,

  normal:
    projectList.value.filter(
      p =>
        p.statusType === 'normal'
    ).length,

  paused:
    projectList.value.filter(
      p =>
        p.statusType === 'paused'
    ).length,
}))


// ============================================================
// 新增專案
// ============================================================

function addProject() {

  editing.value = false

  form.value = {
    name: '',
    customer: '',
    sa: '',
    developer: '',
    endDate: '',
    status: '進行中',
    progress: 0,
    lastWeek: '',
    thisWeek: '',
    todo: '',
    notes: '',
  }

  showModal.value = true
}


// ============================================================
// 編輯專案
// ============================================================

function editProject(project) {

  editing.value = true

  form.value = {
    ...project,
  }

  showModal.value = true
}


// ============================================================
// 儲存
// ============================================================

function save() {

  emit('save', {
    form: form.value,
    editing: editing.value,
  })

  showModal.value = false
}


defineExpose({
  addProject,
  editProject,
})
</script>

<template>
  <div class="page">

    <!-- =========================
         頁面標題
    ========================== -->

    <section class="page-intro">
      <div class="intro-text">
        <h1>專案總覽</h1>

        <!-- <p>
          主管快速掌握所有專案狀態；點擊專案可進入詳細頁。
        </p> -->
      </div>

      <div class="intro-actions">

      <button
      type="button"
      class="btn btn-export"
      @click="addProject"
    >
      ＋ 新增專案
    </button>

        <button
          type="button"
          class="btn btn-primary"
          @click="exportProjects"
        >
          匯出專案 Excel
        </button>

      
      </div>
    </section>

    <!-- =========================
         專案統計
    ========================== -->

    <!-- <ProjectStats :stats="stats" /> -->

    <!-- =========================
         篩選
    ========================== -->

    <ProjectFilters
      v-model:search="search"
      v-model:statusFilter="statusFilter"
      v-model:saFilter="saFilter"
      v-model:customerFilter="customerFilter"
      :customers="customers"
    />

    <!-- =========================
         專案控管表
    ========================== -->

<ProjectTable
  :projects="filteredProjects"
  :reports="reports"
  :tasks="tasks"
  @open="emit('open', $event)"
/>

    <!-- =========================
         新增 / 編輯專案
    ========================== -->

    <ProjectFormModal
      :visible="showModal"
      :form="form"
      :editing="editing"
      @close="showModal = false"
      @save="save"
    />

  </div>
</template>

<style scoped>
/* =========================
   頁面
========================= */

.page {
  padding: 30px 34px 40px;
}

/* =========================
   標題區
========================= */

.page-intro {
  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 24px;

  margin-bottom: 28px;
}

.intro-text {
  min-width: 0;
}

.intro-text h1 {
  margin: 0 0 6px;

  color: var(--pm-text);

  font-size: 30px;
  font-weight: 800;
  line-height: 1.25;
}

.intro-text p {
  margin: 0;

  color: var(--pm-muted);

  font-size: 17px;
  line-height: 1.5;
}

.intro-actions {
  display: flex;
  align-items: center;

  gap: 10px;

  flex-shrink: 0;
}

/* =========================
   按鈕
========================= */

.btn {
  border: 0;
  border-radius: 8px;

  padding: 11px 17px;

  font-size: 16px;
  font-weight: 500;
  line-height: 1.4;

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    transform 0.15s ease;
}

.btn:hover {
  transform: translateY(-1px);
}

.btn-primary {
  background: var(--pm-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--pm-primary-dark);
}

.btn-export {
  background: #ffffff;
  color: var(--pm-primary-dark);

  border: 1px solid var(--pm-primary);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

  transition:
    background-color 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.btn-export:hover {
  background: var(--pm-accent-soft);
  border-color: var(--pm-accent);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  transform: translateY(-1px);
}
</style>