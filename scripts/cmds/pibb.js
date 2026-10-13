const axios = require("axios");

const mahmud = async () => {
  const base = await axios.get(
    "https://raw.githubusercontent.com/mahmudx7/HINATA/main/baseApiUrl.json"
  );
  return base.data.mahmud;
};

module.exports = {
  config: {
    name: "pairdp",
    aliases: ["animepdp"],
    version: "1.8",
    author: "MahMUD",
    countDown: 5,
    role: 0,
    category: "media",
    guide: "{pn} (reply)"
  },

  onStart: async function ({ message, event }) {
    try {
      const apiBase = await mahmud();
      const baseUrl = `${apiBase}/api/cdpvip2`;

      const getStream = async (url) => {
        const res = await axios({
          url,
          method: "GET",
          responseType: "stream",
          headers: { "User-Agent": "Mozilla/5.0" }
        });
        return res.data;
      };

      const category = "anime";
      const res = await axios.get(
        `${baseUrl}?category=${category}`
      );

      const groupImages = res.data?.group || [];

      if (!groupImages.length) {
        return message.reply(
          `⚠ No DP found in "${category}" category.`
        );
      }

      const streamAttachments = [];

      for (const url of groupImages) {
        try {
          const stream = await getStream(url);
          streamAttachments.push(stream);
        } catch {
          console.warn(`Failed to load image: ${url}`);
        }
      }

      if (!streamAttachments.length) {
        return message.reply(
          "❌ All image URLs failed to load."
        );
      }

      return message.reply({
        body: "🎀 Here's your random anime CDP baby.",
        attachment: streamAttachments
      });

    } catch (err) {
      console.error(
        "Full error:",
        err.response?.data || err.message
      );
      return message.reply(
        "🥹 Error, please try again later."
      );
    }
  }
};
