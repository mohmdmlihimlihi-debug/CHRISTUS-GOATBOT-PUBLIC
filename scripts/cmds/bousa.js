
const fs = require("fs");
const os = require("os");
const path = require("path");
const axios = require("axios");
const { execFile } = require("child_process");
const { promisify } = require("util");

const execFileAsync = promisify(execFile);

module.exports = {
  config: {
    name: "bousa",
    aliases: ["cinema", "تحريك"],
    version: "1.0",
    author: "Mamun",
    role: 0,
    shortDescription: "فيديو سينمائي من صورتين",
    longDescription: "يصنع فيديو قصير بحركة سينمائية من صورتين",
    category: "ترفيه",
    guide: "{p}bousa (رد على رسالة فيها صورتان)"
  },

  onStart: async function ({ event, message }) {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), "bousa-")
    );

    try {
      const source = event.messageReply;
      const images = (source?.attachments || [])
        .filter(a =>
          a.type === "photo" ||
          a.type === "image"
        )
        .slice(0, 2);

      if (images.length < 2) {
        return message.reply(
          "❤️ ابعث الصورتين في رسالة واحدة، " +
          "ثم ردّ على تلك الرسالة واكتب bousa."
        );
      }

      if (!images.every(a => a.url)) {
        return message.reply(
          "ما قدرتش نقرأ روابط الصورتين."
        );
      }

      await message.reply(
        "🎬 راني نصنعلك الفيديو السينمائي... اصبر شوية."
      );

      for (let i = 0; i < 2; i++) {
        const response = await axios.get(images[i].url, {
          responseType: "arraybuffer",
          timeout: 30000,
          maxContentLength: 15 * 1024 * 1024
        });

        fs.writeFileSync(
          path.join(dir, `image${i}.jpg`),
          response.data
        );
      }

      for (let i = 0; i < 2; i++) {
        const input = path.join(dir, `image${i}.jpg`);
        const output = path.join(dir, `clip${i}.mp4`);

        const filter =
          "scale=720:1280:force_original_aspect_ratio=increase," +
          "crop=720:1280," +
          "zoompan=z='min(zoom+0.0015,1.08)':" +
          "d=75:s=720x1280:fps=30," +
          "setsar=1,format=yuv420p";

        await execFileAsync("ffmpeg", [
          "-y",
          "-loop", "1",
          "-framerate", "30",
          "-i", input,
          "-t", "2.5",
          "-vf", filter,
          "-an",
          "-c:v", "libx264",
          "-preset", "ultrafast",
          "-pix_fmt", "yuv420p",
          output
        ], { timeout: 120000 });
      }

      const list = path.join(dir, "list.txt");

      fs.writeFileSync(
        list,
        `file '${path.join(dir, "clip0.mp4")}'\n` +
        `file '${path.join(dir, "clip1.mp4")}'\n`
      );

      const video = path.join(dir, "final.mp4");

      await execFileAsync("ffmpeg", [
        "-y",
        "-f", "concat",
        "-safe", "0",
        "-i", list,
        "-c", "copy",
        video
      ], { timeout: 60000 });

      await message.reply({
        body: "❤️🎬 ها هو الفيديو السينمائي تاعك!",
        attachment: fs.createReadStream(video)
      });

    } catch (err) {
      console.error("bousa error:", err);

      return message.reply(
        "❌ ما قدرتش نصنع الفيديو. " +
        "تأكد أن FFmpeg مثبت في الاستضافة وأنها تسمح بتشغيله."
      );

    } finally {
      setTimeout(() => {
        fs.rm(dir, {
          recursive: true,
          force: true
        }, () => {});
      }, 60000);
    }
  }
};
