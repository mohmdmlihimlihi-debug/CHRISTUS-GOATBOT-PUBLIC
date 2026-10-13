
const { getTime, drive } = global.utils;

if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.7",
		author: "Fadi",
		category: "events"
	},

	langs: {
		vi: {
			session1: "sáng",
			session2: "trưa",
			session3: "chiều",
			session4: "tối",
			welcomeMessage: "✅ تم ربط البوت بالمجموعة بنجاح!\n👑 صاحب البوت: فادي\n📊 الحالة: 100%",
			multiple1: "bạn",
			multiple2: "các bạn",
			defaultWelcomeMessage: "أهلاً {userName} ❤️‍🔥\nنورت مجموعتنا بوجودك ✨\nنتمنى لك أوقاتاً جميلة بيننا 🌹"
		},

		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",

			welcomeMessage: "╔════════════════════╗\n   🎉 تم دخول البوت بنجاح 🎉\n╚════════════════════╝\n\n✅ تم ربط البوت بالمجموعة\n👑 صاحب البوت: فادي\n📊 الحالة: 100%\n💚 البوت جاهز للخدمة!",

			multiple1: "أنت",
			multiple2: "أنتم",

			defaultWelcomeMessage: `╔══════════════════════╗
   🌸 نــورتــي مــجــمــوعــتــنــا 🌸
╚══════════════════════╝

💖 مرحباً بك يا {userName} ❤️‍🔥
✨ نورتينا وزدتي مجموعتنا جمالاً
🏡 ولاتي وحدة من عائلتنا الجميلة

┏━━━━━━━━━━━━━━━━━━┓
┃ 🦋 نتمنى ليك أيام زوينة معانا
┃ 💎 الاحترام أساس المحبة
┃ 🌿 خليك ديما بالخير والفرحة
┗━━━━━━━━━━━━━━━━━━┛

🤍 سعداء بانضمامك لعائلتنا
🌹 احترمي الجميع واستمتعي بوقتك

ــــــــــــــــــــــــــــــــــــ
👑 𓆩 F A D I 𓆪 👑
💫 أهلاً بك بين ناسك وأحبابك
ــــــــــــــــــــــــــــــــــــ`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants =
					event.logMessageData.addedParticipants;

				// عندما يدخل البوت إلى المجموعة
				if (
					dataAddedParticipants.some(
						item => item.userFbId == api.getCurrentUserID()
					)
				) {
					if (nickNameBot)
						api.changeNickname(
							nickNameBot,
							threadID,
							api.getCurrentUserID()
						);

					return message.send(getLang("welcomeMessage", prefix));
				}

				// عندما يدخل عضو جديد
				if (!global.temp.welcomeEvent[threadID]) {
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};
				}

				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(
					...dataAddedParticipants
				);

				clearTimeout(
					global.temp.welcomeEvent[threadID].joinTimeout
				);

				global.temp.welcomeEvent[threadID].joinTimeout =
					setTimeout(async function () {
						const threadData = await threadsData.get(threadID);

						if (threadData.settings.sendWelcomeMessage == false)
							return;

						const participants =
							global.temp.welcomeEvent[threadID]
								.dataAddedParticipants;

						const dataBanned = threadData.data.banned_ban || [];
						const threadName = threadData.threadName;
						const userName = [];
						const mentions = [];

						for (const user of participants) {
							if (
								dataBanned.some(
									item => item.id == user.userFbId
								)
							) continue;

							userName.push(user.fullName);
							mentions.push({
								tag: user.fullName,
								id: user.userFbId
							});
						}

						if (userName.length == 0) {
							delete global.temp.welcomeEvent[threadID];
							return;
						}

						let {
							welcomeMessage = getLang("defaultWelcomeMessage")
						} = threadData.data;

						const form = {
							mentions: welcomeMessage.match(/\{userNameTag\}/g)
								? mentions
								: null
						};

						welcomeMessage = welcomeMessage
							.replace(
								/\{userName\}|\{userNameTag\}/g,
								userName.join(", ")
							)
							.replace(
								/\{boxName\}|\{threadName\}/g,
								threadName
							)
							.replace(/\{multiple\}/g,
								userName.length > 1 ? "أنتم" : "أنت"
							);

						form.body = welcomeMessage;

						if (threadData.data.welcomeAttachment) {
							const files = threadData.data.welcomeAttachment;
							const attachments = files.map(file =>
								drive.getFile(file, "stream")
							);

							form.attachment = (
								await Promise.allSettled(attachments)
							)
								.filter(({ status }) => status == "fulfilled")
								.map(({ value }) => value);
						}

						await message.send(form);
						delete global.temp.welcomeEvent[threadID];
					}, 1500);
			};
	}
};

