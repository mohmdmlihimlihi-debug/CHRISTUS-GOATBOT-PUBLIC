const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "latti",
    aliases: ["lathi"],
    version: "1.3",
    author: "eden",
    countDown: 5,
    role: 0,
    shortDescription: "Football kick edit",
    longDescription: "Adds profile pictures into a football kick meme",
    category: "fun",
    guide: {
      en: "{p}{n} (reply / mention)"
    }
  },

  onStart: async function ({ api, event, args }) {
    try {
      let targetID;

      if (event.messageReply) {
        targetID = event.messageReply.senderID;
      } else if (
        event.mentions &&
        Object.keys(event.mentions).length > 0
      ) {
        targetID = Object.keys(event.mentions)[0];
      } else {
        return api.sendMessage(
          "رد على رسالة الشخص أو منشن عليه!",
          event.threadID,
          event.messageID
        );
      }

      const senderID = event.senderID;

      const senderAvatar =
        `https://graph.facebook.com/${senderID}/picture?width=512&height=512`;

      const targetAvatar =
        `https://graph.facebook.com/${targetID}/picture?width=512&height=512`;

      const cachePath = path.join(__dirname, "cache");
      await fs.ensureDir(cachePath);

      const templatePath = path.join(cachePath, "dkick_base.png");

      if (!(await fs.pathExists(templatePath))) {
        const imgUrl = "https://files.catbox.moe/4x39pb.jpg";
        const res = await axios.get(imgUrl, {
          responseType: "arraybuffer"
        });
        await fs.writeFile(templatePath, res.data);
      }

      const baseImg = await loadImage(templatePath);
      const senderImg = await loadImage(senderAvatar);
      const targetImg = await loadImage(targetAvatar);

      const canvas = createCanvas(baseImg.width, baseImg.height);
      const ctx = canvas.getContext("2d");

      ctx.drawImage(baseImg, 0, 0, canvas.width, canvas.height);

      // Sender face
      ctx.save();
      ctx.beginPath();
      ctx.arc(120, 175, 45, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(senderImg, 75, 130, 90, 90);
      ctx.restore();

      // Target face
      const targetX = 260;
      const targetY = 25;
      const targetSize = 100;

      ctx.save();
      ctx.beginPath();
      ctx.arc(
        targetX + targetSize / 2,
        targetY + targetSize / 2,
        targetSize / 2,
        0,
        Math.PI * 2
      );
      ctx.clip();
      ctx.drawImage(
        targetImg,
        targetX,
        targetY,
        targetSize,
        targetSize
      );
      ctx.restore();

      const outPath = path.join(
        cachePath,
        `dkick_${senderID}_${Date.now()}.png`
      );

      await fs.writeFile(outPath, canvas.toBuffer("image/png"));

      api.sendMessage(
        {
          body: "Bombolaaa 🦵⚽",
          attachment: fs.createReadStream(outPath)
        },
        event.threadID,
        () => {
          fs.unlink(outPath).catch(() => {});
        },
        event.messageID
      );
    } catch (e) {
      console.error(e);
      return api.sendMessage(
        "❌ وقع خطأ أثناء إنشاء الصورة.",
        event.threadID,
        event.messageID
      );
    }
  }
};
