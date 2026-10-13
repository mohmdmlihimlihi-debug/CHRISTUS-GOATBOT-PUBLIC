const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
    config: {
        name: "marry",
        aliases: ["marryv4", "marryfour"],
        version: "1.0",
        author: "AKASH",
        countDown: 5,
        role: 0,
        shortDescription: "get a wife",
        longDescription: "mention your love",
        category: "love",
        guide: "{pn} (reply)"
    },

    onStart: async function ({ message, event }) {
        let one = event.senderID;
        let two;

        if (event.messageReply) {
            two = event.messageReply.senderID;
        } else {
            const mention = Object.keys(event.mentions);
            if (mention.length === 0)
                return message.reply("رد على رسالة الشخص اللي بغيتي وتبّعها بالأمر marry.");
            two = mention[0];
        }

        try {
            const ptth = await bal(one, two);
            message.reply({
                body: "got married 😍",
                attachment: fs.createReadStream(ptth)
            });
        } catch (err) {
            message.reply("وقع خطأ أثناء إنشاء الصورة، عاود المحاولة.");
        }
    }
};

async function bal(one, two) {
    const avone = await jimp.read(
        `https://graph.facebook.com/${one}/picture?width=512&height=512`
    );
    avone.circle();

    const avtwo = await jimp.read(
        `https://graph.facebook.com/${two}/picture?width=512&height=512`
    );
    avtwo.circle();

    const pth = "marryv4.png";

    const img = await jimp.read(
        "https://i.postimg.cc/XN1TcH3L/tumblr-mm9nfpt7w-H1s490t5o1-1280.jpg"
    );

    img.resize(1024, 684)
       .composite(avone.resize(85, 85), 204, 160)
       .composite(avtwo.resize(80, 80), 315, 105);

    await img.writeAsync(pth);
    return pth;
            }
