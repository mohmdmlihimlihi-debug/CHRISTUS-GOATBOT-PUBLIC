
const { getTime, drive } = global.utils;

module.exports = {
	config: {
		name: "leave",
		version: "1.5",
		author: "Fadi",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			leaveType1: "غادر المجموعة",
			leaveType2: "تمت إزالته من المجموعة",
			defaultLeaveMessage: `╔══════════════════════════╗
       🌙 وداعاً وإلى اللقاء 🌙
╚══════════════════════════╝

👤 العضو: {userName}
🏠 المجموعة: {threadName}
🕒 وقت المغادرة: {time}

💐 نتمنى لك كل التوفيق والسعادة،
وشكراً على الأوقات التي جمعتنا.

✨ ستبقى الذكريات الجميلة حاضرة،
ونتمنى لك النجاح في كل خطواتك.

━━━━━━━━━━━━━━━━━━━━
       👑 𓆩 سحتوت 𓆪 👑
━━━━━━━━━━━━━━━━━━━━`
		},

		en: {
			session1: "الصباح",
			session2: "الظهيرة",
			session3: "بعد الظهر",
			session4: "المساء",
			leaveType1: "غادر المجموعة",
			leaveType2: "تمت إزالته من المجموعة",
			defaultLeaveMessage: `╔══════════════════════════╗
       🌙 وداعاً وإلى اللقاء 🌙
╚══════════════════════════╝

👤 العضو: {userName}
📌 الحالة: {type}
🏠 المجموعة: {threadName}
🕒 وقت المغادرة: {time}

💐 نتمنى لك كل التوفيق والسعادة،
وشكراً على الأوقات الجميلة التي جمعتنا.

🤍 نرجو أن تحمل معك ذكريات طيبة،
وأن تجد النجاح والسعادة أينما كنت.

━━━━━━━━━━━━━━━━━━━━
       👑 𓆩 سحتوت 𓆪 👑
━━━━━━━━━━━━━━━━━━━━`
		}
	},

	onStart: async ({ threadsData, message, event, api, usersData, getLang }) => {
		if (event.logMessageType == "log:unsubscribe")
			return async function () {
				const { threadID } = event;
				const threadData = await threadsData.get(threadID);

				if (!threadData.settings.sendLeaveMessage)
					return;

				const { leftParticipantFbId } = event.logMessageData;

				// عدم إرسال رسالة عند مغادرة البوت نفسه
				if (leftParticipantFbId == api.getCurrentUserID())
					return;

				const hours = getTime("HH");
				const threadName = threadData.threadName || "المجموعة";
				const userName = await usersData.getName(leftParticipantFbId);

				let { leaveMessage = getLang("defaultLeaveMessage") } =
					threadData.data;

				const leaveType =
					leftParticipantFbId == event.author
						? getLang("leaveType1")
						: getLang("leaveType2");

				const form = {
					mentions: /\{userNameTag\}/.test(leaveMessage)
						? [{
							tag: userName,
							id: leftParticipantFbId
						}]
						: null
				};

				leaveMessage = leaveMessage
					.replace(/\{userName\}|\{userNameTag\}/g, userName)
					.replace(/\{type\}/g, leaveType)
					.replace(/\{threadName\}|\{boxName\}/g, threadName)
					.replace(/\{time\}/g, hours)
					.replace(
						/\{session\}/g,
						hours <= 10
							? getLang("session1")
							: hours <= 12
								? getLang("session2")
								: hours <= 18
									? getLang("session3")
									: getLang("session4")
					);

				form.body = leaveMessage;

				if (threadData.data.leaveAttachment) {
					const files = threadData.data.leaveAttachment;

					const attachments = files.map(file =>
						drive.getFile(file, "stream")
					);

					form.attachment = (
						await Promise.allSettled(attachments)
					)
						.filter(({ status }) => status == "fulfilled")
						.map(({ value }) => value);
				}

				message.send(form);
			};
	}
};
