* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
}

body {
    background: linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 50%, #FFC0CB 100%);
    height: 100vh;
    width: 100vw;
    overflow: hidden; /* 徹底封鎖全域捲動 */
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    display: flex;
    justify-content: center;
}

.app-shell {
    width: 100%;
    max-width: 430px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 16px 16px 80px 16px; /* 保留底部導覽列空間 */
    position: relative;
}

/* 液態玻璃擬態卡片 */
.glass-panel {
    background: rgba(255, 255, 255, 0.35);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.5);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 8px 32px 0 rgba(255, 182, 193, 0.3);
}

.text-center { text-align: center; }
.panel-title { font-size: 14px; color: #666; font-weight: 600; margin-bottom: 4px; }
.total-amount { font-size: 32px; font-weight: 800; color: #fff; text-shadow: 1px 1px 5px rgba(219,112,147,0.5); }

/* 預算區域格子 */
.budget-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-top: 8px; }
.budget-item { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: #444; }
.budget-item input { width: 75px; background: rgba(255,255,255,0.5); border: none; border-radius: 8px; padding: 4px; text-align: right; font-weight: bold; color: #ff1493; }

/* 記帳板塊 */
.keep-panel { flex: 1; display: flex; flex-direction: column; justify-content: space-between; }
.input-row { display: flex; gap: 8px; }
.input-row input { flex: 1; border: none; padding: 8px; border-radius: 12px; background: rgba(255,255,255,0.5); font-size: 14px; }

/* 12分類滾動區 */
.category-container { display: flex; gap: 8px; overflow-x: auto; padding: 8px 0; margin: 4px 0; }
.category-container::-webkit-scrollbar { display: none; }
.cat-btn { shrink: 0; flex-shrink: 0; background: rgba(255,255,255,0.6); padding: 6px 12px; border-radius: 20px; font-size: 13px; cursor: pointer; border: 1px solid rgba(255,182,193,0.5); }

.amount-display { font-size: 14px; font-weight: bold; color: #555; text-align: right; padding: 4px; }

/* 虛擬鍵盤 */
.keyboard { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-top: 4px; }
.key { background: rgba(255, 255, 255, 0.5); padding: 12px; text-align: center; border-radius: 12px; font-weight: bold; color: #555; cursor: pointer; font-size: 16px; }
.key:active { background: rgba(255, 192, 203, 0.6); }
.backspace { color: #ff69b4; }
.submit-btn { background: linear-gradient(135deg, #ffb6c1, #ff69b4); color: white; grid-column: span 1; font-size: 14px; display: flex; align-items: center; justify-content: center; }

/* 明細頁專用滾動 */
.scrollable-content { flex: 1; overflow-y: auto; padding-bottom: 20px; }
.record-item { margin-bottom: 8px; padding: 12px; border-radius: 16px; background: rgba(255,255,255,0.5); }
.filter-box { display: flex; gap: 8px; }
.filter-box input, .filter-box select { flex: 1; padding: 8px; border: none; border-radius: 12px; background: rgba(255,255,255,0.5); }

/* 底部導覽列 */
.nav-bar { position: absolute; bottom: 0; left: 0; right: 0; height: 60px; background: rgba(255,255,255,0.4); backdrop-filter: blur(10px); display: flex; border-top: 1px solid rgba(255,255,255,0.4); }
.nav-item { flex: 1; display: flex; align-items: center; justify-content: center; text-decoration: none; color: #888; font-size: 14px; font-weight: bold; }
.nav-item.active { color: #ff1493; }
