<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },

  form: {
    type: Object,
    default: () => ({}),
  },

  tasks: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits([
  'close',
  'save',
])


// ============================================================
// 工作事項
// ============================================================

function createWorkItem() {
  return {
    id:
      Date.now() +
      Math.random(),

    description: '',

    taskId: '',
  }
}

function createDefaultWorks() {
  return [
    createWorkItem(),
    createWorkItem(),
    createWorkItem(),
  ]
}


// ============================================================
// 表單
// ============================================================

const form = ref({
  id: null,

  week: '',
  startDate: '',
  endDate: '',
  range: '',

  lastWeekActual: '',
  thisWeekPlan: '',

  lastWeekWorks:
    createDefaultWorks(),

  thisWeekWorks:
    createDefaultWorks(),

  todo: '',
  notes: '',
})


// ============================================================
// 是否編輯
// ============================================================

const isEditing = computed(() => {
  return !!form.value.id
})


// ============================================================
// 舊資料轉換
// ============================================================

function normalizeWorks(
  sourceWorks,
  oldDescription,
  oldTaskIds
) {

  // ----------------------------------------------------------
  // 新格式
  // ----------------------------------------------------------

  if (
    Array.isArray(sourceWorks) &&
    sourceWorks.length > 0
  ) {

    const works =
      sourceWorks.map(work => ({

        id:
          work.id ??
          Date.now() +
            Math.random(),

        description:
          work.description ||
          '',

        taskId:
          work.taskId
            ? String(
                work.taskId
              )
            : (
                Array.isArray(
                  work.taskIds
                ) &&
                work.taskIds.length
                  ? String(
                      work.taskIds[0]
                    )
                  : ''
              ),
      }))


    // 至少保留 3 筆
    while (
      works.length < 3
    ) {

      works.push(
        createWorkItem()
      )

    }

    return works
  }


  // ----------------------------------------------------------
  // 舊格式：只有文字＋taskIds
  // ----------------------------------------------------------

  if (oldDescription) {

    const taskId =
      Array.isArray(
        oldTaskIds
      ) &&
      oldTaskIds.length > 0
        ? String(
            oldTaskIds[0]
          )
        : ''


    return [

      {
        id:
          Date.now() +
          Math.random(),

        description:
          oldDescription,

        taskId,
      },

      createWorkItem(),

      createWorkItem(),
    ]
  }


  return createDefaultWorks()
}


// ============================================================
// 載入表單
// ============================================================

function loadForm(
  source = {}
) {

  form.value = {

    id:
      source.id ??
      null,

    week:
      source.week ||
      '',

    startDate:
      source.startDate ||
      '',

    endDate:
      source.endDate ||
      '',

    range:
      source.range ||
      '',

    lastWeekActual:
      source.lastWeekActual ||
      '',

    thisWeekPlan:
      source.thisWeekPlan ||
      '',


    // --------------------------------------------------------
    // 上週實際
    // --------------------------------------------------------

    lastWeekWorks:
      normalizeWorks(

        source.lastWeekWorks,

        source.lastWeekActual,

        source.lastWeekTaskIds

      ),


    // --------------------------------------------------------
    // 本週預計
    //
    // 新格式：
    // thisWeekWorks
    //
    // 舊格式：
    // works
    // --------------------------------------------------------

    thisWeekWorks:
      normalizeWorks(

        source.thisWeekWorks ||
          source.works,

        source.thisWeekPlan,

        source.taskIds

      ),

    todo:
      source.todo ||
      '',

    notes:
      source.notes ||
      '',
  }
}


// ============================================================
// Modal 開啟
// ============================================================

watch(
  () => props.visible,

  visible => {

    if (visible) {

      loadForm(
        props.form
      )

    }

  },

  {
    immediate: true,
  }
)


// ============================================================
// 外部表單變更
// ============================================================

watch(
  () => props.form,

  source => {

    if (props.visible) {

      loadForm(
        source
      )

    }

  },

  {
    deep: true,
  }
)


// ============================================================
// 工作事項操作
// ============================================================

function addLastWeekWork() {

  form.value.lastWeekWorks.push(
    createWorkItem()
  )

}

function addThisWeekWork() {

  form.value.thisWeekWorks.push(
    createWorkItem()
  )

}


function removeLastWeekWork(index) {

  if (
    form.value.lastWeekWorks.length <= 1
  ) {

    form.value.lastWeekWorks[index] =
      createWorkItem()

    return
  }

  form.value.lastWeekWorks.splice(
    index,
    1
  )

}


function removeThisWeekWork(index) {

  if (
    form.value.thisWeekWorks.length <= 1
  ) {

    form.value.thisWeekWorks[index] =
      createWorkItem()

    return
  }

  form.value.thisWeekWorks.splice(
    index,
    1
  )

}


// ============================================================
// 工作事項清理
// ============================================================

// ============================================================
// 工作事項清理
// ============================================================

function cleanWorks(works = []) {
  return works
    .filter(
      work =>
        work &&
        String(
          work.description || ''
        ).trim()
    )
    .map(work => {

      const rawTaskId =
        work.taskId ??
        ''

      const numericTaskId =
        rawTaskId === ''
          ? null
          : Number(rawTaskId)

      return {
        id:
          work.id ??
          Date.now() +
            Math.random(),

        description:
          String(
            work.description
          ).trim(),

        taskIds:
          Number.isFinite(
            numericTaskId
          )
            ? [numericTaskId]
            : [],
      }
    })
}


// ============================================================
// 儲存
// ============================================================

function save() {

  const lastWeekWorks =
    cleanWorks(
      form.value.lastWeekWorks
    )


  const thisWeekWorks =
    cleanWorks(
      form.value.thisWeekWorks
    )


  const lastWeekText =
    lastWeekWorks

      .map(
        work =>
          work.description
      )

      .join('\n')


  const thisWeekText =
    thisWeekWorks

      .map(
        work =>
          work.description
      )

      .join('\n')


  emit(
    'save',
    {

      ...form.value,

      // ------------------------------------------------------
      // 新版工作事項
      // ------------------------------------------------------

      lastWeekWorks,

      thisWeekWorks,


      // ------------------------------------------------------
      // 舊欄位相容
      // ------------------------------------------------------

      lastWeekActual:
        lastWeekText,

      thisWeekPlan:
        thisWeekText,

      lastWeekTaskIds:
        lastWeekWorks.flatMap(
          work =>
            work.taskIds ||
            []
        ),

      taskIds:
        thisWeekWorks.flatMap(
          work =>
            work.taskIds ||
            []
        ),

      workDescription:
        thisWeekText,
    }
  )

}


// ============================================================
// 關閉
// ============================================================

function close() {
  emit('close')
}
</script>


<template>
  <Teleport to="body">

    <div
      v-if="visible"
      class="modal-mask"
      @click.self="close"
    >

      <section class="modal">

        <!-- ==================================================
             Header
        ================================================== -->

        <div class="modal-header">

          <div>

            <div class="modal-title">
              {{
                isEditing
                  ? '編輯每週進度'
                  : '新增本週進度'
              }}
            </div>

            <div class="modal-subtitle">
              每筆工作事項可獨立選擇是否關聯甘特。
            </div>

          </div>


          <button
            type="button"
            class="close-btn"
            @click="close"
          >
            ×
          </button>

        </div>


        <!-- ==================================================
             Body
        ================================================== -->

        <div class="modal-body">

          <!-- ==================================================
               週次
          ================================================== -->

          <div class="form-grid">

            <label class="field">

              <span>
                週次
              </span>

              <input
                v-model="form.week"
                type="text"
                readonly
              />

            </label>


            <label class="field">

              <span>
                開始日期
              </span>

              <input
                v-model="form.startDate"
                type="date"
                readonly
              />

            </label>


            <label class="field">

              <span>
                結束日期
              </span>

              <input
                v-model="form.endDate"
                type="date"
                readonly
              />

            </label>

          </div>


          <!-- ==================================================
               上週實際
          ================================================== -->

          <section class="work-section">

            <div class="section-header">

              <div>

                <h3>
                  上週實際
                </h3>

                <p>
                  已完成的工作逐筆建立，需要時再選擇關聯甘特。
                </p>

              </div>

            </div>


            <div class="work-list">

              <div
                v-for="(
                  work,
                  index
                ) in form.lastWeekWorks"
                :key="work.id"
                class="work-item"
              >

                <div class="work-number">
                  {{ index + 1 }}
                </div>


                <div class="work-main">

                  <label class="work-label">
                    工作事項
                  </label>

                  <input
                    v-model="
                      work.description
                    "
                    type="text"
                    class="work-input"
                    placeholder="請輸入本項工作事項"
                  />

                </div>


                <div class="work-gantt">

                  <label class="work-label">
                    關聯甘特
                  </label>

                  <select
                    v-model="
                      work.taskId
                    "
                    class="work-select"
                  >

                    <option value="">
                      不關聯甘特
                    </option>

                    <option
                      v-for="task in tasks"
                      :key="task.id"
                      :value="
                        String(task.id)
                      "
                    >
                      {{ task.name }}
                    </option>

                  </select>

                </div>


                <button
                  type="button"
                  class="remove-btn"
                  title="移除"
                  @click="
                    removeLastWeekWork(
                      index
                    )
                  "
                >
                  ×
                </button>

              </div>

            </div>


            <button
              type="button"
              class="add-work-btn"
              @click="
                addLastWeekWork
              "
            >
              ＋ 新增工作事項
            </button>

          </section>


          <!-- ==================================================
               本週預計
          ================================================== -->

          <section class="work-section">

            <div class="section-header">

              <div>

                <h3>
                  本週預計
                </h3>

                <p>
                  每一項工作可以自行決定是否對應甘特。
                </p>

              </div>

            </div>


            <div class="work-list">

              <div
                v-for="(
                  work,
                  index
                ) in form.thisWeekWorks"
                :key="work.id"
                class="work-item"
              >

                <div class="work-number">
                  {{ index + 1 }}
                </div>


                <div class="work-main">

                  <label class="work-label">
                    工作事項
                  </label>

                  <input
                    v-model="
                      work.description
                    "
                    type="text"
                    class="work-input"
                    placeholder="請輸入本週預計工作"
                  />

                </div>


                <div class="work-gantt">

                  <label class="work-label">
                    關聯甘特
                  </label>

                  <select
                    v-model="
                      work.taskId
                    "
                    class="work-select"
                  >

                    <option value="">
                      不關聯甘特
                    </option>

                    <option
                      v-for="task in tasks"
                      :key="task.id"
                      :value="
                        String(task.id)
                      "
                    >
                      {{ task.name }}
                    </option>

                  </select>

                </div>


                <button
                  type="button"
                  class="remove-btn"
                  title="移除"
                  @click="
                    removeThisWeekWork(
                      index
                    )
                  "
                >
                  ×
                </button>

              </div>

            </div>


            <button
              type="button"
              class="add-work-btn"
              @click="
                addThisWeekWork
              "
            >
              ＋ 新增工作事項
            </button>

          </section>


          <!-- ==================================================
               待辦 / 備註
          ================================================== -->

          <div class="form-grid single">

            <label class="field">

              <span>
                待辦
              </span>

              <textarea
                v-model="
                  form.todo
                "
                rows="3"
                placeholder="請輸入後續待辦事項"
              />

            </label>


            <label class="field">

              <span>
                備註
              </span>

              <textarea
                v-model="
                  form.notes
                "
                rows="3"
                placeholder="補充其他需要注意的事項"
              />

            </label>

          </div>

        </div>


        <!-- ==================================================
             Footer
        ================================================== -->

        <div class="modal-footer">

          <button
            type="button"
            class="btn btn-secondary"
            @click="close"
          >
            取消
          </button>


          <button
            type="button"
            class="btn btn-primary"
            @click="save"
          >
            {{
              isEditing
                ? '儲存修改'
                : '儲存本週進度'
            }}
          </button>

        </div>

      </section>

    </div>

  </Teleport>
</template>


<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 1000;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 24px;

  background: rgba(25, 40, 48, 0.42);
}

.modal {
  width: min(1050px, 100%);
  max-height: calc(100vh - 48px);

  display: flex;
  flex-direction: column;

  background: #fff;

  border: 1px solid var(--pm-border);
  border-radius: 15px;

  box-shadow:
    0 20px 50px rgba(25, 40, 48, 0.18);

  overflow: hidden;
}

.modal-header {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: space-between;

  padding: 20px 26px;

  border-bottom: 1px solid var(--pm-border);

  background: #fff;
}

.modal-title {
  color: var(--pm-text);

  font-size: 24px;
  font-weight: 800;
  line-height: 1.3;
}

.modal-subtitle {
  margin-top: 5px;

  color: var(--pm-muted);

  font-size: 15px;
  line-height: 1.5;
}

.close-btn {
  width: 36px;
  height: 36px;

  display: flex;
  align-items: center;
  justify-content: center;

  flex-shrink: 0;

  border: 1px solid var(--pm-border);
  border-radius: 8px;

  background: #fff;
  color: var(--pm-muted);

  font-size: 20px;

  cursor: pointer;
}

.close-btn:hover {
  background: var(--pm-soft);
  color: var(--pm-text);
}

.modal-body {
  flex: 1;

  min-height: 0;

  overflow-y: auto;

  padding: 24px 26px 28px;
}

.form-grid {
  display: grid;

  grid-template-columns:
    0.75fr
    1fr
    1fr;

  gap: 18px;

  margin-bottom: 30px;
}

.form-grid.single {
  grid-template-columns:
    1fr 1fr;

  gap: 20px;

  margin-top: 28px;

  margin-bottom: 0;
}

.field {
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.field > span {
  color: var(--pm-text);

  font-size: 15px;
  font-weight: 700;

  line-height: 1.3;
}

.field input,
.field select,
.field textarea {
  width: 100%;

  box-sizing: border-box;

  border: 1px solid var(--pm-border);
  border-radius: 8px;

  padding: 10px 12px;

  background: #fff;
  color: var(--pm-text);

  font-size: 16px;

  line-height: 1.4;

  outline: none;
}

.field input,
.field select {
  min-height: 43px;
}

.field textarea {
  min-height: 90px;

  resize: vertical;
}

.field input:focus,
.field select:focus,
.field textarea:focus {
  border-color:
    var(--pm-primary);

  box-shadow:
    0 0 0 3px
    rgba(
      68,
      111,
      143,
      0.08
    );
}

.work-section {
  margin-top: 26px;
}

.section-header {
  margin-bottom: 13px;
}

.section-header h3 {
  margin: 0;

  color: var(--pm-text);

  font-size: 20px;
  font-weight: 800;

  line-height: 1.35;
}

.section-header p {
  margin: 5px 0 0;

  color: var(--pm-muted);

  font-size: 14px;

  line-height: 1.5;
}

.work-list {
  display: flex;
  flex-direction: column;

  gap: 12px;
}

.work-item {
  display: grid;

  grid-template-columns:
    34px
    minmax(0, 1fr)
    245px
    34px;

  align-items: center;

  column-gap: 16px;

  min-height: 92px;

  padding: 15px 16px;

  background: #f4f7f8;

  border: 1px solid var(--pm-border);
  border-radius: 10px;
}

.work-number {
  width: 30px;
  height: 30px;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background:
    var(--pm-primary);

  color: #fff;

  font-size: 14px;
  font-weight: 800;
}

.work-main,
.work-gantt {
  min-width: 0;

  display: flex;
  flex-direction: column;

  gap: 7px;
}

.work-label {
  color: var(--pm-muted);

  font-size: 14px;
  font-weight: 700;

  line-height: 1.3;
}

.work-input,
.work-select {
  width: 100%;

  box-sizing: border-box;

  height: 42px;

  border: 1px solid var(--pm-border);
  border-radius: 8px;

  padding: 8px 12px;

  background: #fff;
  color: var(--pm-text);

  font-size: 16px;

  line-height: 1.4;

  outline: none;
}

.work-input::placeholder {
  color: #8a989f;
}

.work-input:focus,
.work-select:focus {
  border-color:
    var(--pm-primary);

  box-shadow:
    0 0 0 3px
    rgba(
      68,
      111,
      143,
      0.08
    );
}

.remove-btn {
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;
  justify-content: center;

  border: 1px solid var(--pm-border);
  border-radius: 7px;

  background: #fff;
  color: #87959b;

  font-size: 18px;

  cursor: pointer;
}

.remove-btn:hover {
  background: #fff7f7;

  border-color:
    var(--pm-danger);

  color:
    var(--pm-danger);
}

.add-work-btn {
  margin-top: 10px;

  border: 1px dashed #8da6b3;
  border-radius: 8px;

  padding: 9px 14px;

  background: #fff;
  color: var(--pm-primary-dark);

  font-size: 15px;
  font-weight: 700;

  cursor: pointer;
}

.add-work-btn:hover {
  background:
    var(--pm-accent-soft);

  border-color:
    var(--pm-primary);
}

.modal-footer {
  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: flex-end;

  gap: 12px;

  padding: 15px 26px;

  border-top: 1px solid var(--pm-border);

  background: #fff;
}

.btn {
  min-height: 42px;

  border-radius: 8px;

  padding: 9px 18px;

  font-size: 15px;
  font-weight: 700;

  cursor: pointer;
}

.btn-secondary {
  border: 1px solid var(--pm-border);

  background: #fff;
  color: var(--pm-text);
}

.btn-secondary:hover {
  background:
    var(--pm-soft);
}

.btn-primary {
  border: 1px solid var(--pm-primary);

  background:
    var(--pm-primary);

  color: #fff;
}

.btn-primary:hover {
  background:
    var(--pm-primary-dark);
}

.modal-body::-webkit-scrollbar {
  width: 8px;
}

.modal-body::-webkit-scrollbar-track {
  background: transparent;
}

.modal-body::-webkit-scrollbar-thumb {
  background: #c5d0d5;
  border-radius: 10px;
}

@media (max-width: 850px) {

  .modal-mask {
    padding: 12px;
  }

  .modal {
    max-height:
      calc(100vh - 24px);
  }

  .modal-header {
    padding: 17px 19px;
  }

  .modal-body {
    padding: 20px 19px 24px;
  }

  .modal-footer {
    padding: 13px 19px;
  }

  .form-grid,
  .form-grid.single {
    grid-template-columns: 1fr;
  }

  .work-item {
    grid-template-columns:
      32px
      minmax(0, 1fr)
      34px;

    row-gap: 12px;

    padding: 14px;
  }

  .work-gantt {
    grid-column: 2 / 3;
  }

  .remove-btn {
    grid-column: 3;
    grid-row: 1;
  }
}
</style>