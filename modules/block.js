// -------------------- BLOCK KOMUTU --------------------
addCommand({
    pattern: "^block$",
    desc: "_*Bir kullanıcıyı engeller.*_",
    access: "sudo",
    onlyInGroups: false  // artık özelde de çalışır
}, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    let quotedUser;

    if (chatId.endsWith("@g.us")) { // grup mesajı
        if (!msg.quotedMessage) {
            if (msg.key.fromMe) {
                return await sock.sendMessage(chatId, { text: "_Lütfen bir kullanıcıya yanıt verin!_", edit: msg.key });
            } else {
                return await sock.sendMessage(chatId, { text: "_Lütfen bir kullanıcıya yanıt verin!_" }, { quoted: rawMessage.messages[0] });
            }
        }
        quotedUser = rawMessage.messages[0]?.message?.extendedTextMessage?.contextInfo?.participant
            || rawMessage.messages[0]?.message?.conversation?.contextInfo?.participant;
    } else { // özel mesaj
        quotedUser = chatId; // DM'de direkt karşı taraf
    }

    if (quotedUser === sock.user.id.split(':')[0] + `@s.whatsapp.net`) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(chatId, { text: "_❌ Kendimi engelleyemem!_", edit: msg.key });
        } else {
            return await sock.sendMessage(chatId, { text: "_❌ Kendimi engelleyemem!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    try {
        await sock.updateBlockStatus(quotedUser, "block");
        if (msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: "_✅ Kullanıcı engellendi._", edit: msg.key });
        } else {
            await sock.sendMessage(chatId, { text: "_✅ Kullanıcı engellendi._" }, { quoted: rawMessage.messages[0] });
        }
    } catch (e) {
        if (msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: "_❌ Engelleme sırasında hata oluştu._", edit: msg.key });
        } else {
            await sock.sendMessage(chatId, { text: "_❌ Engelleme sırasında hata oluştu._" }, { quoted: rawMessage.messages[0] });
        }
    }
});

// -------------------- UNBLOCK KOMUTU --------------------
addCommand({
    pattern: "^unblock$",
    desc: "_*Bir kullanıcının engelini kaldırır.*_",
    access: "sudo",
    onlyInGroups: false  // özelde de çalışır
}, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    let quotedUser;

    if (chatId.endsWith("@g.us")) { // grup mesajı
        if (!msg.quotedMessage) {
            if (msg.key.fromMe) {
                return await sock.sendMessage(chatId, { text: "_Lütfen bir kullanıcıya yanıt verin!_", edit: msg.key });
            } else {
                return await sock.sendMessage(chatId, { text: "_Lütfen bir kullanıcıya yanıt verin!_" }, { quoted: rawMessage.messages[0] });
            }
        }
        quotedUser = rawMessage.messages[0]?.message?.extendedTextMessage?.contextInfo?.participant
            || rawMessage.messages[0]?.message?.conversation?.contextInfo?.participant;
    } else { // özel mesaj
        quotedUser = chatId; // DM'de direkt karşı taraf
    }

    if (quotedUser === sock.user.id.split(':')[0] + `@s.whatsapp.net`) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(chatId, { text: "_❌ Kendimin engelini kaldıramam!_", edit: msg.key });
        } else {
            return await sock.sendMessage(chatId, { text: "_❌ Kendimin engelini kaldıramam!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    try {
        await sock.updateBlockStatus(quotedUser, "unblock");
        if (msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: "_✅ Kullanıcının engeli kaldırıldı._", edit: msg.key });
        } else {
            await sock.sendMessage(chatId, { text: "_✅ Kullanıcının engeli kaldırıldı._" }, { quoted: rawMessage.messages[0] });
        }
    } catch (e) {
        if (msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: "_❌ Engel kaldırma sırasında hata oluştu._", edit: msg.key });
        } else {
            await sock.sendMessage(chatId, { text: "_❌ Engel kaldırma sırasında hata oluştu._" }, { quoted: rawMessage.messages[0] });
        }
    }
});
