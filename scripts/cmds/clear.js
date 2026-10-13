const runningClear3 = new Map();

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  config: {
    name: "clear3",
    aliases: ["c3"],
    version: "1.2.0",
    author: "shtot",
    countDown: 3,
    role: 1,
    shortDescription: "مسح 3 ألقاب كل ثانية",
    longDescription: "مسح ألقاب أعضاء المجموعة تدريجياً",
    category: "المجموعة",
    guide: {
      en: "{pn}\n{pn} off"
    }
  },

  onStart: async function ({ message, event, args, api }) {
    const threadID = event.threadID;
    const action = args[0]?.toLowerCase();

    // إيقاف عملية المسح
    if (action === "off") {
      if (!runningClear3.has(threadID)) {
        return message.reply(
          "لا توجد أي عملية مسح قيد التشغيل."
        );
      }

      runningClear3.set(threadID, false);

      return message.reply(
        "تم طلب إيقاف عملية مسح الألقاب."
      );
    }

    // التحقق من وجود عملية سابقة
    if (runningClear3.has(threadID)) {
      return message.reply(
        "توجد عملية مسح قيد التشغيل بالفعل.\n" +
        "استعمل clear3 off لإيقافها."
      );
    }

    runningClear3.set(threadID, true);

    let cleared = 0;
    let failed = 0;

    try {
      // جلب معلومات المجموعة
      const info = await api.getThreadInfo(threadID);
      const nicknames = info.nicknames || {};

      // تحديد الأعضاء الذين لديهم ألقاب فقط
      const membersWithNicknames =
        info.participantIDs.filter(uid => {
          const nickname = nicknames[uid];

          return (
            typeof nickname === "string" &&
            nickname.trim().length > 0
          );
        });

      if (membersWithNicknames.length === 0) {
        runningClear3.delete(threadID);

        return message.reply(
          "لا توجد ألقاب لمسحها في هذه المجموعة."
        );
      }

      await message.reply(
        `بدأ مسح ألقاب أعضاء المجموعة.\n\n` +
        `عدد الألقاب الموجودة: ${membersWithNicknames.length}\n` +
        `سرعة المسح: 3 ألقاب كل ثانية.`
      );

      // مسح 3 ألقاب في كل دفعة
      for (
        let i = 0;
        i < membersWithNicknames.length;
        i += 3
      ) {
        if (runningClear3.get(threadID) === false) {
          runningClear3.delete(threadID);

          return message.reply(
            `تم إيقاف عملية المسح.\n` +
            `الألقاب التي تم مسحها: ${cleared}\n` +
            `الألقاب التي تعذر مسحها: ${failed}`
          );
        }

        const batch = membersWithNicknames.slice(i, i + 3);

        await Promise.all(
          batch.map(async uid => {
            try {
              await api.changeNickname("", threadID, uid);
              cleared++;

              console.log(
                `[CLEAR3] تم مسح لقب العضو ${uid}`
              );
            } catch (err) {
              failed++;

              console.log(
                `[CLEAR3] تعذر مسح لقب ${uid}:`,
                err.message
              );
            }
          })
        );

        if (i + 3 < membersWithNicknames.length) {
          await sleep(1000);
        }
      }

      runningClear3.delete(threadID);

      return message.reply(
        `اكتملت عملية مسح الألقاب.\n\n` +
        `تم مسح: ${cleared} لقباً.\n` +
        `تعذر مسحه: ${failed} لقباً.`
      );

    } catch (err) {
      runningClear3.delete(threadID);

      console.error("[CLEAR3 ERROR]", err);

      return message.reply(
        "حدث خطأ أثناء مسح الألقاب. تأكد من صلاحيات البوت وحاول مرة أخرى."
      );
    }
  }
};
