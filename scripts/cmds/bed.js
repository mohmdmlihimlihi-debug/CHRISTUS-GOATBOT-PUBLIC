const axios = require("axios");
const fs = require("fs");
const path = require("path");

const mahmud = async () => {
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
    name: "bed",
    version: "1.7",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    longDescription: "Generate anime-style bed hug image",
    category: "love",
    guide: "{pn} (reply to a person's message)"
  },

  onStart: async function ({ message, event, api }) {
    try {
      const obfuscatedAuthor = String.fromCharCode(
        77, 97, 104, 77, 85, 68
      );

      if (module.exports.config.author.trim() !== obfuscatedAuthor) {
        return api.sendMessage(
          "❌ | You are not authorized to change the author name.",
          event.threadID,
          event.messageID
        );
      }

      // تحديد الشخص من الرسالة التي رددت عليها
      if (
        !event.messageReply ||
        !event.messageReply.senderID
      ) {
        return message.reply(
          "❌ | خاصك دير Reply على رسالة الشخص اللي بغيتي."
        );
      }

      const senderID = event.senderID;
      const targetID = event.messageReply.senderID;

      const base = await mahmud();
      const apiURL = `${base}/api/bed`;

      message.reply("💞 Generating your image, please wait...");

      const response = await axios.post(
        apiURL,
        { senderID, targetID },
        { responseType: "arraybuffer" }
      );

      const imgPath = path.join(
        __dirname,
        `bed_${senderID}_${targetID}.png`
      );

      fs.writeFileSync(imgPath, Buffer.from(response.data));

      await message.reply({
        body: "Here's your image 😘",
        attachment: fs.createReadStream(imgPath)
      });

      setTimeout(() => {
        if (fs.existsSync(imgPath)) {
          fs.unlinkSync(imgPath);
        }
      }, 10000);

    } catch (err) {
      console.error("Error in command:", err.message || err);
      message.reply("🥹 Error, contact MahMUD.");
    }
  }
};
