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
  { emojis: "❤️💔", answer: "حب" },
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
  return text
    .toLowerCase()
    .trim()
    .replace(/[إأآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[؟?!！。，,.]/g, "");
}

function getRandomQuestion(used) {
  const available = questions.filter((q) => !used.includes(q.emojis));

  if (!available.length) return null;

  return available[Math.floor(Math.random() * available.length)];
}

module.exports = {
  config: {
    name: "خمن",
    aliases: ["تخمين", "emojigame", "لعبة"],
    version: "2.0",
    author: "shtot",
    category: "game",
    cooldown: 3,
    role: 0,
    noPrefix: false
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;

    if (games.has(threadID)) {
      return api.sendMessage(
        "⚠️ كاينة لعبة خدامة دابا!\nكمّل الجولة الحالية أولاً 🎮",
        threadID
      );
    }

    const question = getRandomQuestion([]);

    if (!question) return;

    games.set(threadID, {
      round: 1,
      score: {},
      current: question,
      used: [question.emojis]
    });

    api.sendMessage(
      `🎮 ━━━ لعبة تخمين الإيموجيات ━━━ 🎮\n\n` +
      `🔢 الجولة: 1 / 10\n` +
      `🏆 كل جواب صحيح = +5 نقاط\n\n` +
      `🤔 خمن الكلمة:\n\n` +
      `${question.emojis}\n\n` +
      `💬 أول واحد يجاوب صحيح يربح الجولة!`,
      threadID
    );
  },

  onChat: async function ({ api, event }) {
    const threadID = event.threadID;
    const game = games.get(threadID);

    if (!game || !event.body) return;

    const answer = normalize(event.body);
    const correct = normalize(game.current.answer);

    if (answer !== correct) return;

    const userID = event.senderID;

    if (!game.score[userID]) {
      game.score[userID] = 0;
    }

    game.score[userID] += 5;

    const name = await global.usersData.getName(userID);

    // آخر جولة
    if (game.round >= 10) {
      const finalScore = game.score[userID];

      games.delete(threadID);

      return api.sendMessage(
        `🎉🎉 مبرووووك ${name}!\n\n` +
        `✅ جاوبتي صح!\n` +
        `💡 الجواب: ${game.current.answer}\n` +
        `⭐ +5 نقاط\n\n` +
        `🏁 انتهت 10 جولات!\n` +
        `🏆 نقاطك: ${finalScore}\n\n` +
        `🔥 شكراً على اللعب مع SHTOT BOT 👑`,
        threadID
      );
    }

    game.round++;

    const nextQuestion = getRandomQuestion(game.used);

    if (!nextQuestion) {
      games.delete(threadID);

      return api.sendMessage(
        `🏁 سالات اللعبة!\n\n⭐ نقاطك: ${game.score[userID]}`,
        threadID
      );
    }

    game.current = nextQuestion;
    game.used.push(nextQuestion.emojis);

    api.sendMessage(
      `🎉 برافو ${name}!\n` +
      `✅ الجواب صحيح: ${game.current.answer === correct ? game.current.answer : ""}\n` +
      `⭐ +5 نقاط\n` +
      `💰 مجموع نقاطك: ${game.score[userID]}\n\n` +
      `━━━━━━━━━━━━━━\n` +
      `🔢 الجولة: ${game.round} / 10\n\n` +
      `🤔 خمن هادي:\n\n` +
      `${nextQuestion.emojis}`,
      threadID
    );
  }
};
