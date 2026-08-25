<script setup>
import { computed } from 'vue';
const props = defineProps({
  tasks: { type: Array, default: () => [] },
  showActions: Boolean,
});
const emit = defineEmits(['edit', 'delete', 'select']);
const months = computed(() => {

  if (!props.tasks.length) {
    return [];
  }

  const dates = props.tasks
    .flatMap(task => [
      new Date(task.start),
      new Date(task.end),
    ])
    .filter(date => !isNaN(date.getTime()));

  if (!dates.length) {
    return [];
  }

  const minDate = new Date(
    Math.min(...dates.map(date => date.getTime()))
  );

  const maxDate = new Date(
    Math.max(...dates.map(date => date.getTime()))
  );

  // 從最早任務的月份開始
  const start = new Date(
    minDate.getFullYear(),
    minDate.getMonth(),
    1
  );

  // 到最晚任務的月份結束
  const end = new Date(
    maxDate.getFullYear(),
    maxDate.getMonth(),
    1
  );

  const result = [];

  const current = new Date(start);

  while (current <= end) {

    result.push({
      label:
        `${current.getFullYear()}/` +
        `${String(current.getMonth() + 1).padStart(2, '0')}`,

      days: ['01', '10', '20', '30'],
    });

    current.setMonth(
      current.getMonth() + 1
    );
  }

  return result;
});
const units = computed(() =>
  months.value.flatMap((m) =>
    m.days.map((day) => ({
      month: m.label,
      day
    }))
  )
);
const sortedTasks = computed(() => {
  return [...props.tasks].sort((a, b) => {
    return new Date(a.start) - new Date(b.start);
  });
});

function taskStyle(task) {
  const start = new Date(task.start);
  const end = new Date(task.end);

  // 沒有有效日期就不顯示
  if (
    isNaN(start.getTime()) ||
    isNaN(end.getTime()) ||
    !months.value.length
  ) {
    return {
      left: '0%',
      width: '4%',
    };
  }

  // ----------------------------------------------------------
  // 取得目前甘特圖時間軸的起始與結束
  // ----------------------------------------------------------

  const firstMonth =
    months.value[0];

  const lastMonth =
    months.value[months.value.length - 1];

  const [startYear, startMonth] =
    firstMonth.label
      .split('/')
      .map(Number);

  const [endYear, endMonth] =
    lastMonth.label
      .split('/')
      .map(Number);

  const timelineStart =
    new Date(
      startYear,
      startMonth - 1,
      1
    ).getTime();

  // 最後一個月份的月底
  const timelineEnd =
    new Date(
      endYear,
      endMonth,
      0,
      23,
      59,
      59,
      999
    ).getTime();


  // ----------------------------------------------------------
  // 計算甘特條位置
  // ----------------------------------------------------------

  const total =
    timelineEnd -
    timelineStart;

  const startPosition =
    ((start.getTime() - timelineStart) / total) * 100;

  const endPosition =
    ((end.getTime() - timelineStart) / total) * 100;


  // ----------------------------------------------------------
  // 限制在 0～100%
  // ----------------------------------------------------------

  const clamp = (
    value,
    min,
    max
  ) =>
    Math.min(
      max,
      Math.max(
        min,
        value
      )
    );


  const left =
    clamp(
      startPosition,
      0,
      100
    );

  const right =
    clamp(
      endPosition,
      0,
      100
    );


  return {
    left: `${left}%`,
    width: `${Math.max(4, right - left)}%`,
  };
}
</script>
<template>
  <div class="gantt-card">
    <div class="gantt-scroll">
      <div class="timeline-header">
        <div class="timeline-label">工作項目</div>
        <div class="timeline-scale" :style="{
          width: `${months.length * 218}px`
        }">
          <div v-for="month in months" :key="month.label" class="month-group">
            <div class="month-title">{{ month.label }}</div>
            <div class="day-row">
              <span v-for="day in month.days" :key="day">{{ day }}</span>
            </div>
          </div>
        </div>
      </div>
      <div v-for="task in sortedTasks" :key="task.id" class="gantt-row" @click="emit('select', task)">
        <div class="task-name">
          <strong>{{ task.name }}</strong><small>{{ task.start }} ～ {{ task.end }}</small>
        </div>
        <div class="timeline" :style="{
          width: `${months.length * 218}px`
        }">
          <div class="month-grid">
            <span v-for="unit in units" :key="unit.month + unit.day"></span>
          </div>
          <div class="task-bar" :style="taskStyle(task)">
            <span>{{ task.progress }}%</span>
          </div>
        </div>
        <div v-if="showActions" class="row-actions" @click.stop>
          <button @click="emit('edit', task)">編輯</button><button class="delete"
            @click="emit('delete', task)">刪除</button>
        </div>
      </div>
    </div>
    <div class="gantt-hint">點擊甘特項目可查看工作說明、進度與關聯週報。</div>
  </div>
</template>
<style scoped>

.gantt-card {
  background: #fff;

  border: 1px solid var(--pm-border);

  border-radius: 14px;

  overflow: hidden;
}


/* ==========================================================
   甘特圖水平捲動區
========================================================== */

.gantt-scroll {
  width: 100%;

  overflow-x: auto;
  overflow-y: hidden;
}


/* ==========================================================
   上方時間軸標題
========================================================== */

.timeline-header {
  display: grid;

  grid-template-columns:
    310px
    max-content;

  width: max-content;

  min-width: 100%;

  border-bottom:
    1px solid var(--pm-border);

  background:
    var(--pm-soft);
}


/* 左側「工作項目」 */

.timeline-label {
  width: 310px;

  box-sizing: border-box;

  padding:
    14px 18px;

  font-size: 19px;

  font-weight: 800;

  color:
    var(--pm-text);

  border-right:
    2px solid #c8d6d4;
}


/* ==========================================================
   月份區
========================================================== */

.timeline-scale {
  display: grid;

  grid-auto-flow: column;

  grid-auto-columns: 218px;

  width: max-content;
}


/* 每一個月份固定 218px */

.month-group {
  width: 218px;

  min-width: 218px;

  box-sizing: border-box;

  border-right:
    2px solid #c8d6d4;
}


/* 月份名稱 */

.month-title {
  width: 100%;

  box-sizing: border-box;

  padding: 10px;

  text-align: center;

  font-size: 18px;

  font-weight: 800;

  color:
    var(--pm-primary-dark);

  border-bottom:
    1px solid var(--pm-border);

  background:
    #eaf0ef;
}


/* ==========================================================
   每個月份底下的 01 / 10 / 20 / 30
========================================================== */

.day-row {
  display: grid;

  grid-template-columns:
    repeat(4, 1fr);

  width: 100%;
}


.day-row span {
  box-sizing: border-box;

  padding:
    8px 4px;

  text-align: center;

  font-size: 16px;

  color:
    var(--pm-muted);

  border-left:
    1px solid var(--pm-border);
}


.day-row span:first-child {
  border-left: 0;
}


/* ==========================================================
   每一筆甘特工作
========================================================== */

.gantt-row {
  display: grid;

  grid-template-columns:
    310px
    max-content;

  width: max-content;

  min-width: 100%;

  min-height: 70px;

  align-items: center;

  position: relative;

  cursor: pointer;

  border-bottom:
    1px solid #edf1f1;
}


.gantt-row:hover {
  background:
    #f7faf9;
}


/* ==========================================================
   左側工作名稱
========================================================== */

.task-name {
  width: 310px;

  box-sizing: border-box;

  padding:
    10px 18px;

  display: flex;

  flex-direction: column;

  gap: 4px;

  border-right:
    2px solid #c8d6d4;
}


.task-name strong {
  color:
    var(--pm-text);

  font-size: 18px;
}


.task-name small {
  color:
    var(--pm-muted);

  font-size: 15px;
}


/* ==========================================================
   右側時間軸
========================================================== */

.timeline {
  position: relative;

  height: 34px;

  overflow: hidden;

  box-sizing: border-box;
}


/* ==========================================================
   ★★★ 這裡是這次真正修正的地方 ★★★

   不再寫死 repeat(20, 1fr)

   每一個刻度固定 54.5px

   218px / 4 = 54.5px

   所以：
   01 | 10 | 20 | 30
   每格都會跟上面的月份完全對齊
========================================================== */

.month-grid {
  position: absolute;

  inset: 0;

  display: grid;

  grid-auto-flow: column;

  grid-auto-columns:
    54.5px;

  width: max-content;

  height: 100%;
}


/* 一般日期刻度 */

.month-grid span {
  box-sizing: border-box;

  border-left:
    1px solid #e4eceb;
}


/* 每個月份的第一格 → 月份分界線 */

.month-grid span:nth-child(4n + 1) {
  border-left:
    2px solid #c8d6d4;
}


/* ==========================================================
   甘特條
========================================================== */

.task-bar {
  position: absolute;

  top: 4px;

  height: 26px;

  min-width: 48px;

  border-radius: 7px;

  background:
    var(--pm-primary);

  color: #fff;

  display: flex;

  align-items: center;

  justify-content: center;

  padding:
    0 9px;

  font-size: 16px;

  font-weight: 700;

  z-index: 2;

  box-shadow:
    0 2px 5px
    rgba(
      63,
      97,
      114,
      0.16
    );
}


/* 甘特條底部黃色線 */

.task-bar::after {
  content: '';

  position: absolute;

  left: 0;

  bottom: 0;

  height: 4px;

  width: 100%;

  background:
    var(--pm-accent);

  border-radius:
    0 0 7px 7px;
}


/* ==========================================================
   編輯 / 刪除按鈕
========================================================== */

.row-actions {
  position: absolute;

  right: 10px;

  top: 20px;

  display: flex;

  gap: 5px;

  background: #fff;

  padding: 4px;

  border:
    1px solid var(--pm-border);

  border-radius: 8px;

  z-index: 4;
}


.row-actions button {
  border: 0;

  background:
    var(--pm-soft);

  border-radius: 6px;

  padding:
    7px 9px;

  cursor: pointer;

  font-size: 15px;
}


.row-actions .delete {
  color:
    #b45e5e;
}


/* ==========================================================
   底部提示
========================================================== */

.gantt-hint {
  padding:
    12px 18px;

  color:
    var(--pm-muted);

  font-size: 16px;

  background:
    #fbfcfb;
}

</style>