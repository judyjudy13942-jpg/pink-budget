const express = require('express');
const line = require('@line/bot-sdk');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const app = express();

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const lineClient = new line.getClient(lineConfig);
const mongoUri = process.env.MONGODB_URI || "你的MongoDB連接字串";
const client = new MongoClient(mongoUri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("romantic_ledger");
  }
  return db;
}

const WIFE_LINE_NAME = "庭庭庭";   
const HUSBAND_LINE_NAME = "🍉"; 

// 📅 從 MongoDB 讀取手動設定的自訂日期區間
async function getCustomBillingRange(expensesCollection) {
  const database = await connectDB();
  const settingsCollection = database.collection("settings");
  
  // 撈出最新的一筆日期設定
  const latestSetting = await settingsCollection.find().sort({ set_at: -1 }).limit(1).next();
  
  const now = new Date();
  
  // 如果資料庫完全沒有設定過，給予一個預設值（當月 10 號）
  if (!latestSetting) {
    const year = now.getFullYear();
    const month = now.getMonth();
    const startDate = new Date(year, month, 10, 0, 0, 0);
    const endDate = new Date(year, month + 1, 9, 23, 59, 59);
    return { startDate, endDate };
  }

  // 讀取使用者設定的本期開始日
  const startDate = new Date(latestSetting.start_date);
  
  // 自動將結束日推算到「下個月開始日的前一天」
  // 舉例：輸入 6/9，結束日就是 7/8 23:59:59
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate() - 1, 23, 59, 59);

  return { startDate, endDate };
}

app.use(express.json());

app.post('/webhook', line.middleware(lineConfig), (req, res) => {
  Promise.all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

async function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') return null;

  const userMessage = event.message.text.trim();
  const args = userMessage.split(/\s+/);
  const database = await connectDB();
  const expensesCollection = database.collection("expenses");
  const settingsCollection = database.collection("settings");

  // ----------------------------------------------------
  // 新增功能：一個月手動設定一次日期區間
  // 指令範例：設定本期 2026/06/09 或是 設定本期 2026-06-08
  // ----------------------------------------------------
  if (args[0] === "設定本期" && args[1]) {
    const dateStr = args[1].replace(/\//g, '-'); // 把斜線換成橫線
    const targetDate = new Date(dateStr);

    if (isNaN(targetDate.getTime())) {
      return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ 日期格式不正確，請輸入例如：設定本期 2026/06/09` });
    }

    // 設定時間為當天的 00:00:00
    targetDate.setHours(0, 0, 0, 0);

    try {
      // 存入設定表
      await settingsCollection.insertOne({
        start_date: targetDate,
        set_at: new Date()
      });

      const nextMonthDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, targetDate.getDate() - 1);
      
      const formatDate = (d) => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;

      return lineClient.replyMessage(event.replyToken, { 
        type: 'text', 
        text: `📅 記帳週期設定成功！\n━━━━━━━━━━━━━━\n 本期區間已鎖定為：\n👉 ${formatDate(targetDate)} ~ ${formatDate(nextMonthDate)}` 
      });
    } catch (err) {
      console.error(err);
      return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ 設定失敗：${err.message}` });
    }
  }

  // ----------------------------------------------------
  // 功能：自動辨識官方帳號的「罰款」通知
  // ----------------------------------------------------
  if (userMessage.includes("入帳") && (userMessage.includes("20元") || userMessage.includes("20"))) {
    try {
      await expensesCollection.insertOne({
        title: "公帳小罰款", amount: 20, payer: "西瓜",
        category: "罰款", need_type: "需要", is_reimburse: false, is_settled: false, created_at: new Date()
      });
      return lineClient.replyMessage(event.replyToken, { type: 'text', text: `👊 偵測到通知！已自動記入公帳小罰款 $20` });
    } catch (err) { console.error(err); }
  }

  // ----------------------------------------------------
  // 功能：隨時查帳功能 (改為撈取手動設定的日期區間)
  // ----------------------------------------------------
  if (userMessage === "查帳" || userMessage === "帳目") {
    try {
      // 核心改動：改抓資料庫設定的自訂區間
      const { startDate, endDate } = await getCustomBillingRange(expensesCollection);

      const query = {
        is_settled: false,
        created_at: { $gte: startDate, $lte: endDate }
      };
      const expenses = await expensesCollection.find(query).toArray();

      let total = 0;
      let wifeTotal = 0;
      let husbandTotal = 0;
      let wifeReimburseList = [];
      let husbandReimburseList = [];

      expenses.forEach(item => {
        total += item.amount;
        if (item.payer === "小精靈") {
          wifeTotal += item.amount;
          if (item.is_reimburse) wifeReimburseList.push(item.amount);
        } else if (item.payer === "西瓜") {
          husbandTotal += item.amount;
          if (item.is_reimburse) husbandReimburseList.push(item.amount);
        }
      });

      const formatReimburse = (list) => {
        if (list.length === 0) return "$0";
        const sum = list.reduce((a, b) => a + b, 0);
        if (list.length === 1) return `$${list[0]}`;
        return `${list.join(' + ')} = $${sum}`;
      };

      const formatDateStr = (d) => `${d.getFullYear()}/${d.getMonth()+1}/${d.getDate()}`;

      const replyText = `📊 本期本本帳目 (${formatDateStr(startDate)} ~ ${formatDateStr(endDate)})\n━━━━━━━━━━━━━━\n` +
                        `💰 當期花費總計：$${Math.round(total).toLocaleString()}\n\n` +
                        `👤 小精靈 累計花費：$${Math.round(wifeTotal).toLocaleString()}\n` +
                        `💸 小精靈 待請款：\n   👉 ${formatReimburse(wifeReimburseList)}\n\n` +
                        `👤 西瓜 累計花費：$${Math.round(husbandTotal).toLocaleString()}\n` +
                        `💸 西瓜 待請款：\n   👉 ${formatReimburse(husbandReimburseList)}`;

      return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyText });
    } catch (err) {
      console.error(err);
      return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ 查帳失敗：${err.message}` });
    }
  }

  // ----------------------------------------------------
  // 原有功能：日常極簡記帳
  // ----------------------------------------------------
  if (args.length >= 2) {
    const title = args[0];       
    const amountVal = args[1];   
    const amount = parseFloat(amountVal);
    if (isNaN(amount)) return null; 

    let senderName = "";
    try {
      if (event.source.groupId) {
        const member = await lineClient.getGroupMemberProfile(event.source.groupId, event.source.userId);
        senderName = member.displayName;
      } else {
        const profile = await lineClient.getProfile(event.source.userId);
        senderName = profile.displayName;
      }
    } catch (e) { console.error(e); }

    let payer = "其他";
    if (senderName === WIFE_LINE_NAME) payer = "小精靈";
    if (senderName === HUSBAND_LINE_NAME) payer = "西瓜";

    if (userMessage.includes("小精靈") || userMessage.includes("老婆")) payer = "小精靈";
    else if (userMessage.includes("西瓜") || userMessage.includes("老公")) payer = "西瓜";

    const is_reimburse = userMessage.includes("待請款") || userMessage.includes("請款");

    try {
      await expensesCollection.insertOne({
        title, amount, payer,
        category: "其他", need_type: "需要", is_reimburse, is_settled: false,
        created_at: new Date() 
      });

      let replyText = `✅ 已存入本本\n━━━━━━━━━━━━━━\n👤 付款人：${payer}\n📌 項目：${title}\n💵 金額：$${amount.toLocaleString()}`;
      if (is_reimburse) replyText += `\n💸 狀態：【⚠️ 待請款】`;

      if (amount > 3000) {
        replyText += `\n\n🚨 📢 【⚠️ 注意！這筆消費金額大於 $3,000 元，請確認是否要剁手手！】`;
      }

      return lineClient.replyMessage(event.replyToken, { type: 'text', text: replyText });
    } catch (err) {
      return lineClient.replyMessage(event.replyToken, { type: 'text', text: `❌ 存入失敗：${err.message}` });
    }
  }

  return null;
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`彈性自訂會計期系統運行中 Port ${PORT}`));
