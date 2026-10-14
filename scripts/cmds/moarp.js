const warnings = new Map();

module.exports.config = {
  name: "مراقبة",
  version: "1.0.0",
  role: 0,
  author: "shtot",
  usePrefix: true,
  description: {
    en: "Monitor offensive words and issue warnings"
  },
  category: "group",
  guide: {
    en: "{pn} تفعيل/تعطيل"
  },
  countDown: 3
};

// الكلمات الممنوعة
const badWords = [
  "زبي",
  "القلاي",
  "طبون",
  "مك",
  "مڪ",
  "نحويڪ",
  "القح.بة",
  "ز.بي",
  "ال٩حبة",
  "القلاوي",
  "ز/بي",
  "طبو/ن",
  "ترمة",
  "ترمتڪ",
  "سوا",
  "ترما",
  "كرك",
  "ڪرك",
  "ڪرڪ",
  "قحبه",
  "نيك",
  "القحبة",
  "كف",
  "زب"
];

if (!global.mora9abaGroups) {
  global.mora9abaGroups = new Set();
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[ىي]/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[ڪک]/g, "ك")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[\s./\\_-]+/g, "");
}

const normalizedWords = badWords.map(normalize);

function containsBadWord(text) {
  const cleanText = normalize(text);

  return normalizedWords.some(word =>
    word && cleanText.includes(word)
  );
}

module.exports.onStart = async ({ api, event, args }) => {
  const threadID = event.threadID;
  const action = (args[0] || "").toLowerCase();

  if (["تفعيل", "on"].includes(action)) {
    global.mora9abaGroups.add(threadID);

    return api.sendMessage(
      "✅ تم تفعيل مراقبة الكلمات المسيئة.\n" +
      "👥 المراقبة تشمل جميع الأعضاء.",
      threadID,
      undefined,
      event.messageID
    );
  }

  if (["تعطيل", "off"].includes(action)) {
    global.mora9abaGroups.delete(threadID);

    return api.sendMessage(
      "⛔ تم تعطيل مراقبة الكلمات المسيئة.",
      threadID,
      undefined,
      event.messageID
    );
  }

  return api.sendMessage(
    "طريقة الاستعمال:\n" +
    "مراقبة تفعيل\n" +
    "مراقبة تعطيل",
    threadID,
    undefined,
    event.messageID
  );
};

module.exports.onChat = async ({ api, event, usersData }) => {
  const { threadID, senderID, body, messageID } = event;

  if (!threadID || !senderID || !body || !messageID) return;

  if (!global.mora9abaGroups.has(threadID)) return;

  if (!containsBadWord(body)) return;

  const key = `${threadID}:${senderID}`;

  const currentWarnings = (warnings.get(key) || 0) + 1;

  warnings.set(key, currentWarnings);

  let name = senderID;

  try {
    name = await usersData.getName(senderID);
  } catch (_) {}

  // حذف الرسالة المسيئة
  try {
    api.deleteMessage(messageID, err => {
      if (err) console.error("[Mora9aba] Delete error:", err);
    });
  } catch (err) {
    console.error("[Mora9aba] Delete error:", err);
  }

  // الإنذار الأول والثاني: Reply على رسالة المخالف
  if (currentWarnings < 3) {
    return api.sendMessage(
      `⚠️ إنذار ${currentWarnings}/3\n` +
      `👤 العضو: ${name}\n` +
      `🚫 ممنوع السب والشتم.\n` +
      `باقي ليك ${3 - currentWarnings} إنذار قبل الطرد.`,
      threadID,
      undefined,
      messageID
    );
  }

  // الإنذار الثالث: محاولة طرد العضو
  api.removeUserFromGroup(senderID, threadID, err => {
    if (err) {
      console.error("[Mora9aba] Kick error:", err);

      return api.sendMessage(
        `❌ ${name} وصل إلى 3 إنذارات، ` +
        `ولكن تعذر طرده. تأكد من صلاحيات البوت.`,
        threadID,
        undefined,
        messageID
      );
    }

    warnings.delete(key);

    api.sendMessage(
      `⛔ تم طرد ${name} بعد 3 إنذارات بسبب السب والشتم.`,
      threadID
    );
  });
};
