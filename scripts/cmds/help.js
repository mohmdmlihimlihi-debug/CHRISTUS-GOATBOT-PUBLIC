const fs = require("fs-extra");
const axios = require("axios");
const path = require("path");

// =========================================================
// GIFS ديال help
// =========================================================

let lastGifIndex = -1;

const helpGifs = [
	"https://imglink.cc/cdn/IrXy58bCRZ.gif",
	"https://imglink.cc/cdn/bD1tWxSh7T.gif",
	"https://imglink.cc/cdn/8qEU-pMWxD.gif",
	"https://imglink.cc/cdn/CCTFhWgLmH.gif",
	"https://imglink.cc/cdn/2U4MdBoDWg.gif",
	"https://imglink.cc/cdn/acUzfFSvUr.gif"
];

module.exports = {

	// =========================================================
	// CONFIG
	// =========================================================

	config: {
		name: "help",
		version: "3.0",
		author: "NTKhang + Modified",
		countDown: 5,
		role: 0,

		shortDescription: {
			vi: "Xem danh sách lệnh",
			en: "View command list"
		},

		longDescription: {
			vi: "Xem danh sách tất cả các lệnh hoặc thông tin chi tiết về một lệnh",
			en: "View all commands or detailed information about a command"
		},

		category: "info",

		guide: {
			vi: "{pn} [tên lệnh]",
			en: "{pn} [command name]"
		}
	},

	// =========================================================
	// LANGS
	// =========================================================

	langs: {
		vi: {},
		en: {}
	},

	// =========================================================
	// ON START
	// =========================================================

	onStart: async function ({
		message,
		args,
		event,
		api
	}) {

		const {
			commands,
			aliases
		} = global.GoatBot;

		if (!commands) {
			return message.reply(
				"❌ Commands database not found."
			);
		}

		// =====================================================
		// البحث عن الأمر
		// =====================================================

		let commandName = args[0]
			? String(args[0]).toLowerCase()
			: null;

		let command = null;

		// البحث بالاسم
		if (commandName) {
			command =
				commands.get(commandName);
		}

		// البحث بالـ alias
		if (
			!command &&
			commandName &&
			aliases &&
			aliases.has(commandName)
		) {
			command =
				commands.get(
					aliases.get(commandName)
				);
		}

		// =====================================================
		// HELP بوحدها
		// GIF فقط
		// =====================================================

		if (!command && !args[0]) {

			// -------------------------------------------------
			// اختيار GIF عشوائي
			// ونضمنو ما يكونش نفس السابق
			// -------------------------------------------------

			let gifIndex;

			do {
				gifIndex = Math.floor(
					Math.random() *
					helpGifs.length
				);
			} while (
				gifIndex === lastGifIndex &&
				helpGifs.length > 1
			);

			lastGifIndex = gifIndex;

			const gifUrl =
				helpGifs[gifIndex];

			// -------------------------------------------------
			// كل GIF عندو ملف خاص
			// -------------------------------------------------

			const gifPath =
				path.join(
					__dirname,
					`help-${gifIndex}.gif`
				);

			try {

				// ------------------------------------------------
				// تحميل GIF غير أول مرة
				// ------------------------------------------------

				if (!fs.existsSync(gifPath)) {

					const response =
						await axios.get(
							gifUrl,
							{
								responseType:
									"arraybuffer",

								timeout: 30000
							}
						);

					await fs.writeFile(
						gifPath,
						Buffer.from(
							response.data
						)
					);
				}

				// ------------------------------------------------
				// إرسال GIF
				// ------------------------------------------------

				api.sendMessage(
					{
						body:
							"╔══════════════════════╗\n" +
							"      📜 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓\n" +
							"╚══════════════════════╝\n\n" +
							"↩️ 𝐑𝐞𝐩𝐥𝐲 𝐨𝐧 𝐭𝐡𝐢𝐬 𝐆𝐈𝐅\n" +
							"باش نرسل لك قائمة الأوامر.",

						attachment:
							fs.createReadStream(
								gifPath
							)
					},

					event.threadID,

					(err, info) => {

						if (err) {

							console.error(
								"❌ Help GIF error:",
								err
							);

							return;
						}

						// ------------------------------------------------
						// تسجيل رسالة GIF في onReply
						// ------------------------------------------------

						if (
							info &&
							info.messageID &&
							global.GoatBot &&
							global.GoatBot.onReply
						) {

							global.GoatBot.onReply.set(
								info.messageID,
								{
									messageID:
										info.messageID,

									commandName:
										"help",

									author:
										event.senderID,

									type:
										"show_commands"
								}
							);
						}
					}
				);

				// =================================================
				// مهم جداً:
				// هنا كيتوقف onStart
				// وما كترسل حتى قائمة
				// =================================================

				return;

			} catch (error) {

				console.error(
					"❌ Help GIF error:",
					error
				);

				return message.reply(
					"❌ وقع مشكل فإرسال GIF."
				);
			}
		}

		// =====================================================
		// الأمر ماكاينش
		// =====================================================

		if (!command) {

			return message.reply(
				`❌ الأمر "${args[0]}" ماكاينش.`
			);
		}

		// =====================================================
		// HELP + اسم الأمر
		// مثال:
		// help ping
		// =====================================================

		const config =
			command.config || {};

		const language =
			global.GoatBot?.config?.language ||
			"en";

		// =====================================================
		// Description
		// =====================================================

		let description =
			config.shortDescription ||
			"No description available.";

		if (
			typeof description ===
			"object"
		) {

			description =
				description[language] ||
				description.en ||
				Object.values(
					description
				)[0] ||
				"No description available.";
		}

		// =====================================================
		// Guide
		// =====================================================

		let guide =
			config.guide ||
			"No guide available.";

		if (
			typeof guide ===
			"object"
		) {

			guide =
				guide[language] ||
				guide.en ||
				Object.values(
					guide
				)[0] ||
				"No guide available.";
		}

		// =====================================================
		// معلومات الأمر
		// =====================================================

		return message.reply(

			"╔════════════════════════════╗\n" +

			`      📖 𝐂𝐎𝐌𝐌𝐀𝐍𝐃: ${
				config.name ||
				commandName
			}\n` +

			"╚════════════════════════════╝\n\n" +

			"📝 𝐃𝐞𝐬𝐜𝐫𝐢𝐩𝐭𝐢𝐨𝐧\n" +

			"━━━━━━━━━━━━━━━━━━━━\n" +

			`${description}\n\n` +

			"📚 𝐆𝐮𝐢𝐝𝐞\n" +

			"━━━━━━━━━━━━━━━━━━━━\n" +

			`${guide}\n\n` +

			"⏱️ 𝐂𝐨𝐨𝐥𝐝𝐨𝐰: " +

			`${config.countDown || 0}s`
		);
	},

	// =========================================================
	// ON REPLY
	// هنا فقط كترسل قائمة الأوامر
	// =========================================================

	onReply: async function ({
		message,
		event,
		Reply,
		role
	}) {

		// =====================================================
		// التأكد أن Reply تابع لـ help
		// =====================================================

		if (
			!Reply ||
			Reply.type !==
				"show_commands"
		) {
			return;
		}

		// =====================================================
		// غير الشخص اللي دار help يقدر يشوف القائمة
		// =====================================================

		if (
			Reply.author &&
			String(Reply.author) !==
				String(event.senderID)
		) {
			return;
		}

		const {
			commands
		} = global.GoatBot;

		if (!commands) {

			return message.reply(
				"❌ ماقدرتش نجيب الأوامر."
			);
		}

		// =====================================================
		// Role
		// =====================================================

		const userRole =
			typeof role === "number"
				? role
				: 0;

		// =====================================================
		// أسماء الفئات
		// =====================================================

		const categoryNames = {

			admin:
				"👑 𝐀𝐃𝐌𝐈𝐍",

			config:
				"⚙️ 𝐂𝐎𝐍𝐅𝐈𝐆",

			info:
				"📚 𝐈𝐍𝐅𝐎",

			utility:
				"🛠️ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘",

			game:
				"🎮 𝐆𝐀𝐌𝐄",

			fun:
				"😂 𝐅𝐔𝐍",

			media:
				"🎵 𝐌𝐄𝐃𝐈𝐀",

			nsfw:
				"🔞 𝐍𝐒𝐅𝐖",

			owner:
				"👑 𝐎𝐖𝐍𝐄𝐑",

			other:
				"📦 𝐎𝐓𝐇𝐄𝐑"
		};

		// =====================================================
		// ترتيب الفئات
		// =====================================================

		const categoryOrder = [

			"admin",

			"config",

			"info",

			"utility",

			"game",

			"fun",

			"media",

			"nsfw",

			"owner",

			"other"
		];

		const categories = {};

		// =====================================================
		// جمع الأوامر حسب الفئة
		// =====================================================

		for (
			const [
				name,
				command
			] of commands
		) {

			try {

				if (
					!command ||
					!command.config
				) {
					continue;
				}

				const config =
					command.config;

				// الأوامر المخفية
				if (
					config.hidden === true
				) {
					continue;
				}

				// Role ديال الأمر
				const commandRole =
					typeof config.role ===
					"number"
						? config.role
						: 0;

				if (
					commandRole >
					userRole
				) {
					continue;
				}

				// Category
				const category =
					String(
						config.category ||
						"other"
					).toLowerCase();

				if (
					!categories[
						category
					]
				) {

					categories[
						category
					] = [];
				}

				categories[
					category
				].push(name);

			} catch (error) {

				console.error(
					`Help error: ${name}`,
					error
				);
			}
		}

		// =====================================================
		// ترتيب الأوامر أبجدياً
		// =====================================================

		for (
			const category
			of Object.keys(
				categories
			)
		) {

			categories[
				category
			].sort(
				(a, b) =>
					a.localeCompare(b)
			);
		}

		// =====================================================
		// بناء القائمة
		// =====================================================

		let list = "";

		let totalCommands = 0;

		const printed =
			new Set();

		// =====================================================
		// الفئات الرئيسية
		// =====================================================

		for (
			const category
			of categoryOrder
		) {

			const commandsList =
				categories[
					category
				];

			if (
				!commandsList ||
				commandsList.length === 0
			) {
				continue;
			}

			printed.add(
				category
			);

			totalCommands +=
				commandsList.length;

			const title =
				categoryNames[
					category
				] ||
				`📁 ${category.toUpperCase()}`;

			// عنوان الفئة
			list +=
				"\n" +
				"━━━━━━━━━━━━━━━━━━━━\n" +
				`       ${title}\n` +
				"━━━━━━━━━━━━━━━━━━━━\n";

			// أوامر الفئة
			for (
				const commandName
				of commandsList
			) {

				list +=
					`   ✦ ${commandName}\n`;
			}
		}

		// =====================================================
		// الفئات الأخرى
		// =====================================================

		for (
			const category
			of Object.keys(
				categories
			)
		) {

			if (
				printed.has(
					category
				)
			) {
				continue;
			}

			const commandsList =
				categories[
					category
				];

			if (
				!commandsList ||
				commandsList.length === 0
			) {
				continue;
			}

			totalCommands +=
				commandsList.length;

			const title =
				categoryNames[
					category
				] ||
				`📁 ${category.toUpperCase()}`;

			list +=
				"\n" +
				"━━━━━━━━━━━━━━━━━━━━\n" +
				`       ${title}\n` +
				"━━━━━━━━━━━━━━━━━━━━\n";

			for (
				const commandName
				of commandsList
			) {

				list +=
					`   ✦ ${commandName}\n`;
			}
		}

		// =====================================================
		// إذا ماكاين حتى أمر
		// =====================================================

		if (!list.trim()) {

			return message.reply(
				"❌ ماكاين حتى أمر متاح."
			);
		}

		// =====================================================
		// Prefix
		// =====================================================

		let prefix = "";

		try {

			prefix =
				global.GoatBot
					.config
					.prefix ||
				"";

		} catch (e) {

			prefix = "";
		}

		// =====================================================
		// القائمة النهائية
		// =====================================================

		const finalMessage =

			"╔══════════════════════════╗\n" +
			"       📜 𝐂𝐎𝐌𝐌𝐀𝐍𝐃 𝐋𝐈𝐒𝐓\n" +
			"╚══════════════════════════╝\n" +

			list +

			"\n" +
			"━━━━━━━━━━━━━━━━━━━━\n" +

			`📊 𝐓𝐨𝐭𝐚𝐥: ${totalCommands} 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬\n` +

			`💡 𝐔𝐬𝐞: ${prefix}help <command>\n` +

			"━━━━━━━━━━━━━━━━━━━━";

		// =====================================================
		// إرسال القائمة
		// =====================================================

		return message.reply(
			finalMessage
		);
	}
};
