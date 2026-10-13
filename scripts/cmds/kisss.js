const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "kiss",
    aliases: ["চুমা", "কিস"],
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    shortDescription: "Kiss image",
    longDescription: "Generate a romantic kiss image",
    category: "love",
    guide: "{pn} (reply / mention)"
  },

  langs: {
    en: {
      noTarget: "رد على رسالة الشخص أو منشن عليه باش تستعمل الأمر.",
      wait: "جاري تجهيز الصورة، انتظر قليلاً...",
      success: "ها هي صورة القبلة ديالكم.",
      error: "وقع خطأ أثناء إنشاء الصورة: %1"
    }
  },

  onStart: async function ({ api, event, message, getLang }) {
    let targetID;

    // Reply takes priority
    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (
      event.mentions &&
      Object.keys(event.mentions).length > 0
    ) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      return message.reply(getLang("noTarget"));
    }

    const senderID = event.senderID;
    const cacheDir = path.join(__dirname, "cache");

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    const imgPath = path.join(
      cacheDir,
      `kiss_${senderID}_${targetID}_${Date.now()}.png`
    );

    let waitMsg;

    try {
      api.setMessageReaction(
        "😘",
        event.messageID,
        () => {},
        true
      );

      waitMsg = await message.reply(getLang("wait"));

      const base = await mahmud();

      const response = await axios.post(
        `${base}/api/kiss`,
        { senderID, targetID },
        { responseType: "arraybuffer" }
      );

      fs.writeFileSync(imgPath, Buffer.from(response.data));

      if (waitMsg?.messageID) {
        api.unsendMessage(waitMsg.messageID);
      }

      return message.reply(
        {
          body: getLang("success"),
          attachment: fs.createReadStream(imgPath)
        },
        () => {
          api.setMessageReaction(
            "✅",
            event.messageID,
            () => {},
            true
          );

          if (fs.existsSync(imgPath)) {
            fs.unlinkSync(imgPath);
          }
        }
      );

    } catch (err) {
      console.error("Kiss Error:", err);

      if (waitMsg?.messageID) {
        api.unsendMessage(waitMsg.messageID);
      }

      api.setMessageReaction(
        "❌",
        event.messageID,
        () => {},
        true
      );

      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }

      return message.reply(
        getLang("error", err.message)
      );
    }
  }
};
