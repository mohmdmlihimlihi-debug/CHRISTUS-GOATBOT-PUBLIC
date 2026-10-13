const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");

module.exports = {
  config: {
    name: "song",
    version: "2.3.0",
    author: "Milon",
    countDown: 5,
    role: 0,
    description: "البحث عن الأغاني وتحميلها بدون بادئة",
    category: "الوسائط",
    usePrefix: false
  },

  onChat: async function ({ api, event, message }) {
    if (
      event.body &&
      event.body.toLowerCase().startsWith("song")
    ) {
      const input = event.body.trim().split(/\s+/);
      input.shift();

      const query = input.join(" ").trim();

      if (!query) {
        return message.reply(
          "❌ المرجو كتابة اسم الأغنية.\n📌 مثال: song Let Me Love You"
        );
      }

      const searchingMessage = await message.reply(
        `🔍 جاري البحث عن الأغنية: ${query}\n⏳ المرجو الانتظار...`
      );

      let filePath;

      try {
        // البحث عن الأغنية
        const searchResponse = await axios.get(
          `https://betadash-search-download.vercel.app/yt?search=${encodeURIComponent(query)}`
        );

        const songData = searchResponse.data[0];

        if (!songData || !songData.url) {
          return message.reply(
            "⚠️ لم يتم العثور على الأغنية، حاول البحث باسم آخر."
          );
        }

        const ytUrl = songData.url;
        const title = songData.title;
        const channelName = songData.channelName || "غير معروف";

        await api.editMessage(
          `🎶 تم العثور على الأغنية: ${title}\n⬇️ جاري تحميلها...`,
          searchingMessage.messageID
        );

        // الحصول على رابط التحميل
        const downloadResponse = await axios.get(
          `https://yt-mp3-imran.vercel.app/api?url=${encodeURIComponent(ytUrl)}`
        );

        const audioUrl = downloadResponse.data.downloadUrl;

        if (!audioUrl) {
          return message.reply(
            "⚠️ تعذر الحصول على رابط تحميل الأغنية."
          );
        }

        // إنشاء مجلد التخزين المؤقت
        const cachePath = path.join(__dirname, "cache");
        await fs.ensureDir(cachePath);

        filePath = path.join(
          cachePath,
          `song_${Date.now()}.mp3`
        );

        // تحميل الملف الصوتي
        const response = await axios.get(audioUrl, {
          responseType: "stream"
        });

        const writer = fs.createWriteStream(filePath);

        await new Promise((resolve, reject) => {
          response.data.pipe(writer);
          writer.on("finish", resolve);
          writer.on("error", reject);
          response.data.on("error", reject);
        });

        // إرسال الأغنية
        await message.reply({
          body:
            `✅ اكتمل تحميل الأغنية بنجاح!\n\n` +
            `🎧 اسم الأغنية: ${title}\n` +
            `🎤 اسم القناة: ${channelName}`,
          attachment: fs.createReadStream(filePath)
        });

      } catch (err) {
        console.error("خطأ في أمر song:", err);

        return message.reply(
          "⚠️ وقع خطأ أثناء البحث أو تحميل الأغنية، المرجو المحاولة لاحقاً."
        );

      } finally {
        if (filePath) {
          await fs.remove(filePath).catch(() => {});
        }
      }
    }
  },

  onStart: async function () {}
};
