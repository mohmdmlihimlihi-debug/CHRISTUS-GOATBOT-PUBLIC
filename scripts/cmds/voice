const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "voice",
    aliases: ["v", "فوكال"],
    version: "1.0.0",
    author: "shtot",
    countDown: 3,
    role: 0,
    shortDescription: "تحويل أي نص إلى فوكال",
    category: "fun"
  },

  onStart: async function ({ message, args }) {
    if (!args.length) {
      return message.reply("🎙️ كتب الكلام من بعد الأمر، مثال:\n/voice سلام خويا كيداير؟");
    }

    const text = args.join(" ");

    try {
      const apiUrl =
        "https://translate.google.com/translate_tts?ie=UTF-8&q=" +
        encodeURIComponent(text) +
        "&tl=ar&client=tw-ob";

      const response = await axios.get(apiUrl, {
        responseType: "arraybuffer",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      });

      const filePath = path.join(
        __dirname,
        "voice_" + Date.now() + ".mp3"
      );

      fs.writeFileSync(filePath, response.data);

      await message.reply({
        attachment: fs.createReadStream(filePath)
      });

      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 10000);

    } catch (error) {
      console.error(error);
      message.reply("❌ وقع مشكل وأنا كنحوّل النص لفوكال.");
    }
  }
};
