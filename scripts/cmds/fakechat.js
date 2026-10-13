const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmhd = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

/**
 * @author MahMUD
 * @author: do not delete it
 */

module.exports = {
  config: {
    name: "fakechat",
    aliases: ["fc", "F", "fake"],
    version: "1.8",
    author: "MahMUD",
    role: 0,
    category: "fun",
    description: "Generate fake chat via reply, mention, or user uid",
    countDown: 5,
    guide: "{pn} (reply / mention / UID) text"
  },

  onStart: async ({ event, message, args, usersData, api }) => {
    const obfuscatedAuthor = String.fromCharCode(77, 97, 104, 77, 85, 68);

    if (module.exports.config.author !== obfuscatedAuthor) {
      return api.sendMessage(
        "❌ | You are not authorized to change the author name.",
        event.threadID,
        event.messageID
      );
    }

    let filePath;

    try {
      let targetId;
      let userText = args.join(" ").trim();

      // Reply
      if (event.messageReply) {
        targetId = event.messageReply.senderID;

      // Mention
      } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        targetId = Object.keys(event.mentions)[0];

        const mentionName = event.mentions[targetId];
        if (mentionName) {
          userText = userText
            .replace(
              new RegExp(
                `@?${String(mentionName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
                "gi"
              ),
              ""
            )
            .trim();
        }

      // UID
      } else if (args[0] && /^\d+$/.test(args[0])) {
        targetId = args[0];
        userText = args.slice(1).join(" ").trim();

      } else {
        return message.reply(
          "رد على رسالة الشخص وكتب fakechat متبوعاً بالنص."
        );
      }

      if (!targetId) {
        return message.reply("❌ ما قدرتش نحدد صاحب الرسالة.");
      }

      if (!userText) {
        return message.reply(
          "❌ خاصك تكتب النص اللي بغيتي يبان فالمحادثة الوهمية."
        );
      }

      let userName = "Unknown";

      try {
        userName = (await usersData.getName(targetId)) || targetId;
      } catch {
        userName = targetId;
      }

      const baseApi = await mahmhd();

      const apiUrl =
        `${baseApi}/api/fakechat?id=${encodeURIComponent(targetId)}` +
        `&name=${encodeURIComponent(userName)}` +
        `&text=${encodeURIComponent(userText)}`;

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer"
      });

      filePath = path.join(
        __dirname,
        `fakechat_${Date.now()}.png`
      );

      fs.writeFileSync(filePath, Buffer.from(response.data));

      await message.reply({
        body: `🗨️ تم إنشاء المحادثة الوهمية باسم: ${userName}`,
        attachment: fs.createReadStream(filePath)
      });

    } catch (err) {
      console.error("FakeChat Error:", err);

      return message.reply(
        "❌ وقع خطأ أثناء إنشاء الصورة، حاول مرة أخرى."
      );

    } finally {
      if (filePath) {
        setTimeout(() => {
          try {
            if (fs.existsSync(filePath)) {
              fs.unlinkSync(filePath);
            }
          } catch {}
        }, 10000);
      }
    }
  }
};
