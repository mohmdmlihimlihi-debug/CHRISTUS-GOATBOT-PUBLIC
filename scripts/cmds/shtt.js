const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ===============================
// إعدادات البوت
// ===============================

const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "CHANGE_ME";
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN || "CHANGE_ME";

// ===============================
// 50 سؤال
// ===============================

const QUESTIONS = [
  { q: "شنو هي عاصمة المغرب؟", a: "الرباط" },
  { q: "شحال 7 + 8 ؟", a: "15" },
  { q: "شنو هي العملة ديال المغرب؟", a: "الدرهم" },
  { q: "شحال عدد أيام الأسبوع؟", a: "7" },
  { q: "شنو هو أكبر كوكب؟", a: "المشتري" },
  { q: "شحال 9 × 6 ؟", a: "54" },
  { q: "شنو هو البحر اللي كاين شمال المغرب؟", a: "البحر المتوسط" },
  { q: "شنو هو لون العشب؟", a: "أخضر" },
  { q: "شحال 100 ÷ 4 ؟", a: "25" },
  { q: "شنو هو الحيوان المعروف بملك الغابة؟", a: "الأسد" },

  { q: "شحال عدد شهور السنة؟", a: "12" },
  { q: "شنو هي عاصمة فرنسا؟", a: "باريس" },
  { q: "شحال 12 × 5 ؟", a: "60" },
  { q: "شنو هو أقرب كوكب للشمس؟", a: "عطارد" },
  { q: "شنو كيسمى صغير القط؟", a: "هر" },
  { q: "شحال 50 + 25 ؟", a: "75" },
  { q: "شنو هي عاصمة مصر؟", a: "القاهرة" },
  { q: "شنو هو أكبر محيط؟", a: "الهادئ" },
  { q: "شحال 11 × 3 ؟", a: "33" },
  { q: "شنو هو الكوكب الأحمر؟", a: "المريخ" },

  { q: "شنو هو أسرع حيوان بري؟", a: "الفهد" },
  { q: "شحال 90 - 35 ؟", a: "55" },
  { q: "شنو هي عاصمة إسبانيا؟", a: "مدريد" },
  { q: "شنو هو أكبر حيوان فالعالم؟", a: "الحوت الأزرق" },
  { q: "شحال 8 × 8 ؟", a: "64" },
  { q: "شنو هو الغاز اللي كنحتاجو للتنفس؟", a: "الأوكسجين" },
  { q: "شحال عدد الحواس عند الإنسان؟", a: "5" },
  { q: "شنو هي عاصمة إيطاليا؟", a: "روما" },
  { q: "شحال 200 - 75 ؟", a: "125" },
  { q: "شنو هو الحيوان اللي عندو خرطوم؟", a: "الفيل" },

  { q: "شنو هو الشهر اللي كيجي من بعد يناير؟", a: "فبراير" },
  { q: "شحال 15 + 17 ؟", a: "32" },
  { q: "شنو هي عاصمة اليابان؟", a: "طوكيو" },
  { q: "شحال 7 × 7 ؟", a: "49" },
  { q: "شنو هو أكبر عضو فالجسم؟", a: "الجلد" },
  { q: "شنو هي عاصمة الجزائر؟", a: "الجزائر" },
  { q: "شحال 1000 - 250 ؟", a: "750" },
  { q: "شنو هو الحيوان اللي كيعطي الحليب؟", a: "البقرة" },
  { q: "شنو هو النجم اللي كينور الأرض؟", a: "الشمس" },
  { q: "شحال 6 × 9 ؟", a: "54" },

  { q: "شنو هي عاصمة تونس؟", a: "تونس" },
  { q: "شنو هو الجهاز اللي كنستعملو باش نشوفو الوقت؟", a: "ساعة" },
  { q: "شحال 45 + 45 ؟", a: "90" },
  { q: "شنو هو الكوكب اللي عندو حلقات مشهورة؟", a: "زحل" },
  { q: "شنو هو عكس كلمة كبير؟", a: "صغير" },
  { q: "شحال 144 ÷ 12 ؟", a: "12" },
  { q: "شنو هي عاصمة ألمانيا؟", a: "برلين" },
  { q: "شنو هو لون الدم؟", a: "أحمر" },
  { q: "شحال 25 × 4 ؟", a: "100" },
  { q: "شنو هي عاصمة البرتغال؟", a: "لشبونة" }
];

// ===============================
// بيانات اللاعبين
// ===============================

const players = new Map();

// ===============================
// أدوات
// ===============================

function normalize(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[؟?!.,]/g, "");
}

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

function getPlayer(id) {
  if (!players.has(id)) {
    players.set(id, {
      money: 0,
      round: 1,
      questionNumber: 0,
      questions: [],
      currentQuestion: null,
      timer: null,
      answered: false
    });
  }

  return players.get(id);
}

function reward(player) {
  return 40 + ((player.round - 1) * 20);
}

// ===============================
// Messenger Send API
// ===============================

async function sendMessage(senderId, text) {
  await fetch(
    `https://graph.facebook.com/v20.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        recipient: {
          id: senderId
        },
        message: {
          text
        }
      })
    }
  );
}

// ===============================
// بدء جولة
// ===============================

async function startRound(senderId) {
  const player = getPlayer(senderId);

  player.questions = shuffle(QUESTIONS).slice(0, 10);
  player.questionNumber = 0;

  await sendQuestion(senderId);
}

// ===============================
// إرسال السؤال
// ===============================

async function sendQuestion(senderId) {
  const player = getPlayer(senderId);

  if (player.questionNumber >= 10) {
    return endRound(senderId);
  }

  const question = player.questions[player.questionNumber];

  player.currentQuestion = question;
  player.answered = false;

  const number = player.questionNumber + 1;
  const money = player.money;
  const currentReward = reward(player);

  await sendMessage(
    senderId,
    `🎯 السؤال ${number}/10

❓ ${question.q}

⏱️ عندك 10 ثواني!

💰 الرصيد: ${money} درهم
💵 الربح: ${currentReward} درهم`
  );

  clearTimeout(player.timer);

  player.timer = setTimeout(async () => {

    if (player.answered) return;

    player.answered = true;

    await sendMessage(
      senderId,
      `⏰ سالا الوقت!

❌ البوت داز السؤال.

✅ الجواب الصحيح هو:
${question.a}`
    );

    player.questionNumber++;

    setTimeout(() => {
      sendQuestion(senderId);
    }, 1000);

  }, 10000);
}

// ===============================
// معالجة الجواب
// ===============================

async function checkAnswer(senderId, message) {
  const player = getPlayer(senderId);

  if (!player.currentQuestion) {
    await sendMessage(
      senderId,
      "👋 كتب «بدا» باش تبدأ اللعبة!"
    );
    return;
  }

  if (player.answered) {
    return;
  }

  clearTimeout(player.timer);

  player.answered = true;

  const correct = normalize(player.currentQuestion.a);
  const answer = normalize(message);

  if (answer === correct) {

    const money = reward(player);

    player.money += money;

    await sendMessage(
      senderId,
      `🎉👏 جوابك صحيح!

💰 عندك +${money} درهم

💵 الرصيد ديالك دابا:
${player.money} درهم

🔥 واااعر! كمّل هكا!`
    );

  } else {

    await sendMessage(
      senderId,
      `❌ جواب غلط 😅

💡 الجواب الصحيح هو:
${player.currentQuestion.a}

🤖 البوت داز للسؤال التالي!`
    );
  }

  player.questionNumber++;

  setTimeout(() => {
    sendQuestion(senderId);
  }, 1000);
}

// ===============================
// نهاية الجولة
// ===============================

async function endRound(senderId) {

  const player = getPlayer(senderId);

  player.currentQuestion = null;

  await sendMessage(
    senderId,
    `🏁 سالات الجولة ${player.round}!

💰 الربح ديالك:
${player.money} درهم

🏆 دابا نقدروا نديرو الترتيب...`
  );

  await showRanking(senderId);

  player.round++;

  await sendMessage(
    senderId,
    `🔄 واجد للجولة الجديدة؟

كتب:

«عاود»

باش نجيب ليك 10 أسئلة جداد ومخربقين 🔥`
  );
}

// ===============================
// الترتيب
// ===============================

async function showRanking(senderId) {

  const ranking = [];

  for (const [id, player] of players.entries()) {
    ranking.push({
      id,
      money: player.money
    });
  }

  ranking.sort((a, b) => b.money - a.money);

  let text = "🏆 ترتيب اللاعبين\n\n";

  ranking.forEach((player, index) => {

    let medal = "▫️";

    if (index === 0) medal = "🥇";
    if (index === 1) medal = "🥈";
    if (index === 2) medal = "🥉";

    text += `${medal} المركز ${index + 1}: ${player.money} DH`;

    if (index === ranking.length - 1) {
      text += " 😅 منافس ضعيف";
    }

    text += "\n";
  });

  await sendMessage(senderId, text);
}

// ===============================
// Webhook verification
// ===============================

app.get("/webhook", (req, res) => {

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// ===============================
// استقبال رسائل Messenger
// ===============================

app.post("/webhook", async (req, res) => {

  if (req.body.object !== "page") {
    return res.sendStatus(404);
  }

  for (const entry of req.body.entry || []) {

    for (const event of entry.messaging || []) {

      const senderId = event.sender?.id;

      if (!senderId) continue;

      if (!event.message?.text) continue;

      const message = event.message.text.trim();
      const command = normalize(message);

      if (
        command === "بدا" ||
        command === "ابدأ" ||
        command === "start" ||
        command === "ابدأ اللعبة"
      ) {

        await sendMessage(
          senderId,
          `🎮 مرحبا بك فمسابقة الدرهم!

القواعد:

🎯 كل جولة فيها 10 أسئلة
⏱️ عندك 10 ثواني
💰 الجواب الصحيح = +40 درهم
🔥 كل جولة جديدة الربح كيزيد
🏆 فالآخر كيبان الترتيب

واجد؟

🚀 نبدأو!`
        );

        await startRound(senderId);

      } else if (
        command === "عاود" ||
        command === "جولة جديدة"
      ) {

        await startRound(senderId);

      } else if (
        command === "رصيدي" ||
        command === "الرصيد"
      ) {

        const player = getPlayer(senderId);

        await sendMessage(
          senderId,
          `💰 الرصيد ديالك هو:

${player.money} درهم 💵`
        );

      } else {

        await checkAnswer(senderId, message);
      }
    }
  }

  res.sendStatus(200);
});

// ===============================
// تشغيل السيرفر
// ===============================

app.listen(PORT, () => {
  console.log(`🤖 Bot running on port ${PORT}`);
});
