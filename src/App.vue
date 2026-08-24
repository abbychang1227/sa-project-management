<script setup>


import { ref, computed, onMounted } from 'vue';
import { supabase } from './lib/supabase';
import * as XLSX from 'xlsx-js-style';

import AppSidebar from './components/AppSidebar.vue';
//import AppHeader from './components/AppHeader.vue';

import ProjectOverview from './views/ProjectOverview.vue';
import AllGantt from './views/AllGantt.vue';
import GanttTemplates from './views/GanttTemplates.vue';
import ProjectDetail from './views/ProjectDetail.vue';

import ProjectFormModal from './components/modals/ProjectFormModal.vue';

import { projects as mockProjects } from './mock/projects';
import { ganttTasks as mockTasks } from './mock/ganttTasks';
import { weeklyReports as mockReports } from './mock/weeklyReports';
import { projectLinks as mockLinks } from './mock/projectLinks';
import { ganttTemplates as mockTemplates } from './mock/ganttTemplates';

// ============================================================
// 基本資料
// ============================================================

const projects = ref(structuredClone(mockProjects));
const tasks = ref(structuredClone(mockTasks));
const reports = ref(structuredClone(mockReports));
// ============================================================
// 從 Supabase 載入週報
// ============================================================



// ============================================================
// 從 Supabase 載入專案
// ============================================================

async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('載入專案失敗:', error);
    return;
  }

  projects.value = (data || []).map((project) => ({
    id: project.id,
    name: project.name || '',
    customer: project.customer || '',
    sa: project.sa || '',
    developer: project.developer || '',
    endDate: project.end_date || '',
    status: project.status || '',
    statusType: project.status_type || 'normal',
    progress: Number(project.progress) || 0,

    lastWeek: project.last_week || '',
    thisWeek: project.this_week || '',
    todo: project.todo || '',
    notes: project.notes || '',
  }));

  console.log('Supabase 專案載入完成:', projects.value);
}

async function loadWeeklyReports() {
  const { data: reportData, error: reportError } = await supabase
    .from('weekly_reports')
    .select('*')
    .order('id', { ascending: true });

  if (reportError) {
    console.error('載入週報失敗:', reportError);
    return;
  }

  const { data: workData, error: workError } = await supabase
    .from('weekly_report_works')
    .select('*')
    .order('id', { ascending: true });

  if (workError) {
    console.error('載入週報工作事項失敗:', workError);
    return;
  }

  reports.value = (reportData || []).map((report) => {
    const reportWorks = (workData || []).filter(
      (work) =>
        String(work.weekly_report_id) ===
        String(report.id)
    );

    const lastWeekWorks = reportWorks
      .filter((work) => work.work_type === 'last_week')
      .map((work) => ({
        id: work.id,
        description: work.description || '',
        taskIds: work.gantt_task_id
          ? [work.gantt_task_id]
          : [],
      }));

    const thisWeekWorks = reportWorks
      .filter((work) => work.work_type === 'this_week')
      .map((work) => ({
        id: work.id,
        description: work.description || '',
        taskIds: work.gantt_task_id
          ? [work.gantt_task_id]
          : [],
      }));

    return {
      id: report.id,

      projectId: report.project_id,

      week: report.week || '',

      startDate: report.start_date || '',

      endDate: report.end_date || '',

      lastWeekActual: report.last_week_actual || '',

      thisWeekPlan: report.this_week_plan || '',

      todo: report.todo || '',

      notes: report.notes || '',

      lastWeekWorks,

      thisWeekWorks,

      // 保留目前 ProjectDetail 使用的舊格式
      works: thisWeekWorks,
    };
  });

  console.log('Supabase 週報載入完成:', reports.value);
}



// ============================================================
// 從 Supabase 載入甘特項目
// ============================================================

async function loadGanttTasks() {
  const { data, error } = await supabase
    .from('gantt_tasks')
    .select('*')
    .order('id', { ascending: true });

  if (error) {
    console.error('載入甘特項目失敗:', error);
    return;
  }

  tasks.value = (data || []).map((task) => ({
    id: task.id,

    projectId: task.project_id,

    name: task.name || '',

    start: task.start_date || '',

    end: task.end_date || '',

    progress: Number(task.progress) || 0,

    status:
      task.status ||
      (
        Number(task.progress) >= 100
          ? '已完成'
          : Number(task.progress) > 0
          ? '進行中'
          : '未開始'
      ),

    description: task.description || '',
  }));

  console.log('Supabase 甘特項目載入完成:', tasks.value);
}

const links = ref([]);



const templates = ref([]);
const projectDetailRef = ref(null);

// ============================================================
// 頁面狀態
// ============================================================

const currentPage = ref('overview');
const selectedProjectId = ref(null);

const showProjectModal = ref(false);
const editingProject = ref(false);

const projectForm = ref({});

// ============================================================
// 目前專案
// ============================================================

const selectedProject = computed(() => {
  return (
    projects.value.find(
      (p) => String(p.id) === String(selectedProjectId.value)
    ) || null
  );
});

// ============================================================
// 專案總覽使用「最新一筆週報」
// ============================================================

const overviewProjects = computed(() => {
  return projects.value.map((project) => {
    const projectReports = reports.value
      .filter((report) => String(report.projectId) === String(project.id))
      .sort((a, b) => {
        const aWeek = Number(String(a.week || '').replace(/\D/g, '')) || 0;

        const bWeek = Number(String(b.week || '').replace(/\D/g, '')) || 0;

        if (bWeek !== aWeek) {
          return bWeek - aWeek;
        }

        return Number(b.id || 0) - Number(a.id || 0);
      });

    const latestReport = projectReports[0];

    if (!latestReport) {
      return project;
    }

    return {
      ...project,

      // 最新週報
      lastWeek: latestReport.lastWeekActual ?? project.lastWeek ?? '',

      thisWeek: latestReport.thisWeekPlan ?? project.thisWeek ?? '',

      todo: latestReport.todo ?? project.todo ?? '',

      notes: latestReport.notes ?? project.notes ?? '',
    };
  });
});

// ============================================================
// 導頁
// ============================================================

function navigate(page) {
  currentPage.value = page;

  if (page !== 'project') {
    selectedProjectId.value = null;
  }
}

function openProject(project) {
  // 如果這個專案是從 Supabase 取得、
  // 但 App.vue 目前的 projects 裡沒有，
  // 就先加入目前專案資料。
  const index = projects.value.findIndex(
    (p) => String(p.id) === String(project.id)
  );

  if (index === -1) {
    projects.value.push({
      ...project,
      endDate: project.end_date ?? project.endDate ?? '',
      lastWeek: project.last_week ?? project.lastWeek ?? '',
      thisWeek: project.this_week ?? project.thisWeek ?? '',
      statusType:
        project.status_type ??
        project.statusType ??
        statusType(project.status),
    });
  } else {
    projects.value[index] = {
      ...projects.value[index],
      ...project,
      endDate: project.end_date ?? project.endDate ?? '',
      lastWeek: project.last_week ?? project.lastWeek ?? '',
      thisWeek: project.this_week ?? project.thisWeek ?? '',
      statusType:
        project.status_type ??
        project.statusType ??
        statusType(project.status),
    };
  }

  selectedProjectId.value = project.id;
  currentPage.value = 'project';
}

function openGanttTask(task) {
  if (!task) {
    return;
  }

  const project = projects.value.find(
    (project) => String(project.id) === String(task.projectId)
  );

  if (!project) {
    return;
  }

  // 先切到該專案
  selectedProjectId.value = project.id;
  currentPage.value = 'project';

  // 等 ProjectDetail 顯示後，再開啟甘特詳細 Modal
  setTimeout(() => {
    projectDetailRef.value?.showTaskDetail(task);
  }, 0);
}

// ============================================================
// 專案
// ============================================================

function addProject() {
  editingProject.value = false;

  projectForm.value = {
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
  };

  showProjectModal.value = true;
}

function editSelectedProject() {
  if (!selectedProject.value) return;

  editingProject.value = true;
  projectForm.value = {
    ...selectedProject.value,
  };

  showProjectModal.value = true;
}

function statusType(status) {
  return status === '暫緩' ? 'paused' : 'normal';
}

async function saveProject(payload) {
  const form = payload.form;

  if (!form.name || !form.name.trim()) {
    alert('請輸入專案名稱');
    return;
  }

  // =========================
  // 編輯既有專案
  // =========================
  if (payload.editing) {
    const { data, error } = await supabase
      .from('projects')
      .update({
        name: form.name,
        customer: form.customer,
        sa: form.sa,
        developer: form.developer,
        end_date: form.endDate || null,
        status: form.status,
        status_type: statusType(form.status),
        progress: Number(form.progress) || 0,
        last_week: form.lastWeek,
        this_week: form.thisWeek,
        todo: form.todo,
        notes: form.notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedProjectId.value)
      .select()
      .single();

    if (error) {
      console.error('更新專案失敗:', error);
      alert(`更新專案失敗：${error.message}`);
      return;
    }

    const index = projects.value.findIndex(
      (p) => String(p.id) === String(selectedProjectId.value)
    );

    if (index !== -1) {
      projects.value[index] = {
        ...data,
        endDate: data.end_date,
        lastWeek: data.last_week,
        thisWeek: data.this_week,
        statusType: data.status_type,
      };
    }
  }

  // =========================
  // 新增專案
  // =========================
  else {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        name: form.name,
        customer: form.customer,
        sa: form.sa,
        developer: form.developer,
        end_date: form.endDate || null,
        status: form.status,
        status_type: statusType(form.status),
        progress: Number(form.progress) || 0,
        last_week: form.lastWeek,
        this_week: form.thisWeek,
        todo: form.todo,
        notes: form.notes,
      })
      .select()
      .single();

    if (error) {
      console.error('新增專案失敗:', error);
      alert(`新增專案失敗：${error.message}`);
      return;
    }

    const newProject = {
      ...data,
      endDate: data.end_date,
      lastWeek: data.last_week,
      thisWeek: data.this_week,
      statusType: data.status_type,
    };

    projects.value.push(newProject);

    selectedProjectId.value = data.id;
    currentPage.value = 'project';
  }

  showProjectModal.value = false;
}
async function deleteSelectedProject() {
  if (!selectedProject.value) return;

  if (!confirm(`確定刪除「${selectedProject.value.name}」？`)) {
    return;
  }

  const id = selectedProjectId.value;

  // =========================
  // 刪除 Supabase 專案
  // =========================
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('刪除專案失敗:', error);
    alert(`刪除專案失敗：${error.message}`);
    return;
  }

  // =========================
  // 更新前端資料
  // =========================
  projects.value = projects.value.filter(
    (p) => String(p.id) !== String(id)
  );

  tasks.value = tasks.value.filter(
    (t) => String(t.projectId) !== String(id)
  );

  reports.value = reports.value.filter(
    (r) => String(r.projectId) !== String(id)
  );

  links.value = links.value.filter(
    (l) => String(l.projectId) !== String(id)
  );

  navigate('overview');
}

// ============================================================
// 甘特項目
// ============================================================
async function addTask({ form }) {
  const status =
    Number(form.progress) >= 100
      ? '已完成'
      : Number(form.progress) > 0
      ? '進行中'
      : '未開始';

  const { data, error } = await supabase
    .from('gantt_tasks')
    .insert({
      project_id: selectedProjectId.value,
      name: form.name || '',
      start_date: form.start || null,
      end_date: form.end || null,
      progress: Number(form.progress) || 0,
      status,
      description: form.description || '',
    })
    .select()
    .single();

  if (error) {
    console.error('新增甘特項目失敗:', error);
    alert(`新增甘特項目失敗：${error.message}`);
    return;
  }

  const newTask = {
    id: data.id,
    projectId: data.project_id,
    name: data.name || '',
    start: data.start_date || '',
    end: data.end_date || '',
    progress: Number(data.progress) || 0,
    status: data.status || '',
    description: data.description || '',
  };

  tasks.value.push(newTask);
}


async function editTask({ form, task }) {
  if (!task || !task.id) {
    alert('找不到有效的甘特項目 ID');
    return;
  }

  const taskId = Number(task.id);

  if (!Number.isFinite(taskId)) {
    alert('甘特項目 ID 無效');
    return;
  }

  const progress = Number(form.progress) || 0;

  const status =
    progress >= 100
      ? '已完成'
      : progress > 0
      ? '進行中'
      : '未開始';

  const { data, error } = await supabase
    .from('gantt_tasks')
    .update({
      name: form.name || '',
      start_date: form.start || null,
      end_date: form.end || null,
      progress,
      status,
      description: form.description || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();

  if (error) {
    console.error('更新甘特項目失敗:', error);
    alert(`更新甘特項目失敗：${error.message}`);
    return;
  }

  console.log('甘特項目更新成功:', data);

  // 重新從 Supabase 載入最新甘特資料
  await loadGanttTasks();
}
async function deleteTask(task) {
  if (!task) return;

  if (!confirm(`刪除「${task.name}」？`)) return;

  const { error } = await supabase
    .from('gantt_tasks')
    .delete()
    .eq('id', task.id);

  if (error) {
    console.error('刪除甘特項目失敗:', error);
    alert(`刪除甘特項目失敗：${error.message}`);
    return;
  }

  tasks.value = tasks.value.filter(
    (x) => String(x.id) !== String(task.id)
  );
}

// ============================================================
// 每週進度
// ============================================================

// ------------------------------------------------------------
// 取得下一個週次
//
// 例如目前已經有：
// W32
// W33
//
// 下一次新增就會是：
// W34
// ------------------------------------------------------------

function getNextWeekNumber() {
  const currentWeeks = reports.value
    .map((report) => {
      const match = String(report.week || '').match(/^W(\d+)$/i);

      return match ? Number(match[1]) : 0;
    })
    .filter((week) => week > 0);

  // 如果目前完全沒有週報，預設從 W1 開始
  if (currentWeeks.length === 0) {
    return 1;
  }

  return Math.max(...currentWeeks) + 1;
}

// ------------------------------------------------------------
// 取得某一週的星期一
// ------------------------------------------------------------

function getMonday(date = new Date()) {
  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  // 星期日 = 0
  // 星期一 = 1
  //
  // 如果今天星期日，要回到前一個星期一
  const diff = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diff);

  return result;
}

// ------------------------------------------------------------
// 日期格式
//
// Date → YYYY-MM-DD
// ------------------------------------------------------------

function formatDate(date) {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, '0');

  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ------------------------------------------------------------
// 取得下一週資訊
//
// 例如現在是 W33：
//
// {
//   week: 'W34',
//   startDate: '2026-08-17',
//   endDate: '2026-08-21'
// }
// ------------------------------------------------------------

function getNextWeekInfo() {
  const weekNumber = getNextWeekNumber();

  // 以「最後一筆週報」的日期作為基準，
  // 如果沒有週報才使用今天。
  const projectReports = reports.value.filter(
    (report) => String(report.projectId) === String(selectedProjectId.value)
  );

  let baseDate = new Date();

  const datedReports = projectReports
    .filter((report) => report.endDate)
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  if (datedReports.length > 0) {
    baseDate = new Date(datedReports[0].endDate);

    // 從上一週的結束日往後一週
    baseDate.setDate(baseDate.getDate() + 7);
  }

  const monday = getMonday(baseDate);

  const friday = new Date(monday);

  friday.setDate(monday.getDate() + 4);

  return {
    week: `W${weekNumber}`,

    startDate: formatDate(monday),

    endDate: formatDate(friday),
  };
}

// ------------------------------------------------------------
// 新增每週進度
//
// 支援目前舊格式：
// form.workDescription
// form.taskIds
//
// 也支援新的多筆格式：
// form.workItems
//
// workItems 範例：
//
// [
//   {
//     description: '完成 API 串接測試',
//     taskId: 5
//   },
//   {
//     description: '確認設備資料',
//     taskId: null
//   }
// ]
//
// taskId = null
// 代表這一筆工作事項不關聯甘特
// ------------------------------------------------------------

async function addWeekly(form) {
  if (!form) {
    return;
  }

  const projectId = selectedProjectId.value;

  if (!projectId) {
    alert('請先選擇專案。');
    return;
  }

  // ==========================================================
  // 本週工作事項
  // ==========================================================

  const thisWeekWorks = Array.isArray(form.thisWeekWorks)
    ? form.thisWeekWorks
        .filter(
          (work) =>
            work &&
            String(work.description || '').trim()
        )
        .map((work) => ({
          description: String(
            work.description || ''
          ).trim(),

          taskId:
            work.taskId ??
            work.ganttTaskId ??
            null,
        }))
    : [];

  // ==========================================================
  // 上週實際工作事項
  // ==========================================================

  const lastWeekWorks = Array.isArray(form.lastWeekWorks)
    ? form.lastWeekWorks
        .filter(
          (work) =>
            work &&
            String(work.description || '').trim()
        )
        .map((work) => ({
          description: String(
            work.description || ''
          ).trim(),

          taskId:
            work.taskId ??
            work.ganttTaskId ??
            null,
        }))
    : [];

  // ==========================================================
  // 1. 建立 weekly_reports
  // ==========================================================

  const { data: reportData, error: reportError } =
    await supabase
      .from('weekly_reports')
      .insert({
        project_id: projectId,

        week: form.week || '',

        start_date:
          form.startDate || null,

        end_date:
          form.endDate || null,

        last_week_actual:
          form.lastWeekActual ||
          lastWeekWorks
            .map((work) => work.description)
            .join('\n'),

        this_week_plan:
          form.thisWeekPlan ||
          thisWeekWorks
            .map((work) => work.description)
            .join('\n'),

        todo: form.todo || '',

        notes: form.notes || '',
      })
      .select()
      .single();

  if (reportError) {
    console.error(
      '新增週報失敗:',
      reportError
    );

    alert(
      `新增週報失敗：${reportError.message}`
    );

    return;
  }

  // ==========================================================
  // 2. 建立 weekly_report_works
  // ==========================================================

  const worksToInsert = [
    ...lastWeekWorks.map((work) => ({
      weekly_report_id: reportData.id,

      gantt_task_id:
        work.taskId || null,

      description:
        work.description,

      work_type:
        'last_week',
    })),

    ...thisWeekWorks.map((work) => ({
      weekly_report_id: reportData.id,

      gantt_task_id:
        work.taskId || null,

      description:
        work.description,

      work_type:
        'this_week',
    })),
  ];

  if (worksToInsert.length > 0) {
    const { error: worksError } =
      await supabase
        .from('weekly_report_works')
        .insert(worksToInsert);

    if (worksError) {
      console.error(
        '新增週報工作事項失敗:',
        worksError
      );

      alert(
        `新增週報工作事項失敗：${worksError.message}`
      );

      return;
    }
  }

  // ==========================================================
  // 3. 組成前端目前使用的 reports 格式
  // ==========================================================

  const report = {
    ...form,

    id: reportData.id,

    projectId:
      reportData.project_id,

    week:
      reportData.week || '',

    startDate:
      reportData.start_date || '',

    endDate:
      reportData.end_date || '',

    lastWeekActual:
      reportData.last_week_actual || '',

    thisWeekPlan:
      reportData.this_week_plan || '',

    todo:
      reportData.todo || '',

    notes:
      reportData.notes || '',

    lastWeekWorks,

    thisWeekWorks,

    works: thisWeekWorks.map(
      (work, index) => ({
        id:
          index + 1,

        description:
          work.description,

        taskIds:
          work.taskId
            ? [work.taskId]
            : [],
      })
    ),
  };

  // ==========================================================
  // 4. 更新前端 reports
  // ==========================================================

  reports.value.push(report);

  // ==========================================================
  // 5. 同步更新專案總覽
  // ==========================================================

  const project =
    projects.value.find(
      (p) =>
        String(p.id) ===
        String(projectId)
    );

  if (project) {
    project.lastWeek =
      report.lastWeekActual ||
      project.lastWeek;

    project.thisWeek =
      report.thisWeekPlan ||
      project.thisWeek;

    project.todo =
      report.todo ||
      project.todo;

    project.notes =
      report.notes ||
      project.notes;
  }



}

// ============================================================
// 編輯既有每週進度
// ============================================================
async function editWeekly(form) {
  if (!form || !form.id) {
    return;
  }

  const index = reports.value.findIndex(
    (report) => String(report.id) === String(form.id)
  );

  if (index === -1) {
    alert('找不到要修改的週報資料。');
    return;
  }

  const oldReport = reports.value[index];

  // ==========================================================
  // 整理本週工作事項
  // ==========================================================

  const thisWeekWorks = Array.isArray(form.thisWeekWorks)
    ? form.thisWeekWorks
        .filter(
          (work) =>
            work &&
            String(work.description || '').trim()
        )
        .map((work) => ({
          id: Number(work.id) || null,

          description:
            String(work.description || '').trim(),

          taskIds:
            Array.isArray(work.taskIds)
              ? [...work.taskIds]
              : [],
        }))
    : [];

  // ==========================================================
  // 整理上週實際工作事項
  // ==========================================================

  const lastWeekWorks = Array.isArray(form.lastWeekWorks)
    ? form.lastWeekWorks
        .filter(
          (work) =>
            work &&
            String(work.description || '').trim()
        )
        .map((work) => ({
          id: Number(work.id) || null,

          description:
            String(work.description || '').trim(),

          taskIds:
            Array.isArray(work.taskIds)
              ? [...work.taskIds]
              : [],
        }))
    : [];

  // ==========================================================
  // 1. 更新 weekly_reports
  // ==========================================================

  const { data: reportData, error: reportError } =
    await supabase
      .from('weekly_reports')
      .update({
        week:
          form.week ||
          oldReport.week ||
          '',

        start_date:
          form.startDate ||
          oldReport.startDate ||
          null,

        end_date:
          form.endDate ||
          oldReport.endDate ||
          null,

        last_week_actual:
          lastWeekWorks
            .map((work) => work.description)
            .join('\n'),

        this_week_plan:
          thisWeekWorks
            .map((work) => work.description)
            .join('\n'),

        todo:
          form.todo ||
          '',

        notes:
          form.notes ||
          '',

        updated_at:
          new Date().toISOString(),
      })
      .eq('id', oldReport.id)
      .select()
      .single();

  if (reportError) {
    console.error(
      '更新週報失敗:',
      reportError
    );

    alert(
      `更新週報失敗：${reportError.message}`
    );

    return;
  }

  const { data: linkData, error: linkError } = await supabase
  .from('project_links')
  .select('*')
  .order('id', { ascending: true });

if (linkError) {
  console.error('載入雲端資料失敗:', linkError);
} else {
  links.value = (linkData || []).map((link) => ({
    id: link.id,
    projectId: link.project_id,
    name: link.name,
    url: link.url,
  }));
}


  // ==========================================================
  // 2. 先刪除這一筆週報原本的工作事項
  //
  // 再重新建立目前畫面上的工作事項。
  //
  // 這樣可以處理：
  // - 新增工作
  // - 修改工作
  // - 刪除工作
  // ==========================================================

  const { error: deleteWorksError } =
    await supabase
      .from('weekly_report_works')
      .delete()
      .eq(
        'weekly_report_id',
        oldReport.id
      );

  if (deleteWorksError) {
    console.error(
      '清除舊週報工作事項失敗:',
      deleteWorksError
    );

    alert(
      `更新週報工作事項失敗：${deleteWorksError.message}`
    );

    return;
  }

  // ==========================================================
  // 3. 重新建立工作事項
  // ==========================================================

  const worksToInsert = [
    ...lastWeekWorks.map((work) => ({
      weekly_report_id:
        reportData.id,

      gantt_task_id:
        work.taskIds.length > 0
          ? work.taskIds[0]
          : null,

      description:
        work.description,

      work_type:
        'last_week',
    })),

    ...thisWeekWorks.map((work) => ({
      weekly_report_id:
        reportData.id,

      gantt_task_id:
        work.taskIds.length > 0
          ? work.taskIds[0]
          : null,

      description:
        work.description,

      work_type:
        'this_week',
    })),
  ];

  if (worksToInsert.length > 0) {
    const { data: worksData, error: worksError } =
      await supabase
        .from('weekly_report_works')
        .insert(worksToInsert)
        .select();

    if (worksError) {
      console.error(
        '重新建立週報工作事項失敗:',
        worksError
      );

      alert(
        `更新週報工作事項失敗：${worksError.message}`
      );

      return;
    }
  }

  // ==========================================================
  // 4. 組回前端 reports 格式
  // ==========================================================

  const updatedReport = {
    ...oldReport,

    ...form,

    // 保留資料庫 ID
    id:
      reportData.id,

    // 保留專案 ID
    projectId:
      reportData.project_id,

    // 日期
    week:
      reportData.week || '',

    startDate:
      reportData.start_date || '',

    endDate:
      reportData.end_date || '',

    range:
      form.range ||
      (
        reportData.start_date &&
        reportData.end_date
      )
        ? `${String(
            reportData.start_date
          ).replace(/-/g, '/')} ～ ${String(
            reportData.end_date
          ).replace(/-/g, '/')}`
        : oldReport.range || '',

    // 週報內容
    lastWeekActual:
      reportData.last_week_actual ||
      '',

    thisWeekPlan:
      reportData.this_week_plan ||
      '',

    todo:
      reportData.todo ||
      '',

    notes:
      reportData.notes ||
      '',

    // 新版工作資料
    lastWeekWorks,

    thisWeekWorks,

    // 舊版相容
    lastWeekTaskIds:
      lastWeekWorks.flatMap(
        (work) =>
          work.taskIds || []
      ),

    taskIds:
      thisWeekWorks.flatMap(
        (work) =>
          work.taskIds || []
      ),

    works:
      thisWeekWorks.map(
        (work) => ({
          id:
            work.id,

          description:
            work.description,

          taskIds:
            work.taskIds || [],
        })
      ),
  };

  // ==========================================================
  // 5. 更新前端 reports
  // ==========================================================

  reports.value[index] =
    updatedReport;

  // ==========================================================
  // 6. 同步更新專案總覽
  // ==========================================================

  const projectIndex =
    projects.value.findIndex(
      (project) =>
        String(project.id) ===
        String(
          oldReport.projectId
        )
    );

  if (projectIndex !== -1) {
    projects.value[
      projectIndex
    ] = {
      ...projects.value[
        projectIndex
      ],

      lastWeek:
        updatedReport.lastWeekActual ||
        '',

      thisWeek:
        updatedReport.thisWeekPlan ||
        '',

      todo:
        updatedReport.todo ||
        '',

      notes:
        updatedReport.notes ||
        '',
    };
  }
}

async function deleteWeekly(report) {
  if (!report) return;

  if (!confirm(`確定要刪除「${report.week || '這筆週報'}」嗎？`)) {
    return;
  }

  const reportId = Number(report.id);

  if (!Number.isFinite(reportId)) {
    alert('找不到有效的週報 ID');
    return;
  }

  // ==========================================================
  // 先刪除週報工作事項
  // ==========================================================

  const { error: worksError } = await supabase
    .from('weekly_report_works')
    .delete()
    .eq('weekly_report_id', reportId);

  if (worksError) {
    console.error('刪除週報工作事項失敗:', worksError);
    alert(`刪除週報工作事項失敗：${worksError.message}`);
    return;
  }

  // ==========================================================
  // 再刪除週報
  // ==========================================================

  const { error: reportError } = await supabase
    .from('weekly_reports')
    .delete()
    .eq('id', reportId);

  if (reportError) {
    console.error('刪除週報失敗:', reportError);
    alert(`刪除週報失敗：${reportError.message}`);
    return;
  }

  // ==========================================================
  // 更新前端畫面
  // ==========================================================

  reports.value = reports.value.filter(
    (r) => String(r.id) !== String(reportId)
  );

  console.log('週報刪除成功:', reportId);
}

// ============================================================
// 甘特關聯
// ============================================================
async function addLink(form) {
  if (!form) return;

  const projectId = Number(selectedProjectId.value);

  if (!Number.isFinite(projectId)) {
    alert('找不到有效的專案 ID');
    return;
  }

  const { data, error } = await supabase
    .from('project_links')
    .insert({
      project_id: projectId,
      name: String(form.name || '').trim(),
      url: String(form.url || '').trim(),
    })
    .select()
    .single();

  if (error) {
    console.error('新增雲端資料失敗:', error);
    alert(`新增雲端資料失敗：${error.message}`);
    return;
  }

  links.value.push({
    id: data.id,
    projectId: data.project_id,
    name: data.name,
    url: data.url,
  });
}

async function deleteLink(link) {
  if (!link) return;

  if (!confirm(`確定要刪除「${link.name}」嗎？`)) {
    return;
  }

  const linkId = Number(link.id);

  if (!Number.isFinite(linkId)) {
    alert('找不到有效的雲端資料 ID');
    return;
  }

  const { error } = await supabase
    .from('project_links')
    .delete()
    .eq('id', linkId);

  if (error) {
    console.error('刪除雲端資料失敗:', error);
    alert(`刪除雲端資料失敗：${error.message}`);
    return;
  }

  // 更新前端畫面
  links.value = links.value.filter(
    (x) => String(x.id) !== String(linkId)
  );
}

// ============================================================
// 甘特模板
// ============================================================

// ============================================================
// 從 Supabase 載入甘特模板
// ============================================================

async function loadGanttTemplates() {
  const { data: templateData, error: templateError } =
    await supabase
      .from('gantt_templates')
      .select('*')
      .order('id', { ascending: true });

  if (templateError) {
    console.error('載入甘特模板失敗:', templateError);
    return;
  }

  const { data: taskData, error: taskError } =
    await supabase
      .from('gantt_template_tasks')
      .select('*')
      .order('sequence', { ascending: true });

  if (taskError) {
    console.error('載入甘特模板項目失敗:', taskError);
    return;
  }

  templates.value = (templateData || []).map((template) => ({
    id: template.id,
    type: template.type || 'custom',
    name: template.name || '',
    description: template.description || '',

    tasks: (taskData || [])
      .filter(
        (task) =>
          String(task.template_id) === String(template.id)
      )
      .sort(
        (a, b) =>
          Number(a.sequence || 0) -
          Number(b.sequence || 0)
      )
      .map((task) => task.name || ''),
  }));

  console.log('Supabase 甘特模板載入完成:', templates.value);
}

async function applyTemplate(template) {
  if (!template) return;

  const projectId = Number(selectedProjectId.value);

  if (!Number.isFinite(projectId)) {
    alert('找不到有效的專案 ID');
    return;
  }

  const taskNames = Array.isArray(template.tasks)
    ? template.tasks
        .map((name) => String(name || '').trim())
        .filter(Boolean)
    : [];

  if (taskNames.length === 0) {
    alert('此模板沒有甘特項目');
    return;
  }

  // ==========================================================
  // 目前專案已有的甘特項目
  // ==========================================================

  const currentProjectTasks = tasks.value.filter(
    (task) =>
      String(task.projectId) === String(projectId)
  );

  // ==========================================================
  // 如果已有甘特項目，先確認是否要取代
  // ==========================================================

  if (currentProjectTasks.length > 0) {
    const confirmed = confirm(
      `此專案目前已有 ${currentProjectTasks.length} 個甘特項目。\n\n` +
      `套用「${template.name}」後，將會取代目前的甘特項目。\n\n` +
      `確定要繼續嗎？`
    );

    if (!confirmed) {
      return;
    }
  }

  // ==========================================================
  // 先刪除目前專案的甘特項目
  // ==========================================================

  if (currentProjectTasks.length > 0) {
    const oldTaskIds = currentProjectTasks
      .map((task) => Number(task.id))
      .filter((id) => Number.isFinite(id));

    if (oldTaskIds.length > 0) {
      const { error: deleteError } =
        await supabase
          .from('gantt_tasks')
          .delete()
          .in('id', oldTaskIds);

      if (deleteError) {
        console.error(
          '取代甘特項目失敗:',
          deleteError
        );

        alert(
          `取代甘特項目失敗：${deleteError.message}`
        );

        return;
      }
    }
  }

  // ==========================================================
  // 建立新模板的甘特項目
  // ==========================================================

  const taskRows = taskNames.map((name) => ({
    project_id: projectId,

    name,

    start_date: '2026-08-11',

    end_date: '2026-09-30',

    progress: 0,

    status: '未開始',

    description: '',
  }));

  const { data, error } =
    await supabase
      .from('gantt_tasks')
      .insert(taskRows)
      .select();

  if (error) {
    console.error(
      '套用甘特模板失敗:',
      error
    );

    alert(
      `套用甘特模板失敗：${error.message}`
    );

    // 重新讀取，確保前端與 DB 保持一致
    await loadGanttTasks();

    return;
  }

  // ==========================================================
  // 更新前端
  // ==========================================================

  const newTasks = (data || []).map((task) => ({
    id: task.id,

    projectId: task.project_id,

    name: task.name || '',

    start: task.start_date || '',

    end: task.end_date || '',

    progress: Number(task.progress) || 0,

    status: task.status || '未開始',

    description: task.description || '',
  }));

  // 直接重新載入 Supabase
  // 確保畫面與資料庫完全一致
  await loadGanttTasks();

  console.log(
    `甘特模板「${template.name}」套用成功`,
    newTasks
  );

  alert(
    `已套用「${template.name}」模板，共建立 ${newTasks.length} 個甘特項目。`
  );
}

async function saveTemplate({ form, editing }) {
  if (!form) return;

  const name = String(form.name || '').trim();

  if (!name) {
    alert('請輸入模板名稱');
    return;
  }

  const description =
    String(form.description || '').trim();

  const taskNames = String(form.tasksText || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);

  // ==========================================================
  // 編輯模板
  // ==========================================================

  if (editing) {
    const templateId = Number(form.id);

    if (!Number.isFinite(templateId)) {
      alert('找不到有效的模板 ID');
      return;
    }

    // --------------------------------------------------------
    // 1. 更新模板基本資料
    // --------------------------------------------------------

    const { data: templateData, error: templateError } =
      await supabase
        .from('gantt_templates')
        .update({
          name,
          description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .select()
        .single();

    if (templateError) {
      console.error('更新甘特模板失敗:', templateError);
      alert(`更新甘特模板失敗：${templateError.message}`);
      return;
    }

    // --------------------------------------------------------
    // 2. 刪除舊的模板項目
    // --------------------------------------------------------

    const { error: deleteTaskError } =
      await supabase
        .from('gantt_template_tasks')
        .delete()
        .eq('template_id', templateId);

    if (deleteTaskError) {
      console.error(
        '清除舊模板項目失敗:',
        deleteTaskError
      );

      alert(
        `更新模板項目失敗：${deleteTaskError.message}`
      );

      return;
    }

    // --------------------------------------------------------
    // 3. 重新建立模板項目
    // --------------------------------------------------------

    const taskRows = taskNames.map((taskName, index) => ({
      template_id: templateId,
      sequence: index + 1,
      name: taskName,
    }));

    if (taskRows.length > 0) {
      const { error: insertTaskError } =
        await supabase
          .from('gantt_template_tasks')
          .insert(taskRows);

      if (insertTaskError) {
        console.error(
          '重新建立模板項目失敗:',
          insertTaskError
        );

        alert(
          `更新模板項目失敗：${insertTaskError.message}`
        );

        return;
      }
    }

    // --------------------------------------------------------
    // 4. 更新前端
    // --------------------------------------------------------

    const index = templates.value.findIndex(
      (template) =>
        String(template.id) === String(templateId)
    );

    const updatedTemplate = {
      id: templateData.id,
      type: templateData.type || 'custom',
      name: templateData.name || '',
      description: templateData.description || '',
      tasks: taskNames,
    };

    if (index !== -1) {
      templates.value[index] = updatedTemplate;
    }

    console.log('甘特模板更新成功:', updatedTemplate);

    return;
  }

  // ==========================================================
  // 新增模板
  // ==========================================================

  const { data: templateData, error: templateError } =
    await supabase
      .from('gantt_templates')
      .insert({
        type: 'custom',
        name,
        description,
      })
      .select()
      .single();

  if (templateError) {
    console.error('新增甘特模板失敗:', templateError);
    alert(`新增甘特模板失敗：${templateError.message}`);
    return;
  }

  // ----------------------------------------------------------
  // 建立模板項目
  // ----------------------------------------------------------

  const taskRows = taskNames.map((taskName, index) => ({
    template_id: templateData.id,
    sequence: index + 1,
    name: taskName,
  }));

  if (taskRows.length > 0) {
    const { error: insertTaskError } =
      await supabase
        .from('gantt_template_tasks')
        .insert(taskRows);

    if (insertTaskError) {
      console.error(
        '新增模板項目失敗:',
        insertTaskError
      );

      alert(
        `新增模板項目失敗：${insertTaskError.message}`
      );

      return;
    }
  }

  // ----------------------------------------------------------
  // 更新前端
  // ----------------------------------------------------------

  templates.value.push({
    id: templateData.id,
    type: templateData.type || 'custom',
    name: templateData.name || '',
    description: templateData.description || '',
    tasks: taskNames,
  });

  console.log(
    '甘特模板新增成功:',
    templateData
  );
}
async function deleteTemplate(template) {
  if (!template) return;

  if (!confirm(`刪除模板「${template.name}」？`)) {
    return;
  }

  const templateId = Number(template.id);

  if (!Number.isFinite(templateId)) {
    alert('找不到有效的模板 ID');
    return;
  }

  // ==========================================================
  // 1. 先刪除模板項目
  // ==========================================================

  const { error: taskError } =
    await supabase
      .from('gantt_template_tasks')
      .delete()
      .eq('template_id', templateId);

  if (taskError) {
    console.error(
      '刪除模板項目失敗:',
      taskError
    );

    alert(
      `刪除模板項目失敗：${taskError.message}`
    );

    return;
  }

  // ==========================================================
  // 2. 再刪除模板
  // ==========================================================

  const { error: templateError } =
    await supabase
      .from('gantt_templates')
      .delete()
      .eq('id', templateId);

  if (templateError) {
    console.error(
      '刪除甘特模板失敗:',
      templateError
    );

    alert(
      `刪除甘特模板失敗：${templateError.message}`
    );

    return;
  }

  // ==========================================================
  // 3. 更新前端
  // ==========================================================

  templates.value =
    templates.value.filter(
      (x) =>
        String(x.id) !== String(templateId)
    );

  console.log(
    '甘特模板刪除成功:',
    templateId
  );
}

// ============================================================
// Header
// ============================================================

const headerTitle = computed(() => {
  if (currentPage.value === 'overview') {
    return '專案總覽';
  }

  if (currentPage.value === 'all-gantt') {
    return '全部專案甘特';
  }

  if (currentPage.value === 'templates') {
    return '甘特模板管理';
  }

  return selectedProject.value?.name || '';
});

const headerBreadcrumb = computed(() => {
  return headerTitle.value;
});

const showHeaderExport = computed(() => {
  return currentPage.value === 'overview';
});

// ============================================================
// Excel 共用設定
// ============================================================

function styleSheet(ws, widths) {
  ws['!cols'] = widths.map((width) => ({
    wch: width,
  }));

  ws['!freeze'] = {
    xSplit: 0,
    ySplit: 1,
  };
}

function saveWorkbook(workbook, name) {
  XLSX.writeFile(workbook, name);
}

// ============================================================
// 專案總覽 Excel
// ============================================================

function exportProjectExcel() {
  console.log('🔥 exportProjectExcel 被呼叫了');
  const headers = [
    '專案',
    '客戶／單位',
    'SA',
    '開發',
    '結案日',
    '狀態',
    '進度',
    '上週實際',
    '本週預計',
    '待辦',
    '備註',
  ];

  const rows = projects.value.map((project) => [
    project.name,
    project.customer,
    project.sa,
    project.developer,
    project.endDate,
    project.status,
    `${project.progress}%`,
    project.lastWeek,
    project.thisWeek,
    project.todo,
    project.notes,
  ]);

  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  const headerStyle = {
    fill: {
      fgColor: {
        rgb: '466F8F',
      },
    },
    font: {
      color: {
        rgb: 'FFFFFF',
      },
      bold: true,
      sz: 13,
    },
    alignment: {
      horizontal: 'center',
      vertical: 'center',
    },
  };

  const normalStyle = {
    font: {
      color: {
        rgb: '253746',
      },
      sz: 12,
    },
    alignment: {
      vertical: 'top',
      wrapText: true,
    },
  };

  headers.forEach((_, column) => {
    const cell =
      ws[
        XLSX.utils.encode_cell({
          r: 0,
          c: column,
        })
      ];

    if (cell) {
      cell.s = headerStyle;
    }
  });

  for (let row = 1; row < rows.length + 1; row++) {
    for (let column = 0; column < headers.length; column++) {
      const cell =
        ws[
          XLSX.utils.encode_cell({
            r: row,
            c: column,
          })
        ];

      if (cell) {
        cell.s = normalStyle;
      }
    }

    const project = projects.value[row - 1];

    const statusCell =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 5,
        })
      ];

    if (statusCell) {
      statusCell.s = {
        ...normalStyle,
        fill: {
          fgColor: {
            rgb: project.status === '暫緩' ? 'F1EEEE' : 'EEF5F0',
          },
        },
      };
    }

    const progressCell =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 6,
        })
      ];

    if (progressCell) {
      progressCell.s = {
        ...normalStyle,
        font: {
          bold: true,
          color: {
            rgb: '466F8F',
          },
          sz: 12,
        },
      };
    }
  }

  styleSheet(ws, [28, 24, 14, 14, 15, 12, 10, 30, 30, 24, 30]);

  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, ws, '專案控管');

  saveWorkbook(wb, '專案控管表.xlsx');
}

// ============================================================
// 甘特 Excel
// ============================================================

// 甘特月份
const ganttMonths = [
  {
    key: '2026-06',
    label: '2026/06',
  },
  {
    key: '2026-07',
    label: '2026/07',
  },
  {
    key: '2026-08',
    label: '2026/08',
  },
  {
    key: '2026-09',
    label: '2026/09',
  },
  {
    key: '2026-10',
    label: '2026/10',
  },
];

// 每個月份固定四個區間
const ganttPeriods = [
  {
    month: '2026-06',
    day: '01',
    start: 1,
    end: 9,
  },
  {
    month: '2026-06',
    day: '10',
    start: 10,
    end: 19,
  },
  {
    month: '2026-06',
    day: '20',
    start: 20,
    end: 29,
  },
  {
    month: '2026-06',
    day: '30',
    start: 30,
    end: 30,
  },

  {
    month: '2026-07',
    day: '01',
    start: 1,
    end: 9,
  },
  {
    month: '2026-07',
    day: '10',
    start: 10,
    end: 19,
  },
  {
    month: '2026-07',
    day: '20',
    start: 20,
    end: 29,
  },
  {
    month: '2026-07',
    day: '30',
    start: 30,
    end: 31,
  },

  {
    month: '2026-08',
    day: '01',
    start: 1,
    end: 9,
  },
  {
    month: '2026-08',
    day: '10',
    start: 10,
    end: 19,
  },
  {
    month: '2026-08',
    day: '20',
    start: 20,
    end: 29,
  },
  {
    month: '2026-08',
    day: '30',
    start: 30,
    end: 31,
  },

  {
    month: '2026-09',
    day: '01',
    start: 1,
    end: 9,
  },
  {
    month: '2026-09',
    day: '10',
    start: 10,
    end: 19,
  },
  {
    month: '2026-09',
    day: '20',
    start: 20,
    end: 29,
  },
  {
    month: '2026-09',
    day: '30',
    start: 30,
    end: 30,
  },

  {
    month: '2026-10',
    day: '01',
    start: 1,
    end: 9,
  },
  {
    month: '2026-10',
    day: '10',
    start: 10,
    end: 19,
  },
  {
    month: '2026-10',
    day: '20',
    start: 20,
    end: 29,
  },
  {
    month: '2026-10',
    day: '30',
    start: 30,
    end: 31,
  },
];

// 日期轉成 Date
function parseDate(value) {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

// 判斷 task 是否涵蓋某一個甘特區間
function taskOverlapsPeriod(task, period) {
  const taskStart = parseDate(task.start);
  const taskEnd = parseDate(task.end);

  if (!taskStart || !taskEnd) {
    return false;
  }

  const [year, month] = period.month.split('-').map(Number);

  const periodStart = new Date(year, month - 1, period.start);

  const periodEnd = new Date(year, month - 1, period.end);

  return taskStart <= periodEnd && taskEnd >= periodStart;
}

// 取得月份索引
function getMonthColumnIndex(monthKey) {
  return ganttMonths.findIndex((month) => month.key === monthKey);
}

// ============================================================
// 甘特 Excel 匯出
//
// projectId:
//   'all' / undefined = 全部專案
//   指定 ID = 單一專案
// ============================================================

function exportGanttExcel(projectId = 'all') {
  // ============================================================
  // 1. 判斷匯出範圍
  //
  // all / null / undefined = 全部專案
  // 指定 ID = 單一專案
  // 也支援傳入 project 物件
  // ============================================================

  let selectedId = projectId;

  if (projectId && typeof projectId === 'object') {
    selectedId = projectId.id;
  }

  const exportProjects =
    selectedId === undefined ||
    selectedId === null ||
    selectedId === '' ||
    selectedId === 'all'
      ? [...projects.value]
      : projects.value.filter(
          (project) => String(project.id) === String(selectedId)
        );

  // ============================================================
  // 2. 找出甘特資料
  //
  // 不使用嚴格 ===，避免 projectId 一邊是 number、
  // 一邊是 string 時造成查不到資料。
  // ============================================================

  const dataRows = [];

  exportProjects.forEach((project) => {
    tasks.value
      .filter((task) => String(task.projectId) === String(project.id))
      .forEach((task) => {
        dataRows.push({
          project,
          task,
        });
      });
  });

  if (dataRows.length === 0) {
    alert('目前沒有可匯出的甘特項目。');
    return;
  }

  // ============================================================
  // 3. 甘特時間軸
  // ============================================================

  const ganttMonths = [
    { year: 2026, month: 6, label: '2026/06' },
    { year: 2026, month: 7, label: '2026/07' },
    { year: 2026, month: 8, label: '2026/08' },
    { year: 2026, month: 9, label: '2026/09' },
    { year: 2026, month: 10, label: '2026/10' },
  ];

  const periods = ['01', '10', '20', '30'];

  const ganttColumnCount = ganttMonths.length * periods.length;

  // ============================================================
  // 4. 判斷甘特項目是否涵蓋某一區間
  // ============================================================

  function isInPeriod(task, year, month, periodIndex) {
    if (!task || !task.start || !task.end) {
      return false;
    }

    const start = new Date(`${task.start}T00:00:00`);

    const end = new Date(`${task.end}T23:59:59`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return false;
    }

    let periodStart;
    let periodEnd;

    if (periodIndex === 0) {
      periodStart = new Date(year, month - 1, 1);

      periodEnd = new Date(year, month - 1, 9, 23, 59, 59);
    } else if (periodIndex === 1) {
      periodStart = new Date(year, month - 1, 10);

      periodEnd = new Date(year, month - 1, 19, 23, 59, 59);
    } else if (periodIndex === 2) {
      periodStart = new Date(year, month - 1, 20);

      periodEnd = new Date(year, month - 1, 29, 23, 59, 59);
    } else {
      periodStart = new Date(year, month - 1, 30);

      // 當月最後一天
      periodEnd = new Date(year, month, 0, 23, 59, 59);
    }

    return start <= periodEnd && end >= periodStart;
  }

  // ============================================================
  // 5. Excel 欄位
  // ============================================================

  const baseHeaders = [
    '專案',
    '甘特項目',
    '開始日期',
    '完成日期',
    '完成率',
    '狀態',
  ];

  // 第一列：月份
  const row1 = [
    ...baseHeaders,
    ...ganttMonths.flatMap((month) => [month.label, '', '', '']),
  ];

  // 第二列：01 / 10 / 20 / 30
  const row2 = ['', '', '', '', '', '', ...ganttMonths.flatMap(() => periods)];

  // ============================================================
  // 6. 重要：
  //
  // 這裡一次把「表頭 + 所有資料列 + 20 個甘特欄位」
  // 全部建立出來。
  //
  // 上一版空白的原因就是只建立了 header，
  // 後面才寫入不存在的 cell。
  // ============================================================

  const matrix = [row1, row2];

  dataRows.forEach(({ project, task }) => {
    matrix.push([
      project.name || '',
      task.name || '',
      task.start || '',
      task.end || '',
      `${Number(task.progress || 0)}%`,
      task.status || '',
      ...Array(ganttColumnCount).fill(''),
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(matrix);

  // ============================================================
  // 7. 顏色
  // ============================================================

  const colors = {
    header: '446F8F',
    headerLight: 'E9F0F3',
    text: '253746',
    border: 'C8D6DC',
    monthBorder: '8EA8B7',
    emptyGantt: 'F1F5F6',
    gantt: '6E91AE',
    white: 'FFFFFF',
    success: '5B9279',
    normal: '446F8F',
    paused: '7D858A',
  };

  const thinBorder = {
    style: 'thin',
    color: {
      rgb: colors.border,
    },
  };

  const monthBorder = {
    style: 'medium',
    color: {
      rgb: colors.monthBorder,
    },
  };

  // ============================================================
  // 8. 第一列樣式
  // ============================================================

  for (let column = 0; column < row1.length; column++) {
    const cell =
      ws[
        XLSX.utils.encode_cell({
          r: 0,
          c: column,
        })
      ];

    if (!cell) continue;

    cell.s = {
      fill: {
        fgColor: {
          rgb: colors.header,
        },
      },

      font: {
        color: {
          rgb: colors.white,
        },
        bold: true,
        sz: 12,
      },

      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },

      border: {
        top: thinBorder,
        bottom: thinBorder,
        left: thinBorder,
        right: thinBorder,
      },
    };
  }

  // ============================================================
  // 9. 第二列日期樣式
  // ============================================================

  for (let column = 0; column < row2.length; column++) {
    const cell =
      ws[
        XLSX.utils.encode_cell({
          r: 1,
          c: column,
        })
      ];

    if (!cell) continue;

    cell.s = {
      fill: {
        fgColor: {
          rgb: colors.headerLight,
        },
      },

      font: {
        color: {
          rgb: colors.header,
        },
        bold: true,
        sz: 10,
      },

      alignment: {
        horizontal: 'center',
        vertical: 'center',
      },

      border: {
        top: thinBorder,
        bottom: thinBorder,
        left: thinBorder,
        right: thinBorder,
      },
    };
  }

  // ============================================================
  // 10. 合併月份
  // ============================================================

  ws['!merges'] = [];

  // A:F 垂直合併
  for (let column = 0; column < 6; column++) {
    ws['!merges'].push({
      s: {
        r: 0,
        c: column,
      },
      e: {
        r: 1,
        c: column,
      },
    });
  }

  // 每 4 格為一個月份
  ganttMonths.forEach((month, monthIndex) => {
    const startColumn = 6 + monthIndex * 4;

    const endColumn = startColumn + 3;

    ws['!merges'].push({
      s: {
        r: 0,
        c: startColumn,
      },
      e: {
        r: 0,
        c: endColumn,
      },
    });

    const monthCell =
      ws[
        XLSX.utils.encode_cell({
          r: 0,
          c: startColumn,
        })
      ];

    if (monthCell) {
      monthCell.v = month.label;
      monthCell.s = {
        fill: {
          fgColor: {
            rgb: colors.header,
          },
        },

        font: {
          color: {
            rgb: colors.white,
          },
          bold: true,
          sz: 12,
        },

        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },

        border: {
          top: monthBorder,
          bottom: monthBorder,
          left: monthBorder,
          right: monthBorder,
        },
      };
    }
  });

  // ============================================================
  // 11. 資料列
  // ============================================================

  dataRows.forEach(({ project, task }, index) => {
    const row = index + 2;

    // --------------------------------------------------------
    // 基本資料
    // --------------------------------------------------------

    const values = [
      project.name || '',
      task.name || '',
      task.start || '',
      task.end || '',
      `${Number(task.progress || 0)}%`,
      task.status || '',
    ];

    values.forEach((value, column) => {
      const cell =
        ws[
          XLSX.utils.encode_cell({
            r: row,
            c: column,
          })
        ];

      if (!cell) return;

      cell.v = value;

      cell.s = {
        font: {
          color: {
            rgb: colors.text,
          },

          bold: column === 1 || column === 4,

          sz: 11,
        },

        alignment: {
          vertical: 'center',
          wrapText: true,
        },

        border: {
          top: thinBorder,
          bottom: thinBorder,
          left: thinBorder,
          right: thinBorder,
        },
      };
    });

    // --------------------------------------------------------
    // 完成率
    // --------------------------------------------------------

    const progressCell =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 4,
        })
      ];

    if (progressCell) {
      progressCell.s = {
        ...progressCell.s,

        font: {
          color: {
            rgb: colors.normal,
          },

          bold: true,
          sz: 11,
        },
      };
    }

    // --------------------------------------------------------
    // 狀態
    // --------------------------------------------------------

    let statusColor = colors.paused;

    if (task.status === '已完成') {
      statusColor = colors.success;
    } else if (task.status === '進行中') {
      statusColor = colors.normal;
    }

    const statusCell =
      ws[
        XLSX.utils.encode_cell({
          r: row,
          c: 5,
        })
      ];

    if (statusCell) {
      statusCell.s = {
        ...statusCell.s,

        font: {
          color: {
            rgb: statusColor,
          },

          bold: true,
          sz: 11,
        },
      };
    }

    // --------------------------------------------------------
    // 甘特區
    // --------------------------------------------------------

    const activeColumns = [];

    ganttMonths.forEach((month, monthIndex) => {
      periods.forEach((_, periodIndex) => {
        const column = 6 + monthIndex * 4 + periodIndex;

        const active = isInPeriod(task, month.year, month.month, periodIndex);

        const cell =
          ws[
            XLSX.utils.encode_cell({
              r: row,
              c: column,
            })
          ];

        if (!cell) return;

        // 每個月第一格加粗左線
        const isMonthStart = periodIndex === 0;

        if (active) {
          activeColumns.push(column);

          cell.v = '';

          cell.s = {
            fill: {
              fgColor: {
                rgb: colors.gantt,
              },
            },

            font: {
              color: {
                rgb: colors.white,
              },
              bold: true,
              sz: 10,
            },

            alignment: {
              horizontal: 'center',
              vertical: 'center',
            },

            border: {
              top: thinBorder,
              bottom: thinBorder,
              left: isMonthStart ? monthBorder : thinBorder,
              right: thinBorder,
            },
          };
        } else {
          cell.v = '';

          cell.s = {
            fill: {
              fgColor: {
                rgb: colors.emptyGantt,
              },
            },

            alignment: {
              horizontal: 'center',
              vertical: 'center',
            },

            border: {
              top: thinBorder,
              bottom: thinBorder,
              left: isMonthStart ? monthBorder : thinBorder,
              right: thinBorder,
            },
          };
        }
      });
    });

    // --------------------------------------------------------
    // 完成率只顯示一次
    //
    // 不再：
    // 55% 55% 55% 55%
    //
    // 而是整條甘特區只顯示一個 55%
    // --------------------------------------------------------

    if (activeColumns.length > 0) {
      const middleIndex = Math.floor(activeColumns.length / 2);

      const progressColumn = activeColumns[middleIndex];

      const progressBarCell =
        ws[
          XLSX.utils.encode_cell({
            r: row,
            c: progressColumn,
          })
        ];

      if (progressBarCell) {
        progressBarCell.v = `${Number(task.progress || 0)}%`;

        progressBarCell.s = {
          ...progressBarCell.s,

          font: {
            color: {
              rgb: colors.white,
            },

            bold: true,
            sz: 10,
          },

          alignment: {
            horizontal: 'center',
            vertical: 'center',
          },
        };
      }
    }
  });

  // ============================================================
  // 12. 每個月份第一格再加強分隔線
  // ============================================================

  for (let monthIndex = 0; monthIndex < ganttMonths.length; monthIndex++) {
    const column = 6 + monthIndex * 4;

    // 第二列日期
    const headerCell =
      ws[
        XLSX.utils.encode_cell({
          r: 1,
          c: column,
        })
      ];

    if (headerCell) {
      headerCell.s = {
        ...headerCell.s,

        border: {
          ...(headerCell.s?.border || {}),
          left: monthBorder,
        },
      };
    }

    // 所有資料列
    for (let row = 2; row < dataRows.length + 2; row++) {
      const cell =
        ws[
          XLSX.utils.encode_cell({
            r: row,
            c: column,
          })
        ];

      if (!cell) continue;

      cell.s = {
        ...cell.s,

        border: {
          ...(cell.s?.border || {}),
          left: monthBorder,
        },
      };
    }
  }

  // ============================================================
  // 13. 欄寬
  // ============================================================

  ws['!cols'] = [
    { wch: 28 },
    { wch: 32 },
    { wch: 15 },
    { wch: 15 },
    { wch: 11 },
    { wch: 12 },

    ...Array.from({ length: ganttColumnCount }, () => ({
      wch: 9,
    })),
  ];

  // ============================================================
  // 14. 列高
  // ============================================================

  ws['!rows'] = [
    {
      hpt: 24,
    },
    {
      hpt: 22,
    },

    ...dataRows.map(() => ({
      hpt: 24,
    })),
  ];

  // ============================================================
  // 15. 凍結
  //
  // 左邊固定 A:F
  // 上面固定兩列
  // ============================================================

  ws['!freeze'] = {
    xSplit: 6,
    ySplit: 2,
  };

  // ============================================================
  // 16. Workbook
  // ============================================================

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, ws, '全部專案甘特');

  const fileName =
    selectedId === undefined ||
    selectedId === null ||
    selectedId === '' ||
    selectedId === 'all'
      ? '全部專案甘特圖.xlsx'
      : `${exportProjects[0]?.name || '專案'}_甘特圖.xlsx`;

  saveWorkbook(workbook, fileName);
}

// ============================================================
// App 啟動時載入 Supabase 週報
// ============================================================

onMounted(() => {
  loadProjects();
  loadWeeklyReports();
  loadGanttTasks();
  loadGanttTemplates();
});

defineExpose({
  addProject,
  editSelectedProject,
});
</script>

<template>
  <div class="app">
    <!-- 左側選單 -->
    <AppSidebar :current-page="currentPage" @navigate="navigate" />

    <main class="main">
      <!--
        專案總覽才顯示 Header。
        全部專案甘特不需要再顯示新增專案。
      -->
      <AppHeader
        v-if="currentPage !== 'all-gantt'"
        :title="headerTitle"
        :breadcrumb="headerBreadcrumb"
        :show-export="showHeaderExport"
        export-label="匯出專案 Excel"
        @export="exportProjectExcel"
        @add="addProject"
      />

      <!-- 專案總覽 -->

      <ProjectOverview
  v-if="currentPage === 'overview'"
  :projects="overviewProjects"
  :reports="reports"
  :tasks="tasks"
  @open="openProject"
  @export="exportProjectExcel"
/>

      <!-- 全部專案甘特 -->
      <AllGantt
        v-else-if="currentPage === 'all-gantt'"
        :projects="projects"
        :tasks="tasks"
        :reports="reports"
        @open="openProject"
        @select-task="openGanttTask"
        @export="exportGanttExcel"
      />

      <!-- 甘特模板 -->
      <GanttTemplates
        v-else-if="currentPage === 'templates'"
        :templates="templates"
        @save="saveTemplate"
        @delete="deleteTemplate"
      />

      <!-- 專案詳細 -->
      <ProjectDetail
        ref="projectDetailRef"
        v-else
        :project="selectedProject"
        :tasks="tasks"
        :reports="
          reports.filter(
            (r) => String(r.projectId) === String(selectedProjectId)
          )
        "
        :links="
          links.filter((l) => String(l.projectId) === String(selectedProjectId))
        "
        :templates="templates"
        @back="navigate('overview')"
        @edit-project="editSelectedProject"
        @delete-project="deleteSelectedProject"
        @add-task="addTask"
        @edit-task="editTask"
        @delete-task="deleteTask"
        @add-weekly="addWeekly"
@edit-weekly="editWeekly"
@delete-weekly="deleteWeekly"
        @add-link="addLink"
        @delete-link="deleteLink"
        @apply-template="applyTemplate"
      />
    </main>

    <!-- 專案新增／編輯 -->
    <ProjectFormModal
      :visible="showProjectModal"
      :form="projectForm"
      :editing="editingProject"
      @close="showProjectModal = false"
      @save="
        saveProject({
          form: projectForm,
          editing: editingProject,
        })
      "
    />
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;

  background: var(--pm-bg);
  color: var(--pm-text);
}

.main {
  margin-left: 250px;

  width: calc(100% - 250px);

  min-height: 100vh;
}

@media (max-width: 760px) {
  .main {
    margin-left: 0;
    width: 100%;
  }
}
</style>
