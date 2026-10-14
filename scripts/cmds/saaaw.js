const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../database");
const DATA_FILE = path.join(DATA_DIR, "swearguard.json");

const BAD_WORDS = [
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
  "القحبة كفاتة"
];

function loadData() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(
        DATA_FILE,
        JSON.stringify({ groups: {} }, null, 2)
      );
    }

    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("[SwearGuard] Load error:", error);
    return { groups: {} };
  }
}

function saveData(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function normalize(text) {
  return String(text || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

function findBadWord(text) {
  const message = normalize(text);

  return BAD_WORDS.find(word => {
    return message.includes(normalize(word));
  });
}

module.exports = {
  config: {
    name: "swearguard",
    version: "1.0.0",
    author: "OpenAI",
    role: 1,
    shortDescription: "مراقبة السب والشتم",
    longDescription: "إنذارات وطرد بعد أربع مخالفات",
    category: "moderation",
    guide: {
      en: "{pn} on | off | status"
    }
  },

  onStart: async function ({ api, event, args }) {
    const threadID = event.threadID;
    const action = (args[0] || "").toLowerCase();
    const data = loadData();

    if (!data.groups[threadID]) {
      data.groups[threadID] = {
        enabled: false,
        warnings: {}
      };
    }

    const group = data.groups[threadID];

    if (action === "on") {
      group.enabled = true;
      saveData(data);
      return api.sendMessage(
        "✅ تم تشغيل مراقبة الكلمات الممنوعة.",
        threadID
      );
    }

    if (action === "off") {
      group.enabled = false;
      saveData(data);
      return api.sendMessage(
        "⛔ تم إيقاف مراقبة الكلمات الممنوعة.",
        threadID
      );
    }

    if (action === "status") {
      return api.sendMessage(
        group.enabled
          ? "✅ المراقبة راهي مفعلة."
          : "⛔ المراقبة راهي متوقفة.",
        threadID
      );
    }

    return api.sendMessage(
      "طريقة الاستعمال:\n" +
      "swearguard on — تشغيل\n" +
      "swearguard off — إيقاف\n" +
      "swearguard status — الحالة",
      threadID
    );
  },

  onChat: async function ({ api, event }) {
    if (!event || !event.threadID || !event.senderID) return;

    const threadID = event.threadID;
    const senderID = event.senderID;

    // تجاهل رسائل البوت نفسه
    if (String(senderID) === String(api.getCurrentUserID())) return;

    const body = event.body || "";
    const matchedWord = findBadWord(body);

    if (!matchedWord) return;

    const data = loadData();
    const group = data.groups[threadID];

    if (!group || !group.enabled) return;

    if (!group.warnings) group.warnings = {};

    group.warnings[senderID] =
      (group.warnings[senderID] || 0) + 1;

    const count = group.warnings[senderID];

    if (count <= 3) {
      saveData(data);

      return api.sendMessage(
        {
          body:
            `⚠️ إنذار ${count}/3\n` +
            `ممنوع السب والشتم في المجموعة.\n` +
            `المخالف: @${senderID}\n` +
            (count === 3
              ? "🚨 هذا آخر إنذار، المخالفة القادمة تسبب الطرد."
              : "عاودها وتتعرض للطرد."),
          mentions: [
            {
              id: senderID,
              tag: `@${senderID}`
            }
          ]
        },
        threadID
      );
    }

    // حفظ المخالفة قبل محاولة الطرد
    saveData(data);

    return api.removeUserFromGroup(
      senderID,
      threadID,
      error => {
        if (error) {
          console.error("[SwearGuard] Remove error:", error);

          return api.sendMessage(
            `❌ ما قدرتش نطرد العضو @${senderID}. تأكد بلي البوت عنده صلاحية الطرد.`,
            threadID,
            undefined,
            undefined,
            {
              mentions: [
                {
                  id: senderID,
                  tag: `@${senderID}`
                }
              ]
            }
          );
        }

        api.sendMessage(
          `🚫 تم طرد @${senderID} بعد 4 مخالفات.`,
          threadID,
          undefined,
          undefined,
          {
            mentions: [
              {
                id: senderID,
                tag: `@${senderID}`
              }
            ]
          }
        );

        // تصفير عداد العضو بعد الطرد الناجح
        const freshData = loadData();

        if (
          freshData.groups[threadID] &&
          freshData.groups[threadID].warnings
        ) {
          delete freshData.groups[threadID].warnings[senderID];
          saveData(freshData);
        }
      }
    );
  }
};
