"use strict";

const games = new Map();

const questions = [
  { emojis: "🍎📱", answer: "ايفون" },
  { emojis: "🍕🧀", answer: "بيتزا" },
  { emojis: "🍔🍟", answer: "برغر" },
  { emojis: "🐱🏠", answer: "قط" },
  { emojis: "🐶🦴", answer: "كلب" },
  { emojis: "🐺🌕", answer: "ذئب" },
  { emojis: "🦁👑", answer: "اسد" },
  { emojis: "🐟🌊", answer: "سمكة" },
  { emojis: "🐝🍯", answer: "عسل" },
  { emojis: "🐔🥚", answer: "دجاجة" },
  { emojis: "🌞🌙", answer: "الشمس والقمر" },
  { emojis: "🌧️☂️", answer: "مطر" },
  { emojis: "❄️⛄", answer: "ثلج" },
  { emojis: "🔥💧", answer: "نار وماء" },
  { emojis: "🌹❤️", answer: "حب" },
  { emojis: "🌳🍃", answer: "شجرة" },
  { emojis: "🌊🏖️", answer: "بحر" },
  { emojis: "🌋🔥", answer: "بركان" },
  { emojis: "🌈☁️", answer: "قوس قزح" },
  { emojis: "🌙⭐", answer: "ليل" },
  { emojis: "🚗💨", answer: "سيارة" },
  { emojis: "✈️🌍", answer: "سفر" },
  { emojis: "🚢🌊", answer: "سفينة" },
  { emojis: "🚲🛣️", answer: "دراجة" },
  { emojis: "🏠❤️", answer: "الوطن" },
  { emojis: "🏫📚", answer: "مدرسة" },
  { emojis: "🏥👨‍⚕️", answer: "مستشفى" },
  { emojis: "🏦💰", answer: "بنك" },
  { emojis: "🏖️☀️", answer: "شاطئ" },
  { emojis: "⚽🥅", answer: "كرة القدم" },
  { emojis: "👑🏰", answer: "ملك" },
  { emojis: "👨‍🍳🍳", answer: "طباخ" },
  { emojis: "👨‍⚕️💉", answer: "طبيب" },
  { emojis: "👨‍🚒🔥", answer: "اطفائي" },
  { emojis: "👮🚓", answer: "شرطي" },
  { emojis: "👨‍🏫📚", answer: "استاذ" },
  { emojis: "🎤🎵", answer: "مغني" },
  { emojis: "🎬🎥", answer: "فيلم" },
  { emojis: "🎮🕹️", answer: "لعبة" },
  { emojis: "📱💬", answer: "هاتف" },
  { emojis: "💰💎", answer: "غنى" },
  { emojis: "😂🤣", answer: "ضحك" },
  { emojis: "😴🛏️", answer: "نوم" },
  { emojis: "🍎🍌🍊", answer: "فواكه" },
  { emojis: "🥛🐄", answer: "حليب" },
  { emojis: "☕🌅", answer: "قهوة" },
  { emojis: "🍰🎂", answer: "كيك" },
  { emojis: "🎁🎉", answer: "هدية" },
  { emojis: "🔑🚪", answer: "مفتاح" }
];

function normalize(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[إأآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/\s+/g, " ")
    .replace(/[؟?!！。，,.]/g, "");
}

function randomQuestion(used) {
  const available = questions.filter(q => !used.includes(q.emojis));

  if (!available.length) return null;

  return available[Math.floor(Math.random() * available.length)];
}

async function sendRound(api, threadID) {
  const game = games.get(threadID);
  if (!game) return;

  const question = randomQuestion(game.used);

  if (!question) {
    return finishGame(api, threadID);
  }

  game.current = question;
  game.used.push(question.emojis);
  game.timer = true;

  api.sendMessage(
    `🎮 ═══ GFFF ═══ 🎮\n\n` +
    `🔢 الجولة: ${game.round}/10\n` +
    `⭐ الصحيح = +5 نقاط\n` +
    `⏱️ عندك 30 ثانية\n\n` +
    `🤔 خمن الكلمة:\n\n` +
    `${question.emojis}\n\n` +
    `💬 جاوب برسالة عادية 👇`,
    threadID
  );

  game.timeout = setTimeout(() => {
    const currentGame = games.get(threadID);
    if (!currentGame) return;

    currentGame.timer = false;

    api.sendMessage(
      `⏰ سالا الوقت!\n\n` +
      `❌ محد جاوبش.\n` +
      `💡 الجواب: ${question.answer}`,
      threadID
    );

    if (currentGame.round >= 10) {
      return finishGame(api, threadID);
    }

    currentGame.round++;

    setTimeout(() => {
      if (games.has(threadID)) {
        sendRound(api, threadID);
      }
    }, 1000);

  }, 30000);
}

async function finishGame(api, threadID) {
  const game = games.get(threadID);
  if (!game) return;

  if (game.timeout) clearTimeout(game.timeout);

  let ranking = Object.entries(game.scores);

  ranking.sort((a, b) => b[1] - a[1]);

  let text = "🏆 ═══ نتيجة GFFF ═══ 🏆\n\n";

  if (!ranking.length) {
    text += "😅 محد ربح حتى نقطة!";
  } else {
    for (let i = 0; i < ranking.length; i++) {
      let [userID, score] = ranking[i];
      let name = userID;

      try {
        name = await global.usersData.getName(userID);
      } catch (e) {}

      text += `${i + 1}. ${name} — ⭐ ${score}\n`;
    }
  }

  text += "\n🎮 سالات اللعبة بعد 10 جولات.";

  games.delete(threadID);

  api.sendMessage(text, threadID);
}

module.exports = {
  config: {
    name: "gfff",
    aliases: ["gff", "تخمين"],
    version: "4.0",
    author: "shtot",
    category: "game",
    cooldown: 3,
    role: 0,
    noPrefix: false
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;

    // أمر الإيقاف
    if (args[0] === "stop" || args[0] === "وقف") {
      const game = games.get(threadID);

      if (!game) {
        return api.sendMessage(
          "⚠️ ما كاينة حتى لعبة خدامة دابا.",
          threadID
        );
      }

      if (game.timeout) clearTimeout(game.timeout);

      games.delete(threadID);

      return api.sendMessage(
        "🛑 تم إيقاف لعبة GFFF بنجاح.",
        threadID
      );
    }

    if (games.has(threadID)) {
      return api.sendMessage(
        "⚠️ كاينة لعبة GFFF خدامة دابا!",
        threadID
      );
    }

    games.set(threadID, {
      round: 1,
      scores: {},
      used: [],
      current: null,
      timer: false,
      timeout: null
    });

    api.sendMessage(
      "🎮🔥 بدات لعبة GFFF!\n\n" +
      "🔢 10 جولات\n" +
      "⭐ كل جواب صحيح = +5 نقاط\n" +
      "⏱️ كل جولة = 30 ثانية\n\n" +
      "🚀 الجولة الأولى جاية...",
      threadID
    );

    setTimeout(() => {
      if (games.has(threadID)) {
        sendRound(api, threadID);
      }
    }, 1500);
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const game = games.get(threadID);

    if (!game || !event.body) return;
    if (!game.timer) return;

    const userAnswer = normalize(event.body);
    const correctAnswer = normalize(game.current.answer);

    if (userAnswer !== correctAnswer) return;

    clearTimeout(game.timeout);
    game.timeout = null;
    game.timer = false;

    const userID = event.senderID;

    if (!game.scores[userID]) {
      game.scores[userID] = 0;
    }

    game.scores[userID] += 5;

    let name = "اللاعب";

    try {
      name = await global.usersData.getName(userID);
    } catch (e) {}

    api.sendMessage(
      `🎉🔥 جواب صحيح!\n\n` +
      `👤 ${name}\n` +
      `💡 الجواب: ${game.current.answer}\n` +
      `⭐ +5 نقاط\n` +
      `🏆 مجموع نقاطك: ${game.scores[userID]}\n\n` +
      `➡️ الجولة القادمة...`,
      threadID
    );

    if (game.round >= 10) {
      return setTimeout(() => {
        finishGame(api, threadID);
      }, 1500);
    }

    game.round++;

    setTimeout(() => {
      if (games.has(threadID)) {
        sendRound(api, threadID);
      }
    }, 1500);
  }
};

الأوامر

- "gfff" → تبدأ اللعبة.
- "gfff stop" → توقف اللعبة فوراً.
- "gfff وقف" → نفس الشيء.
- كل لعبة = 10 جولات.
- كل جواب صحيح = 5 نقاط.
- عدم الإجابة خلال 30 ثانية → ينتقل تلقائياً لتخمين جديد.
