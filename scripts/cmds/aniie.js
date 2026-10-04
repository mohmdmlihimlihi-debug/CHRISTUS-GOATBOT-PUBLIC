module.exports = {
  config: {
    name: "رجعو",
    version: "1.0",
    author: "shtot",
    countDown: 5,
    role: 0,
    description: "إعادة إدخال عضو إلى المجموعة بالرد على رسالته",
    category: "group",
    guide: {
      en: "{pn}"
    }
  },

  onStart: async function ({ api, event }) {
    try {
      // خاص الأمر يكون Reply على رسالة الشخص
      if (!event.messageReply) {
        return api.sendMessage(
          "⚠️ ردّ على رسالة الشخص وكتب: رجعو",
          event.threadID
        );
      }

      const userID = event.messageReply.senderID;

      if (!userID) {
        return api.sendMessage(
          "❌ ماقدرتش نحدد العضو.",
          event.threadID
        );
      }

      // محاولة إعادة إضافة العضو
      await api.addUserToGroup(userID, event.threadID);

      // الرسالة بعد نجاح الإضافة
      return api.sendMessage(
        "ها نتا عاودتي دخلت 😏\nوزمل حدودك ☝🏻🍆👏🏻",
        event.threadID
      );

    } catch (error) {
      console.error(error);

      return api.sendMessage(
        "❌ مقدرتش نرجعو للمجموعة. تأكد أن البوت عندو صلاحية Admin وأن إضافة الأعضاء مسموحة.",
        event.threadID
      );
    }
  }
};
