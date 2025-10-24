addCommand({ pattern: "^afk$", access: "sudo", desc: "_*Afk modunu açıp kapamaya yarar*_" }, async (msg, match, sock, rawMessage) => {
    const grupId = msg.key.remoteJid;
    const afkMessage = global.database.afkMessage;

    if (afkMessage.active) {
        global.database.afkMessage.active = false;
        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, { text: "_✅AFK modu başarıyla devre dışı bırakıldı._", edit: msg.key });
        } else {
            return await sock.sendMessage(grupId, { text: "_✅AFK modu başarıyla devre dışı bırakıldı._" }, { quoted: rawMessage.messages[0] });
        }
    } else {
        global.database.afkMessage.active = true;
        if (afkMessage.type == "text" && afkMessage.content == "") {
            global.database.afkMessage.content = "_*Şuanda müsait değilim lütfen daha sonra bana ulaşın bu (bir bot mesajıdır)*_";
        }
        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, { text: "_✅AFK modu başarıyla etkinleştirildi._", edit: msg.key });
        } else {
            return await sock.sendMessage(grupId, { text: "_✅AFK modu başarıyla etkinleştirildi._" }, { quoted: rawMessage.messages[0] });
        }
    }
});