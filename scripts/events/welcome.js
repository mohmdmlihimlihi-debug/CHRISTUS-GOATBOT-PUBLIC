
const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.8",
		author: "Fadi",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "✅ تم دخول البوت إلى المجموعة بنجاح!\n👑 صاحب البوت: سحتوت\n📊 الحالة: 100%",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "أهلاً وسهلاً بك يا {userName} ❤️‍🔥\nنورت مجموعتنا: {threadName} ✨\n🕒 وقت الانضمام: {joinTime}"
		},

		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",

			welcomeMessage: "╔══════════════════════╗\n   ✅ تم دخول البوت بنجاح\n╚══════════════════════╝\n\n🔗 تم ربط البوت بالمجموعة\n👑 صاحب البوت: فادي\n📊 الحالة: 100%\n💚 البوت جاهز للخدمة!",

			multiple1: "أنت",
			multiple2: "أنتم",

			defaultWelcomeMessage: `╔══════════════════════════╗
       🌟 أَهْلًا وَسَهْلًا بِكَ 🌟
╚══════════════════════════╝

💖 مرحباً بك يا {userName} ❤️‍🔥
✨ نورت مجموعتنا: {threadName}
🕒 وقت الانضمام: {joinTime}

╭━━━━━━━━━━━━━━━━━━━━╮
🌹 يسعدنا انضمامك إلى عائلتنا،
ونأمل أن تجد بيننا الودّ والاحترام.

🤝 نرجو منك الالتزام بالأدب
والاحترام المتبادل مع جميع الأعضاء.

🦋 انشر المحبة والكلمات الطيبة،
واجعل وجودك إضافة جميلة لمجموعتنا.

💎 نتمنى لك وقتاً ممتعاً ومفيداً معنا.
╰━━━━━━━━━━━━━━━━━━━━╯

       ♛ 𓆩سحتوت 𓆪 ♛
╚══════════════════════════╝`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType != "log:subscribe")
			return;

		return async function () {
			const { threadID } = event;
			const { nickNameBot } = global.GoatBot.config;
			const prefix = global.utils.getPrefix(threadID);
			const participants =
				event.logMessageData.addedParticipants || [];

			// رسالة دخول البوت نفسه
			if (
				participants.some(
					item => item.userFbId == api.getCurrentUserID()
				)
			) {
				if (nickNameBot) {
					api.changeNickname(
						nickNameBot,
						threadID,
						api.getCurrentUserID()
					);
				}

				return message.send(getLang("welcomeMessage", prefix));
			}

			if (!global.temp.welcomeEvent[threadID]) {
				global.temp.welcomeEvent[threadID] = {
					joinTimeout: null,
					dataAddedParticipants: []
				};
			}

			global.temp.welcomeEvent[threadID]
				.dataAddedParticipants.push(...participants);

			clearTimeout(
				global.temp.welcomeEvent[threadID].joinTimeout
			);

			global.temp.welcomeEvent[threadID].joinTimeout =
				setTimeout(async function () {
					try {
						const threadData = await threadsData.get(threadID);

						if (threadData.settings.sendWelcomeMessage == false) {
							delete global.temp.welcomeEvent[threadID];
							return;
						}

						const added =
							global.temp.welcomeEvent[threadID]
								.dataAddedParticipants;

						const banned = threadData.data.banned_ban || [];
						const names = [];
						const mentions = [];

						for (const user of added) {
							if (
								banned.some(
									item => item.id == user.userFbId
								)
							) continue;

							names.push(user.fullName);
							mentions.push({
								tag: user.fullName,
								id: user.userFbId
							});
						}

						if (names.length === 0)
							return;

						const now = new Date();

						const joinTime = now.toLocaleTimeString("en-GB", {
							hour: "2-digit",
							minute: "2-digit",
							timeZone: "Africa/Casablanca"
						});

						const joinDate = now.toLocaleDateString("en-GB", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
							timeZone: "Africa/Casablanca"
						});

						const threadName = threadData.threadName || "مجموعتنا";

						let welcomeMessage =
							threadData.data.welcomeMessage ||
							getLang("defaultWelcomeMessage");

						const form = {
							mentions: /\{userNameTag\}/.test(welcomeMessage)
								? mentions
								: null
						};

						welcomeMessage = welcomeMessage
							.replace(
								/\{userName\}|\{userNameTag\}/g,
								names.join("، ")
							)
							.replace(
								/\{boxName\}|\{threadName\}/g,
								threadName
							)
							.replace(
								/\{joinTime\}/g,
								joinTime
							)
							.replace(
								/\{joinDate\}/g,
								joinDate
							)
							.replace(
								/\{multiple\}/g,
								names.length > 1 ? "أنتم" : "أنت"
							);

						form.body = welcomeMessage;

						if (threadData.data.welcomeAttachment) {
							const files = threadData.data.welcomeAttachment;

							const attachments = await Promise.allSettled(
								files.map(file => drive.getFile(file, "stream"))
							);

							form.attachment = attachments
								.filter(item => item.status === "fulfilled")
								.map(item => item.value);
						}

						await message.send(form);
					} catch (error) {
						console.error("Welcome event error:", error);
					} finally {
						delete global.temp.welcomeEvent[threadID];
					}
				}, 1500);
		};
	}
};
