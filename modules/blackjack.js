function createDeck() {
    const suits = ["❤️", "♦️", "♣️", "♠️"];
    const ranks = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K", "A"];
    let deck = [];
    for (let suit of suits) {
        for (let rank of ranks) {
            deck.push({ suit, rank });
        }
    }
    return deck;
}

function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function dealCard(deck) {
    return deck.pop();
}

function cardValue(card) {
    if (["J", "Q", "K"].includes(card.rank)) return 10;
    if (card.rank === "A") return 11;
    return parseInt(card.rank, 10);
}

function calculateHandValue(hand) {
    let total = 0, aces = 0;
    for (let card of hand) {
        total += cardValue(card);
        if (card.rank === "A") aces++;
    }
    while (total > 21 && aces > 0) {
        total -= 10;
        aces--;
    }
    return total;
}

function displayHand(hand) {
    return hand.map(c => `┌───┐\n│${c.rank.padEnd(2)} │\n│ ${c.suit} │\n└───┘`).join(" ");
}

// Mesaj gönderme helper
async function sendMsg(chatId, msg, sock, rawMessage, text) {
    try {
        if (rawMessage && rawMessage.messages && rawMessage.messages[0]) {
            return await sock.sendMessage(chatId, { text }, { quoted: rawMessage.messages[0] });
        }
        return await sock.sendMessage(chatId, { text });
    } catch (err) {
        console.error("Mesaj gönderme hatası:", err);
    }
}

// Oyuncu ve dealer durumunu göster
async function updateGameState(game, chatId, msg, sock, rawMessage) {
    let handDisplay = `🃏 Senin elin (${game.playerTotal}):\n${displayHand(game.playerHand)}\n\n`;
    let dealerDisplay = `🎩 Dealer gösteriyor: ${displayHand([game.dealerHand[0]])} ?\n\n`;
    let prompt = game.isPlayerTurn ? "Hamleni yapmak için *'hit'* veya *'stand'* yaz." : "";
    await sendMsg(chatId, msg, sock, rawMessage, handDisplay + dealerDisplay + prompt);
}

// Başlatıcı komut
addCommand({ pattern: "^blackjack$", access: "all", desc: "_*Blackjack oyunu başlatır.*_" }, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    const playerId = msg.key.fromMe ? sock.user.id.split(':')[0] + "@s.whatsapp.net" : (msg.key.participant || chatId);

    if (!global.database.games) global.database.games = {};
    if (!global.database.games.blackjack) global.database.games.blackjack = {};

    if (!global.database.games.blackjack[chatId]) {
        const deck = shuffle(createDeck());
        const playerHand = [dealCard(deck), dealCard(deck)];
        const dealerHand = [dealCard(deck), dealCard(deck)];

        global.database.games.blackjack[chatId] = {
            player: playerId,
            deck,
            playerHand,
            dealerHand,
            playerTotal: calculateHandValue(playerHand),
            dealerTotal: calculateHandValue(dealerHand),
            isPlayerTurn: true,
            isGameOver: false,
        };
    }

    await updateGameState(global.database.games.blackjack[chatId], chatId, msg, sock, rawMessage);
});

// Oyuncu mesajlarını dinleme
addCommand({ pattern: "onMessage", access: "all", dontAddCommandList: true }, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    const playerId = msg.key.fromMe ? sock.user.id.split(':')[0] + "@s.whatsapp.net" : (msg.key.participant || chatId);

    const game = global.database?.games?.blackjack?.[chatId];
    if (!game || game.player !== playerId || game.isGameOver) return;

    const action = msg.text.trim().toLowerCase();
    if (!["hit", "stand"].includes(action)) return;

    if (action === "hit") {
        const card = dealCard(game.deck);
        game.playerHand.push(card);
        game.playerTotal = calculateHandValue(game.playerHand);

        if (game.playerTotal > 21) {
            game.isGameOver = true;
            let result = `💥 Sen 21'i aştın! Dealer kazandı.\n\nSenin elin:\n${displayHand(game.playerHand)} (${game.playerTotal})\nDealer el:\n${displayHand(game.dealerHand)} (${game.dealerTotal})`;
            await sendMsg(chatId, msg, sock, rawMessage, result);
            delete global.database.games.blackjack[chatId];
            return;
        }
    } else if (action === "stand") {
        game.isPlayerTurn = false;
    }

    if (!game.isPlayerTurn && !game.isGameOver) {
        while (calculateHandValue(game.dealerHand) < 17) {
            game.dealerHand.push(dealCard(game.deck));
            game.dealerTotal = calculateHandValue(game.dealerHand);
        }

        game.isGameOver = true;
        let result = `🎭 Dealer el:\n${displayHand(game.dealerHand)} (${game.dealerTotal})\n🃏 Senin elin:\n${displayHand(game.playerHand)} (${game.playerTotal})\n\n`;

        if (game.dealerTotal > 21) result += "🚀 Dealer battı! Sen kazandın! 🎉";
        else if (game.dealerTotal > game.playerTotal) result += "🏆 Dealer kazandı!";
        else if (game.dealerTotal < game.playerTotal) result += "🎊 Sen kazandın!";
        else result += "🤝 Berabere!";

        await sendMsg(chatId, msg, sock, rawMessage, result);
        delete global.database.games.blackjack[chatId];
        return;
    }

    await updateGameState(game, chatId, msg, sock, rawMessage);
});
