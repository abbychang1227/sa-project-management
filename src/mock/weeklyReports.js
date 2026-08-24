export const weeklyReports = [
  {
    id: 1,
    projectId: 1,
    week: 'W32',
    range: '2026/08/03 ～ 2026/08/07',

    lastWeekActual: '完成 API 串接測試、設備資料確認。',
    thisWeekPlan: '進行 UI 調整與系統整合測試。',
    todo: '確認客戶測試資料。',
    notes: '目前無重大備註。',

    // 上週實際
    lastWeekWorks: [
      {
        id: 1,
        description: '完成 API 串接測試',
        taskIds: [5],
      },
      {
        id: 2,
        description: '確認設備資料與畫面欄位',
        taskIds: [3, 5],
      },
    ],

    // 本週預計
    thisWeekWorks: [
      {
        id: 3,
        description: '進行 UI 調整',
        taskIds: [4],
      },
      {
        id: 4,
        description: '進行系統整合測試',
        taskIds: [7],
      },
    ],

    // 保留舊格式，避免其他地方還有使用
    works: [
      {
        id: 3,
        description: '進行 UI 調整',
        taskIds: [4],
      },
      {
        id: 4,
        description: '進行系統整合測試',
        taskIds: [7],
      },
    ],
  },

  {
    id: 2,
    projectId: 1,
    week: 'W33',
    range: '2026/08/10 ～ 2026/08/14',

    lastWeekActual: '完成 API 串接測試與設備資料確認。',
    thisWeekPlan: '進行 UI 調整、系統整合測試準備。',
    todo: '確認客戶測試資料。',
    notes: '客戶測試資料尚未完全提供。',

    // 上週實際
    lastWeekWorks: [
      {
        id: 5,
        description: '完成 API 串接測試與設備資料確認',
        taskIds: [],
      },
    ],

    // 本週預計
    thisWeekWorks: [
      {
        id: 6,
        description: 'UI 畫面調整',
        taskIds: [4],
      },
      {
        id: 7,
        description: '系統整合測試準備',
        taskIds: [7],
      },
    ],

    // 保留舊格式
    works: [
      {
        id: 6,
        description: 'UI 畫面調整',
        taskIds: [4],
      },
      {
        id: 7,
        description: '系統整合測試準備',
        taskIds: [7],
      },
    ],
  },
]