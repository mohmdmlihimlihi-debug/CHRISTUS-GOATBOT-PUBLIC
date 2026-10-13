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
    name: "dogg",
    aliases: ["kutta"],
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    shortDescription: "Dog image",
    longDescription: "Generate a dog image with another user",
    category: "fun",
    guide: "{pn} (reply / mention)"
  },

  langs: {
    en: {
      noMention: "رد على رسالة شخص أو منشن عليه باش تستعمل الأمر.",
      success: "𝐇𝐞𝐫𝐞’𝐬 𝐲𝐨𝐮𝐫 𝐏𝐞𝐫𝐬𝐨𝐧𝐚𝐥 𝐃𝐨𝐠 🐸",
      error: "وقع خطأ أثناء إنشاء الصورة: %1"
    }
  },

  onStart: async function ({ api, event, message, getLang }) {
    let targetID;

    if (event.messageReply) {
      targetID = event.messageReply.senderID;
    } else if (
      event.mentions &&
      Object.keys(event.mentions).length > 0
    ) {
      targetID = Object.keys(event.mentions)[0];
    } else {
      return message.reply(getLang("noMention"));
    }

    const senderID = event.senderID;
    const cacheDir = path.join(__dirname, "cache");
    const imgPath = path.join(
      cacheDir,
      `dog_${senderID}_${targetID}_${Date.now()}.png`
    );

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }

    try {
      api.setMessageReaction(
        "⏳",
        event.messageID,
        () => {},
        true
      );

      const base = await mahmud();

      const response = await axios.post(
        `${base}/api/dog`,
        { senderID, targetID },
        { responseType: "arraybuffer" }
      );

      fs.writeFileSync(imgPath, Buffer.from(response.data));

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
      console.error("dog Error:", err);

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
