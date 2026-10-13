
const axios = require("axios");

const API_KEY = "api-key-kling-uUCTWSp5_73YEQ8RO2KPje4yTnU3ZnFLX-vd9qyGUOw";
const BASE_URL = "https://api-singapore.klingai.com";

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  config: {
    name: "تحويل",
    aliases: ["تحريك", "convert"],
    version: "1.0.0",
    author: "shtot",
    countDown: 10,
    role: 0,
    shortDescription: "تحويل الصور إلى فيديو",
    category: "media",
    guide: "{pn} وصف الحركة بالرد على صورة"
  },

  onStart: async function ({ message, event, args }) {
    if (API_KEY === "PASTE_YOUR_NEW_API_KEY_HERE" || !API_KEY) {
      return message.reply("ضع API Key الجديد داخل الكود أولا.");
    }

    const reply = event.messageReply;

    if (!reply || !reply.attachments?.length) {
      return message.reply(
        "رد على صورة أو رسالة فيها صورتان، واكتب:\nتحويل اجعل الشخص يمشي ويبتسم"
      );
    }

    const images = reply.attachments.filter(
      item =>
        ["photo", "image"].includes(item.type) &&
        item.url
    );

    if (images.length < 1 || images.length > 2) {
      return message.reply(
        "خاصك ترد على صورة واحدة أو صورتين فقط."
      );
    }

    const prompt = args.join(" ").trim() ||
      "Animate the subject naturally with smooth realistic movements, subtle facial expressions and gentle camera motion.";

    const contents = [
      { type: "prompt", text: prompt },
      { type: "first_frame", url: images[0].url }
    ];

    if (images.length === 2) {
      contents.push({
        type: "last_frame",
        url: images[1].url
      });
    }

    try {
      await message.reply(
        "تم إرسال طلبك إلى Kling AI. انتظر حتى يتم إنشاء الفيديو."
      );

      const response = await axios.post(
        `${BASE_URL}/image-to-video/kling-3.0`,
        {
          contents,
          settings: {
            resolution: "720p",
            duration: 5,
            audio: "off",
            multi_shot: false
          },
          options: {
            watermark_info: { enabled: true }
          }
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json"
          },
          timeout: 60000
        }
      );

      if (response.data.code !== 0 || !response.data.data?.id) {
        throw new Error(
          response.data.message || "تعذر إنشاء المهمة."
        );
      }

      const taskId = response.data.data.id;

      for (let i = 0; i < 60; i++) {
        await sleep(10000);

        const result = await axios.get(
          `${BASE_URL}/tasks`,
          {
            params: { task_ids: taskId },
            headers: {
              Authorization: `Bearer ${API_KEY}`
            },
            timeout: 30000
          }
        );

        if (result.data.code !== 0) {
          throw new Error(
            result.data.message || "تعذر فحص حالة الفيديو."
          );
        }

        const data = result.data.data;
        const task = Array.isArray(data)
          ? data.find(t => t.id === taskId)
          : data?.result?.find(t => t.id === taskId);

        if (!task) continue;

        if (task.status === "failed") {
          throw new Error(
            task.message || "فشل إنشاء الفيديو."
          );
        }

        if (task.status === "succeeded") {
          const video = (task.outputs || []).find(
            item => item.type === "video" && item.url
          );

          if (!video) {
            throw new Error(
              "اكتمل الطلب، لكن رابط الفيديو غير موجود في النتيجة."
            );
          }

          return message.reply(
            "تم إنشاء الفيديو بنجاح:\n" + video.url
          );
        }
      }

      return message.reply(
        "ما زال الفيديو قيد المعالجة. رقم المهمة:\n" + taskId
      );

    } catch (error) {
      const details =
        error.response?.data?.message ||
        error.response?.data?.msg ||
        error.message;

      console.error("Kling API error:", error.response?.data || error.message);

      return message.reply(
        "وقع خطأ أثناء إنشاء الفيديو:\n" +
        String(details).slice(0, 500)
      );
    }
  }
};
