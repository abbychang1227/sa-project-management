# Project Hub｜專案管理系統

Vue 3 + Vite prototype，已依照約定拆分 View / Component / Mock。

## 目錄

src/
- App.vue：狀態協調與頁面切換
- views/：各主要頁面
- components/：可重用 UI 元件
- components/modals/：各功能表單 Modal
- mock/：目前所有假資料
- services/：預留 Supabase 資料服務層

## 目前可操作
- 專案總覽：搜尋、狀態/SA 篩選、點擊進入專案
- 新增／編輯／刪除專案
- 全部專案甘特圖
- 單一專案甘特圖：新增／編輯／刪除工作
- 每週進度：新增週報、Checkbox 多選關聯甘特
- 雲端資料：新增／刪除／開啟連結
- 甘特模板：新增／編輯／刪除
- Excel 匯出入口：目前輸出 CSV，Excel 可直接開啟

目前資料仍為瀏覽器記憶體中的 Mock Data，重新整理會恢復。
下一階段再把 services/ 接到 Supabase。


## v4 UI direction
- Typography uses a consistent 17px body scale with larger section/page headings.
- Palette: muted blue-gray + sage green + warm off-white.
- Homepage summary removes the old "需要注意／有風險" cards; status is 進行中／暫緩 and project notes use 備註.
- Homepage filters include 客戶.
- Weekly progress is newest-first.
- Gantt detail directly lists linked weekly reports.
- Gantt templates are centered on two built-in types: 純軟體專案 and 軟硬體專案.
- Homepage exports a formatted project-control Excel; all-project Gantt exports a separate Gantt Excel.
