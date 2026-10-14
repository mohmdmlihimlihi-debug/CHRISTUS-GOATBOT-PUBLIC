module.exports.onChat = async ({
  api,
  event,
  usersData
}) => {
  const {
    threadID,
    senderID,
    body,
    messageID
  } = event;

  if (!threadID || !senderID || !body || !messageID) return;
  if (!global.shtotGroups?.has(threadID)) return;

  const text = normalize(body);

  const found = normalizedWords.some(word =>
    word && text.includes(word)
  );

  if (!found) return;

  const key = `${threadID}:${senderID}`;
  const warnings = (global.shtotWarnings.get(key) || 0) + 1;

  global.shtotWarnings.set(key, warnings);

  let name = senderID;

  try {
    name = await usersData.getName(senderID);
  } catch (_) {}

  // حذف الرسالة المسيئة
  api.deleteMessage(messageID, err => {
    if (err) {
      console.error("[shtot] Delete error:", err);
    }
  });

  // Reply على رسالة العضو المسيئة
  if (warnings < 3) {
    return api.sendMessage(
      `⚠️ إنذار ${warnings}/3\n` +
      `👤 العضو: ${name}\n` +
      `🚫 ممنوع السب والشتم. ` +
      `باقي ليك ${3 - warnings} إنذار قبل الطرد.`,
      threadID,
      undefined,
      messageID
    );
  }

  // الإنذار الثالث: الطرد
  api.removeUserFromGroup(senderID, threadID, error => {
    if (error) {
      console.error("[shtot] Kick error:", error);

      return api.sendMessage(
        `❌ ${name} وصل لـ3 إنذارات، ولكن ما قدرش البوت يطردو. تأكد من صلاحيات الأدمن.`,
        threadID,
        undefined,
        messageID
      );
    }

    global.shtotWarnings.delete(key);

    api.sendMessage(
      `⛔ تم طرد ${name} بعد 3 إنذارات بسبب السب والشتم.`,
      threadID,
      undefined,
      messageID
    );
  });
};
