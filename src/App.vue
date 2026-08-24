<script setup>
import { ref, computed } from 'vue';
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
const links = ref(structuredClone(mockLinks));
const templates = ref(structuredClone(mockTemplates));
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

function saveProject(payload) {
  const form = payload.form;

  if (!form.name || !form.name.trim()) {
    alert('請輸入專案名稱');
    return;
  }

  if (payload.editing) {
    const index = projects.value.findIndex(
      (p) => String(p.id) === String(selectedProjectId.value)
    );

    if (index !== -1) {
      projects.value[index] = {
        ...form,
        id: selectedProjectId.value,
        statusType: statusType(form.status),
      };
    }
  } else {
    const id = Math.max(0, ...projects.value.map((p) => Number(p.id) || 0)) + 1;

    projects.value.push({
      ...form,
      id,
      statusType: statusType(form.status),
    });

    selectedProjectId.value = id;
    currentPage.value = 'project';
  }

  showProjectModal.value = false;
}

function deleteSelectedProject() {
  if (!selectedProject.value) return;

  if (!confirm(`確定刪除「${selectedProject.value.name}」？`)) {
    return;
  }

  const id = selectedProjectId.value;

  projects.value = projects.value.filter((p) => String(p.id) !== String(id));

  tasks.value = tasks.value.filter((t) => String(t.projectId) !== String(id));

  reports.value = reports.value.filter(
    (r) => String(r.projectId) !== String(id)
  );

  links.value = links.value.filter((l) => String(l.projectId) !== String(id));

  navigate('overview');
}

// ============================================================
// 甘特項目
// ============================================================

function addTask({ form }) {
  const id = Math.max(0, ...tasks.value.map((t) => Number(t.id) || 0)) + 1;

  tasks.value.push({
    ...form,
    id,
    projectId: selectedProjectId.value,
    status:
      Number(form.progress) >= 100
        ? '已完成'
        : Number(form.progress) > 0
        ? '進行中'
        : '未開始',
  });
}

function editTask({ form, task }) {
  if (!task) return;

  Object.assign(task, form);

  task.status =
    Number(form.progress) >= 100
      ? '已完成'
      : Number(form.progress) > 0
      ? '進行中'
      : '未開始';
}

function deleteTask(task) {
  if (!confirm(`刪除「${task.name}」？`)) return;

  tasks.value = tasks.value.filter((x) => String(x.id) !== String(task.id));
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

function addWeekly(form) {
  const id = Math.max(0, ...reports.value.map((r) => Number(r.id) || 0)) + 1;

  const workId =
    Math.max(
      0,
      ...reports.value
        .flatMap((r) => r.works || [])
        .map((w) => Number(w.id) || 0)
    ) + 1;

  const project = selectedProject.value;

  // ==========================================================
  // 本週工作事項
  // ==========================================================

  const thisWeekWorks = Array.isArray(form.thisWeekWorks)
    ? form.thisWeekWorks
    : [];

  // ==========================================================
  // 上週實際工作事項
  // ==========================================================

  const lastWeekWorks = Array.isArray(form.lastWeekWorks)
    ? form.lastWeekWorks
    : [];

  // ==========================================================
  // 保留舊格式 works
  //
  // 目前系統右側「本週工作」仍然使用 works
  // 所以這裡使用本週工作事項
  // ==========================================================

  const works = thisWeekWorks
    .filter((work) => work && String(work.description || '').trim())
    .map((work, index) => ({
      id: Number(work.id) || workId + index,

      description: String(work.description || '').trim(),

      taskIds: Array.isArray(work.taskIds) ? [...work.taskIds] : [],
    }));

  // ==========================================================
  // 建立週報
  // ==========================================================

  const report = {
    ...form,

    id,

    projectId: selectedProjectId.value,

    // ProjectDetail 已經自動算好
    week: form.week || '',

    startDate: form.startDate || '',

    endDate: form.endDate || '',

    range:
      form.range ||
      (form.startDate && form.endDate
        ? `${form.startDate.replace(/-/g, '/')} ～ ${form.endDate.replace(
            /-/g,
            '/'
          )}`
        : ''),

    // 新版資料
    lastWeekWorks,

    thisWeekWorks,

    // 舊版右側顯示使用
    works,
  };

  reports.value.push(report);

  // ==========================================================
  // 同步更新專案總覽
  // ==========================================================

  if (project) {
    project.lastWeek = form.lastWeekActual || project.lastWeek;

    project.thisWeek = form.thisWeekPlan || project.thisWeek;

    project.todo = form.todo || project.todo;

    project.notes = form.notes || project.notes;
  }
}

// ============================================================
// 編輯既有每週進度
// ============================================================

function editWeekly(form) {
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

  const thisWeekWorks = Array.isArray(form.thisWeekWorks)
    ? form.thisWeekWorks
        .filter((work) => work && String(work.description || '').trim())
        .map((work) => ({
          id: Number(work.id) || Date.now() + Math.random(),
          description: String(work.description || '').trim(),
          taskIds: Array.isArray(work.taskIds) ? [...work.taskIds] : [],
        }))
    : [];

  const lastWeekWorks = Array.isArray(form.lastWeekWorks)
    ? form.lastWeekWorks
        .filter((work) => work && String(work.description || '').trim())
        .map((work) => ({
          id: Number(work.id) || Date.now() + Math.random(),
          description: String(work.description || '').trim(),
          taskIds: Array.isArray(work.taskIds) ? [...work.taskIds] : [],
        }))
    : [];

  const updatedReport = {
    ...oldReport,

    ...form,

    // 保留原本 ID
    id: oldReport.id,

    // 保留專案
    projectId: oldReport.projectId,

    // 日期
    week: form.week || oldReport.week || '',

    startDate: form.startDate || oldReport.startDate || '',

    endDate: form.endDate || oldReport.endDate || '',

    range:
      form.range ||
      (form.startDate && form.endDate
        ? `${form.startDate.replace(/-/g, '/')} ～ ${form.endDate.replace(
            /-/g,
            '/'
          )}`
        : oldReport.range || ''),

    // 新版工作資料
    lastWeekWorks,

    thisWeekWorks,

    // 舊欄位相容
    lastWeekActual: lastWeekWorks.map((work) => work.description).join('\n'),

    thisWeekPlan: thisWeekWorks.map((work) => work.description).join('\n'),

    lastWeekTaskIds: lastWeekWorks.flatMap((work) => work.taskIds || []),

    taskIds: thisWeekWorks.flatMap((work) => work.taskIds || []),

    // 右側舊版資料
    works: thisWeekWorks,
  };

  // ==========================================================
  // 真正修改 reports 裡的那一筆
  // ==========================================================

  reports.value[index] = updatedReport;

  // ==========================================================
  // 同步專案資料
  // ==========================================================

  const projectIndex = projects.value.findIndex(
    (project) => String(project.id) === String(oldReport.projectId)
  );

  if (projectIndex !== -1) {
    projects.value[projectIndex] = {
      ...projects.value[projectIndex],

      lastWeek: updatedReport.lastWeekActual || '',

      thisWeek: updatedReport.thisWeekPlan || '',

      todo: updatedReport.todo || '',

      notes: updatedReport.notes || '',
    };
  }
}

// ============================================================
// 甘特關聯
// ============================================================

function addLink(form) {
  const id = Math.max(0, ...links.value.map((l) => Number(l.id) || 0)) + 1;

  links.value.push({
    ...form,
    id,
    projectId: selectedProjectId.value,
  });
}

function deleteLink(link) {
  if (!confirm(`刪除「${link.name}」？`)) return;

  links.value = links.value.filter((x) => String(x.id) !== String(link.id));
}

// ============================================================
// 甘特模板
// ============================================================

function applyTemplate(template) {
  const base = Math.max(0, ...tasks.value.map((t) => Number(t.id) || 0));

  template.tasks.forEach((name, index) => {
    tasks.value.push({
      id: base + index + 1,
      projectId: selectedProjectId.value,
      name,
      start: '2026-08-11',
      end: '2026-09-30',
      progress: 0,
      status: '未開始',
      description: '',
    });
  });
}

function saveTemplate({ form, editing }) {
  const item = {
    name: form.name,
    description: form.description,
    tasks: form.tasksText
      .split('\n')
      .map((x) => x.trim())
      .filter(Boolean),
  };

  if (editing) {
    const old = templates.value.find((t) => String(t.id) === String(form.id));

    if (old) {
      Object.assign(old, item);
    }
  } else {
    const id =
      Math.max(0, ...templates.value.map((t) => Number(t.id) || 0)) + 1;

    templates.value.push({
      ...item,
      id,
      type: 'custom',
    });
  }
}

function deleteTemplate(template) {
  if (!confirm(`刪除模板「${template.name}」？`)) {
    return;
  }

  templates.value = templates.value.filter(
    (x) => String(x.id) !== String(template.id)
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
// Template
// ============================================================

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
        @save="saveProject"
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
