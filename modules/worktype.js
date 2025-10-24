// worktype komutu
addCommand({
    pattern: "^worktype ?(.*)",
    access: "sudo",
    desc: "_*Botun çalışma türünü değiştirir.*_",
    usage: global.handlers[0] + "worktype <public || private>"
}, async (msg, match, sock, rawMessage) => {
    const worktype = match[1];
    const chatId = msg.key.remoteJid;
    const botOwnId = sock.user.id.split(":")[0] + "@s.whatsapp.net";

    const senderId = chatId.endsWith('@g.us') ? msg.key.participant : chatId;
    const normalizedSender = senderId.split(":")[0].replace(/\D+/g, "");
    const permission = msg.key.fromMe || global.database.sudo.some(s => s.replace(/\D+/g, "") === normalizedSender);

    if (!permission) return;

    const sendOpts = {};
    if (msg.key.fromMe || chatId === botOwnId) sendOpts.edit = msg.key;

    if (!worktype) {
        return await sock.sendMessage(chatId, {
            text: `_Lütfen botun çalışma türünü belirtin._\n\n_Bot şu anda_ ${global.database.worktype} _olarak ayarlanmış._`,
            ...sendOpts
        });
    }

    if (worktype === "public" || worktype === "private") {
        global.database.worktype = worktype;
        return await sock.sendMessage(chatId, {
            text: `_Botun çalışma türü ${worktype} olarak değiştirildi._`,
            ...sendOpts
        });
    } else {
        return await sock.sendMessage(chatId, {
            text: `_Geçersiz çalışma türü. Lütfen 'public' veya 'private' kullanın._`,
            ...sendOpts
        });
    }
});

// start_command içinde private/public kontrolü
async function start_command(msg, sock, rawMessage) {
    const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text;
    if (!text) return;

    const matchedPrefix = global.handlers.find(p => text.startsWith(p));
    if (!matchedPrefix) return;

    const validText = text.slice(matchedPrefix.length).trim();

    for (const { commandInfo, callback } of global.commands) {
        const match = validText.match(new RegExp(commandInfo.pattern, "im"));
        if (!match) continue;

        const isGroup = msg.key.remoteJid.endsWith("@g.us");
        const senderId = isGroup ? msg.key.participant : msg.key.remoteJid;
        const normalizedSender = senderId.split(":")[0].replace(/\D+/g, "");
        const permission = msg.key.fromMe || global.database.sudo.some(s => s.replace(/\D+/g, "") === normalizedSender);

        // private modda sadece sudo izinli
        if (global.database.worktype === "private" && !permission) return;

        // sudo kontrolü
        if (commandInfo.access === "sudo" && !permission) return;

        // onlyInGroups kontrolü
        if (commandInfo.onlyInGroups && !isGroup) return;

        await callback(msg, match, sock, rawMessage);
        return;
    }
}
