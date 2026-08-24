<script setup>
import { computed } from 'vue';
const props = defineProps({
  tasks: { type: Array, default: () => [] },
  showActions: Boolean,
});
const emit = defineEmits(['edit', 'delete', 'select']);
const months = [
  { label: '2026/06', days: ['01', '10', '20', '30'] },
  { label: '2026/07', days: ['01', '10', '20', '30'] },
  { label: '2026/08', days: ['01', '10', '20', '30'] },
  { label: '2026/09', days: ['01', '10', '20', '30'] },
  { label: '2026/10', days: ['01', '10', '20', '30'] },
];
const units = computed(() =>
  months.flatMap((m) => m.days.map((day) => ({ month: m.label, day })))
);
function taskStyle(task) {
  const start = new Date(task.start);
  const end = new Date(task.end);
  const timelineStart = new Date('2026-06-01').getTime();
  const timelineEnd = new Date('2026-10-30').getTime();
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const left = clamp(
    ((start.getTime() - timelineStart) / (timelineEnd - timelineStart)) * 100,
    0,
    94
  );
  const right = clamp(
    ((end.getTime() - timelineStart) / (timelineEnd - timelineStart)) * 100,
    4,
    100
  );
  return { left: `${left}%`, width: `${Math.max(4, right - left)}%` };
}
</script>
<template>
  <div class="gantt-card">
    <div class="gantt-scroll">
      <div class="timeline-header">
        <div class="timeline-label">工作項目</div>
        <div class="timeline-scale">
          <div v-for="month in months" :key="month.label" class="month-group">
            <div class="month-title">{{ month.label }}</div>
            <div class="day-row">
              <span v-for="day in month.days" :key="day">{{ day }}</span>
            </div>
          </div>
        </div>
      </div>
      <div
        v-for="task in tasks"
        :key="task.id"
        class="gantt-row"
        @click="emit('select', task)"
      >
        <div class="task-name">
          <strong>{{ task.name }}</strong
          ><small>{{ task.start }} ～ {{ task.end }}</small>
        </div>
        <div class="timeline">
          <div class="month-grid">
            <span v-for="unit in units" :key="unit.month + unit.day"></span>
          </div>
          <div class="task-bar" :style="taskStyle(task)">
            <span>{{ task.progress }}%</span>
          </div>
        </div>
        <div v-if="showActions" class="row-actions" @click.stop>
          <button @click="emit('edit', task)">編輯</button
          ><button class="delete" @click="emit('delete', task)">刪除</button>
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
.gantt-scroll {
  min-width: 1400px;
  overflow-x: auto;
}
.timeline-header {
  display: grid;
  grid-template-columns: 310px 1fr;
  border-bottom: 1px solid var(--pm-border);
  background: var(--pm-soft);
}
.timeline-label {
  padding: 14px 18px;
  font-size: 19px;
  font-weight: 800;
  color: var(--pm-text);
  border-right: 2px solid #c8d6d4;
}
.timeline-scale {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
}
.month-group {
  border-right: 2px solid #c8d6d4;
  min-width: 218px;
}
.month-title {
  padding: 10px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
  color: var(--pm-primary-dark);
  border-bottom: 1px solid var(--pm-border);
  background: #eaf0ef;
}
.day-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
}
.day-row span {
  padding: 8px 4px;
  text-align: center;
  font-size: 16px;
  color: var(--pm-muted);
  border-left: 1px solid var(--pm-border);
}
.day-row span:first-child {
  border-left: 0;
}
.gantt-row {
  display: grid;
  grid-template-columns: 310px 1fr;
  min-height: 70px;
  align-items: center;
  position: relative;
  cursor: pointer;
  border-bottom: 1px solid #edf1f1;
}
.gantt-row:hover {
  background: #f7faf9;
}
.task-name {
  padding: 10px 18px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-right: 2px solid #c8d6d4;
}
.task-name strong {
  color: var(--pm-text);
  font-size: 18px;
}
.task-name small {
  color: var(--pm-muted);
  font-size: 15px;
}
.timeline {
  position: relative;
  height: 34px;
  overflow: hidden;
}
.month-grid {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(20, 1fr);
}
.month-grid span {
  border-left: 1px solid #e4eceb;
}
.month-grid span:nth-child(4n + 1) {
  border-left: 2px solid #c8d6d4;
}
.task-bar {
  position: absolute;
  top: 4px;
  height: 26px;
  min-width: 48px;
  border-radius: 7px;
  background: var(--pm-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 9px;
  font-size: 16px;
  font-weight: 700;
  z-index: 2;
  box-shadow: 0 2px 5px rgba(63, 97, 114, 0.16);
}
.task-bar::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 4px;
  width: 100%;
  background: var(--pm-accent);
  border-radius: 0 0 7px 7px;
}
.row-actions {
  position: absolute;
  right: 10px;
  top: 20px;
  display: flex;
  gap: 5px;
  background: #fff;
  padding: 4px;
  border: 1px solid var(--pm-border);
  border-radius: 8px;
  z-index: 4;
}
.row-actions button {
  border: 0;
  background: var(--pm-soft);
  border-radius: 6px;
  padding: 7px 9px;
  cursor: pointer;
  font-size: 15px;
}
.row-actions .delete {
  color: #b45e5e;
}
.gantt-hint {
  padding: 12px 18px;
  color: var(--pm-muted);
  font-size: 16px;
  background: #fbfcfb;
}
</style>
