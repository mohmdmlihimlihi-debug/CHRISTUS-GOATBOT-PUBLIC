const DIG = require("discord-image-generation");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "slap1",
    version: "1.2",
    author: "NTKhang",
    countDown: 5,
    role: 0,
    shortDescription: "Batslap image",
    longDescription: "Batslap image by reply or mention",
    category: "image",
    guide: "{pn} (reply / mention)"
  },

  langs: {
    en: {
      noTag: "رد على رسالة الشخص أو منشن عليه باش تضربو."
    }
  },

  onStart: async function ({
    event,
    message,
    usersData,
    args,
    getLang
  }) {
    const uid1 = event.senderID;
    let uid2;

    // Reply
    if (event.messageReply) {
      uid2 = event.messageReply.senderID;
    }
    // Mention
    else if (
      event.mentions &&
      Object.keys(event.mentions).length > 0
    ) {
      uid2 = Object.keys(event.mentions)[0];
    }

    if (!uid2) {
      return message.reply(getLang("noTag"));
    }

    if (uid2 === "100078140834638") {
      return message.reply("Slap yourself Dude 🐸🐸!");
    }

    let pathSave;

    try {
      const avatarURL1 = await usersData.getAvatarUrl(uid1);
      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      const img = await new DIG.Batslap().getImage(
        avatarURL1,
        avatarURL2
      );

      const tmpDir = path.join(__dirname, "tmp");
      await fs.ensureDir(tmpDir);

      pathSave = path.join(
        tmpDir,
        `${uid1}_${uid2}_${Date.now()}Batslap.png`
      );

      await fs.writeFile(pathSave, Buffer.from(img));

      const content = args.join(" ").trim();

      return message.reply(
        {
          body: content || "Bópppp 😵‍💫😵",
          attachment: fs.createReadStream(pathSave)
        },
        () => {
          if (pathSave) {
            fs.remove(pathSave).catch(() => {});
          }
        }
      );
    } catch (err) {
      console.error("Slap Error:", err);

      if (pathSave) {
        await fs.remove(pathSave).catch(() => {});
      }

      return message.reply(
        "❌ وقع خطأ أثناء إنشاء صورة الضرب، حاول مرة أخرى."
      );
    }
  }
};
