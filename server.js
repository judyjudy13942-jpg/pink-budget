/* 全域重設與鎖定 */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

body {
    /* 夢幻粉紅柔和漸層背景 */
    background: linear-gradient(135deg, #FFE4E1 0%, #FFB6C1 50%, #FFC0CB 100%);1
    background-attachment: fixed;
    height: 100vh;
    width: 100vw;
    overflow: hidden; /* 嚴格禁止全網頁往下捲動 */
    display: flex;
    justify-content: center;
    align-items: center;
}

/* 模擬獨立手機 App 外框 */
.app-shell {
    width: 100%;
    max-width: 414px; /* 標準 iPhone 寬度 */
    height: 100vh;
    display: flex;
    flex-direction: column;
    padding: 16px 16px 74px 16px; /* 為底部導覽列留空間 */
    position: relative;
    box-shadow: 0 0 40px rgba(255, 182, 193, 0.2);
}

/* 夢幻液態玻璃卡片（微調亮度和圓角） */
.glass-panel {
    background: rgba(255, 255, 255, 0.45);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 24px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: 0 8px 32px 0 rgba(255, 182, 193, 0.25);
}

.text-center { text-align: center; }
.bubble-decor { font-size: 20px; margin-bottom: 2px; animation: float 3s ease-in-out infinite; }
.panel-title { font-size: 14px; color: #7a6e71; font-weight: 600; letter-spacing: 1px; }
.total-amount { font-size: 34px; font-weight: 800; color: #ff69b4; text-shadow: 1px 1px 3px rgba(255, 255, 255, 0.8); margin-top: 4px; }
.panel-sub-title { font-size: 14px; color: #666; margin-bottom: 10px; font-weight: bold; }

/* 預算分配區排版優化 */
.budget-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}
.budget-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.3);
    padding: 6px 10px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.4);
}
.budget-item span { font-size: 13px; color: #555; font-weight: 500; }
.budget-item input {
    width: 65px;
    background: transparent;
    border: none;
    outline: none;
    text-align: right;
    font-weight: bold;
    color: #ff1493;
    font-size: 14px;
}

/* 記帳核心區域 */
.keep-panel {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
.input-row { display: flex; gap: 8px; margin-bottom: 8px; }
.input-row input {
    flex: 1;
    border: 1px solid rgba(255, 192, 203, 0.5);
    padding: 10px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    outline: none;
    color: #555;
}
.input-row input:focus { border-color: #ff69b4; background: rgba(255, 255, 255, 0.9); }

/* 12分類橫向滾動泡泡（解決垂直一長串的問題） */
.category-container {
    display: flex;
    gap: 8px;
    overflow-x: auto;
    padding: 6px 2px;
    margin-bottom: 8px;
}
.category-container::-webkit-scrollbar { display: none; } /* 隱藏醜醜的滾動條 */
.cat-btn {
    flex-shrink: 0;
    background: rgba(255, 255, 255, 0.7);
    padding: 8px 14px;
    border-radius: 20px;
    font-size: 13px;
    cursor: pointer;
    border: 1px solid rgba(255, 182, 193, 0.4);
    box-shadow: 0 2px 6px rgba(255, 182, 193, 0.1);
    transition: all 0.2s;
    color: #444;
}
.cat-btn.selected {
    background: linear-gradient(135deg, #ffb6c1, #ff69b4);
    color: white;
    border-color: transparent;
    transform: scale(1.05);
}

.amount-display {
    font-size: 13px;
    font-weight: 600;
    color: #666;
    text-align: right;
    padding: 2px 6px;
    margin-bottom: 6px;
}

/* 虛擬數字鍵盤優化 (3x4 漂亮格線) */
.keyboard {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
}
.key {
    background: rgba(255, 255, 255, 0.7);
    padding: 14px;
    text-align: center;
    border-radius: 16px;
    font-weight: bold;
    color: #555;
    cursor: pointer;
    font-size: 18px;
    border: 1px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
    transition: background 0.1s;
}
.key:active { background: rgba(255, 192, 203, 0.5); }
.backspace { color: #ff69b4; font-size: 20px; }
.submit-btn {
    background: linear-gradient(135deg, #ff99cc, #ff6699);
    color: white;
    font-size: 15px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
}
.submit-btn:active { opacity: 0.9; }

/* 明細頁歷史列表 */
.scrollable-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: 10px;
}
.scrollable-content::-webkit-scrollbar { display: none; }
.record-item {
    margin-bottom: 10px;
    padding: 14px;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.6);
}
.filter-box { display: flex; gap: 8px; }
.filter-box input, .filter-box select {
    flex: 1;
    padding: 10px;
    border: 1px solid rgba(255, 192, 203, 0.4);
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.6);
    outline: none;
    font-size: 14px;
    color: #444;
}

/* 底部導覽列（固定在最下方，不隨頁面捲動） */
.nav-bar {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 58px;
    background: rgba(255, 255, 255, 0.6);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    display: flex;
    border-top: 1px solid rgba(255, 255, 255, 0.5);
    border-bottom-left-radius: 24px;
    border-bottom-right-radius: 24px;
}
.nav-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    color: #a09094;
    font-size: 13px;
    font-weight: bold;
    transition: color 0.2s;
}
.nav-item.active { color: #ff1493; position: relative; }
.nav-item.active::after {
    content: '🌸';
    position: absolute;
    top: 6px;
    font-size: 8px;
}

/* 泡泡漂浮小動畫 */
@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-4px); }
    100% { transform: translateY(0px); }
}
