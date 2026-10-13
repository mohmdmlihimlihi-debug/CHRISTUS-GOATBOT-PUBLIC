const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");

let games = {};

function renderBoard(board, playerXName, playerOName) {
  const canvas = createCanvas(400, 460);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "#0a0a1a";
  ctx.fillRect(0, 0, 400, 460);

  ctx.fillStyle = "#00ffff";
  ctx.fillRect(0, 0, 400, 60);
  ctx.fillStyle = "#000";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`${playerXName} (X) vs ${playerOName} (O)`, 200, 35);

  ctx.strokeStyle = "#00ffff";
  ctx.shadowColor = "#00ffff";
  ctx.shadowBlur = 15;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(133, 70);
  ctx.lineTo(133, 430);
  ctx.moveTo(266, 70);
  ctx.lineTo(266, 430);
  ctx.moveTo(0, 170);
  ctx.lineTo(400, 170);
  ctx.moveTo(0, 300);
  ctx.lineTo(400, 300);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = "bold 80px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let i = 0; i < 9; i++) {
    const centerX = (i % 3) * 133 + 67;
    const centerY = Math.floor(i / 3) * 130 + 120;

    if (board[i] === "X") {
      ctx.fillStyle = "#ff0000";
      ctx.shadowColor = "#cc0000";
      ctx.shadowBlur = 20;
      ctx.fillText("X", centerX, centerY);
      ctx.shadowBlur = 0;
    } else if (board[i] === "O") {
      ctx.fillStyle = "#ff8800";
      ctx.shadowColor = "#ff5500";
      ctx.shadowBlur = 20;
      ctx.fillText("O", centerX, centerY);
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = "#00ffff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "top";
      const cornerX = (i % 3) * 133 + 125;
      const cornerY = Math.floor(i / 3) * 130 + 75;
      ctx.fillText(String(i + 1), cornerX, cornerY);

      ctx.font = "bold 80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
    }
  }

  return canvas.toBuffer();
}

function checkWinner(board) {
  const wins = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];

  for (const [a, b, c] of wins) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (board.every(cell => cell)) return "draw";
  return null;
}

function resetTimer(gameId, message) {
  const game = games[gameId];
  if (!game) return;

  if (game.timeout) clearTimeout(game.timeout);

  game.timeout = setTimeout(() => {
    if (games[gameId] !== game) return;
    delete games[gameId];
    message.reply("⏰ انتهى الوقت! تم إلغاء اللعبة.");
  }, 60000);
}

module.exports = {
  config: {
    name: "ttt",
    aliases: ["tic-tac-toe"],
    version: "3.7",
    author: "Toshiro Editz",
    countDown: 5,
    role: 0,
    shortDescription: "Play tic tac toe",
    longDescription: "Play a neon tic tac toe game with red X, orange O, and corner numbers",
    category: "game",
    guide: {
      en: "/ttt ID → start game\nThen type 1-9 to play without replying"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    const playerX = String(event.senderID);

    // Get opponent ID instead of mention
    const playerO = String(
      (args && args[0]) || (event.body || "").trim().split(/\s+/)[1] || ""
    );

    if (!playerO || !/^\d+$/.test(playerO)) {
      return message.reply("❌ استعمل الأمر هكذا:\n/ttt ID اللاعب");
    }

    if (playerX === playerO) {
      return message.reply("❌ لا يمكنك اللعب ضد نفسك!");
    }

    const gameId = String(event.threadID);

    if (games[gameId]) {
      return message.reply("⚠️ توجد لعبة جارية بالفعل في هذه المجموعة!");
    }

    let playerXName;
    let playerOName;

    try {
      playerXName = await usersData.getName(playerX);
      playerOName = await usersData.getName(playerO);
    } catch (error) {
      return message.reply("❌ تعذر الحصول على أسماء اللاعبين.");
    }

    games[gameId] = {
      board: Array(9).fill(null),
      players: { X: playerX, O: playerO },
      names: {
        X: playerXName || "Player X",
        O: playerOName || "Player O"
      },
      turn: "X",
      timeout: null
    };

    resetTimer(gameId, message);

    const img = renderBoard(
      games[gameId].board,
      games[gameId].names.X,
      games[gameId].names.O
    );

    const filePath = path.join(__dirname, `ttt_${gameId}.png`);
    fs.writeFileSync(filePath, img);

    return message.reply({
      body:
        `🎮 بدأت لعبة Tic Tac Toe!\n\n` +
        `👉 ${games[gameId].names.X} = X (Red)\n` +
        `👉 ${games[gameId].names.O} = O (Orange)\n\n` +
        `الدور الأول: ${games[gameId].names.X}\n` +
        `اكتب رقماً من 1 إلى 9 دون Reply.`,
      attachment: fs.createReadStream(filePath)
    });
  },

  onChat: async function ({ message, event }) {
    const gameId = String(event.threadID);
    const game = games[gameId];
    if (!game) return;

    const moveText = String(event.body || "").trim();

    // Only accept a single number from 1 to 9
    if (!/^[1-9]$/.test(moveText)) return;

    const player = Object.keys(game.players).find(
      key => game.players[key] === String(event.senderID)
    );

    if (!player) return;

    if (game.turn !== player) {
      return message.reply("⏳ ليس دورك الآن!");
    }

    const index = Number(moveText) - 1;

    if (game.board[index]) {
      return message.reply("❌ هذه الخانة ممتلئة، اختر خانة أخرى!");
    }

    game.board[index] = player;

    const winner = checkWinner(game.board);

    if (!winner) {
      game.turn = game.turn === "X" ? "O" : "X";
    }

    resetTimer(gameId, message);

    const img = renderBoard(game.board, game.names.X, game.names.O);
    const filePath = path.join(__dirname, `ttt_${gameId}.png`);

    fs.writeFileSync(filePath, img);

    if (winner) {
      clearTimeout(game.timeout);
      delete games[gameId];

      if (winner === "draw") {
        return message.reply({
          body: "🤝 انتهت اللعبة بالتعادل!",
          attachment: fs.createReadStream(filePath)
        });
      }

      return message.reply({
        body: `🏆 الفائز هو: ${game.names[winner]} (${winner})`,
        attachment: fs.createReadStream(filePath)
      });
    }

    return message.reply({
      body: `👉 الدور الآن على ${game.names[game.turn]} (${game.turn})`,
      attachment: fs.createReadStream(filePath)
    });
  }
};
