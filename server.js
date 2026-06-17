const express = require('express');
const line = require('@line/bot-sdk');
const { MongoClient } = require('mongodb');
require('dotenv').config();

// --- 請在這裡修改你們在 LINE 上的名稱 ---
const WIFE_LINE_NAME = '你的名字';      // 👈 請改成老婆的 LINE 名字
const HUSBAND_LINE_NAME = '老公的名字';  // 👈 請改成老公的 LINE 名字
// -------------------------------------

// LINE 機器人基本設定
const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET
};

// 修正後的 LINE Client 初始化寫法
const lineClient = new line.Client(lineConfig);

// MongoDB 連線設定
const mongoUri = process.env.MONGODB_URI;
const dbName = 'pink-budget-db';
let db, billingCollection;

// 初始化連線到 MongoDB
async function connectDB() {
  try {
    const client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db(dbName);
    billingCollection = db.collection('records');
    console.log('✅ 成功連線至 MongoDB 資料庫！');
  } catch (error) {
    console.error('❌ MongoDB 連線失敗:', error);
  }
}
connectDB();

const app = express();

// LINE Webhook 路由
app.post('/webhook', line.middleware(lineConfig), async (req, res) => {
  try {
    const events = req.body.events;
    for (let event of events) {
      if (event.type === 'message' && event.message.type === 'text') {
        await handleTextByBot(event);
      }
    }
    res.status(200).end();
  } catch (err) {
    console.error('Webhook 處理時發生錯誤:', err);
    res.status(500).end();
  }
});

// 核心記帳邏輯
async function handleTextByBot(event) {
  const replyToken = event.replyToken;
  const userText = event.message.text.trim();
  
  // 1. 取得發送訊息的人是誰
  let senderName = '未知使用者';
  try {
    if (event.source.userId) {
      const profile = await lineClient.getProfile(event.source.userId);
      senderName = profile.displayName;
    }
  } catch (e) {
    console.error('無法取得用戶 Profile:', e);
  }

  // 判斷記帳人是老公還是老婆
  let userRole = '';
  if (senderName === WIFE_LINE_NAME) userRole = 'wife';
  if (senderName === HUSBAND_LINE_NAME) userRole = 'husband';

  // 2. 指令：設定本期起始日 (格式: 設定本期 2026/06/10)
  if (userText.startsWith('設定本期')) {
    const dateStr = userText.replace('設定本期', '').trim();
    const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
    
    if (!dateRegex.test(dateStr)) {
      return lineClient.replyMessage(replyToken, { type: 'text', text: '❌ 格式錯誤，請輸入例如：設定本期 2026/06/10' });
    }

    // 寫入或更新資料庫中的本期起始日
    await db.collection('config').updateOne(
      { key: 'period_start' },
      { $set: { value: dateStr } },
      { upsert: true }
    );

    return lineClient.replyMessage(replyToken, { type: 'text', text: `📅 本期起始日已成功設定為：${dateStr}` });
  }

  // 3. 指令：查帳
  if (userText === '查帳') {
    // 取得起始日
    const config = await db.collection('config').findOne({ key: 'period_start' });
    if (!config) {
      return lineClient.replyMessage(replyToken, { type: 'text', text: '💡 尚未設定本期起始日，請先輸入「設定本期 YYYY/MM/DD」' });
    }
    const startDate = config.value;

    // 撈出該起始日之後的所有記帳紀錄
    const records = await billingCollection.find({ date: { $gte: startDate } }).toArray();

    let wifeTotal = 0;
    let husbandTotal = 0;
    let detailText = '';

    records.forEach(r => {
      if (r.role === 'wife') {
        wifeTotal += r.amount;
        detailText += ` [${r.date}] 老婆 支出 $${r.amount} (${r.note || '無備註'})\n`;
      } else if (r.role === 'husband') {
        husbandTotal += r.amount;
        detailText += ` [${r.date}] 老公 支出 $${r.amount} (${r.note || '無備註'})\n`;
      }
    });

    const grandTotal = wifeTotal + husbandTotal;
    const half = grandTotal / 2;
    let settleText = '';

    if (wifeTotal > half) {
      settleText = `👉 老公需給老婆 $${(wifeTotal - half).toFixed(0)} 元`;
    } else if (husbandTotal > half) {
      settleText = `👉 老婆需給老公 $${(husbandTotal - half).toFixed(0)} 元`;
    } else {
      settleText = `👉 雙方持平，不需結帳！`;
    }

    const replyMsg = `📊 【本期帳務統計】(自 ${startDate} 起)\n\n` +
                     `👩 老婆總支出: $${wifeTotal}\n` +
                     `👨 老公總支出: $${husbandTotal}\n` +
                     `💰 總花費: $${grandTotal}\n` +
                     `均分金額: $${half.toFixed(0)}\n` +
                     `-----------------------\n` +
                     `${settleText}\n\n` +
                     `📝 帳務明細：\n${detailText || '目前暫無紀錄'}`;

    return lineClient.replyMessage(replyToken, { type: 'text', text: replyMsg.trim() });
  }

  // 4. 自動記帳邏輯：判斷開頭是不是數字 (例如: 150 午餐)
  const match = userText.match(/^(\d+)(.*)$/);
  if (match) {
    if (!userRole) {
      return lineClient.replyMessage(replyToken, { 
        type: 'text', 
        text: `⚠️ 系統無法識別您的 LINE 名稱「${senderName}」，請檢查 server.js 中的名字設定是否與 LINE 顯示完全一致喔！` 
      });
    }

    const amount = parseInt(match[1], 10);
    const note = match[2].trim();
    const today = new Date().toLocaleDateString('zh-TW', { timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/-/g, '/');

    // 儲存到 MongoDB
    const newRecord = {
      amount: amount,
      note: note || '未分類',
      role: userRole,
      sender: senderName,
      date: today,
      createdAt: new Date()
    };

    await billingCollection.insertOne(newRecord);

    const roleName = userRole === 'wife' ? '👩 老婆' : '👨 老公';
    return lineClient.replyMessage(replyToken, { 
      type: 'text', 
      text: `✅ ${roleName} 已成功記帳！\n💰 金額: $${amount}\n📝 備註: ${note || '無'}\n📅 日期: ${today}` 
    });
  }
}

// 監聽 Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 MongoDB 智慧記帳系統已啟動 Port ${PORT}`);
});
