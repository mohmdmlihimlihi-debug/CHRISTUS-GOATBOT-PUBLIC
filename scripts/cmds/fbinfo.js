module.exports = {
  config: {
    name: "fbinfo",
    aliases: ["fb", "userinfo"],
    version: "1.2",
    author: "Mamun",
    role: 0,
    shortDescription: "معلومات حساب فيسبوك",
    longDescription: "عرض معلومات حساب المستخدم",
    category: "معلومات",
    guide: "{p}fbinfo (بالرد أو المنشن أو UID)"
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      let uid;

      // بالريبلاي
      if (event.messageReply) {
        uid = event.messageReply.senderID;
      }
      // بالمنشن
      else if (Object.keys(event.mentions || {}).length > 0) {
        uid = Object.keys(event.mentions)[0];
      }
      // بالـ UID
      else if (args[0] && /^\d+$/.test(args[0])) {
        uid = args[0];
      }
      // معلومات صاحب الأمر
      else {
        uid = event.senderID;
      }

      const data = await api.getUserInfo(uid);
      const user = data && data[uid];

      if (!user) {
        return message.reply("تعذر العثور على معلومات هذا المستخدم.");
      }

      const gender =
        user.gender == 1 ? "أنثى" :
        user.gender == 2 ? "ذكر" : "غير معروف";

      const name = user.name || "غير معروف";
      const username = user.vanity || "غير متوفر";

      return message.reply(
`╔═══════『 معلومات الحساب 』═══════╗

👑 الاسم الكامل: ${name}

🆔 الرقم التعريفي UID:
${uid}

🏷️ اسم المستخدم:
${username}

⚧️ الجنس: ${gender}

🔗 رابط الحساب:
https://www.facebook.com/${uid}

╚════════════════════════════╝

『 𝗠𝗜𝗟𝗢𝗡 』 ⚔️ 𝗖𝗛𝗔𝗧 𝗕𝗢𝗧`
      );

    } catch (err) {
      console.error(err);
      return message.reply(
        "حدث خطأ أثناء جلب المعلومات، حاول مرة أخرى."
      );
    }
  }
};
