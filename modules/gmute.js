addCommand({ pattern: "^gmute$", desc: "_*Bir kullanıcıyı grupta mesaj göndermekten susturur.*_", access: "all", onlyInGroups: true }, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    if (!msg.quotedMessage) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_Lütfen bir kullanıcıya yanıt verin!_", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_Lütfen bir kullanıcıya yanıt verin!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    var quotedUser = rawMessage.messages[0]?.message?.extendedTextMessage?.contextInfo?.participant || rawMessage.messages[0]?.message?.conversation?.contextInfo?.participant
    if (quotedUser === sock.user.id.split(':')[0] + `@s.whatsapp.net`) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Kendimi susturamam!_", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Kendimi susturamam!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    const admins = await global.getAdmins(msg.key.remoteJid);
    if (!admins.includes(msg.key.participant)) {
        if (msg.key.fromMe) {
            return sock.sendMessage(groupId, { text: "_❌ Bu grupta yönetici değilsiniz!_", edit: msg.key })
        } else {
            return sock.sendMessage(groupId, { text: "_❌ Bu grupta yönetici değilsiniz!_", quoted: rawMessage.messages[0] })
        }
    }

    if (!await global.checkAdmin(msg, sock, groupId)) {
        console.log("checkAdmin false döndü:", sock.user.id);
        // return satırını sil veya yorum satırı yap
    }


    const find = global.database.globalMutes.find(x => x.chat === msg.key.remoteJid);

    if (!find) {
        global.database.globalMutes.push({
            chat: msg.key.remoteJid,
            users: [quotedUser]
        });
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta susturuldu._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta susturuldu._" }, { quoted: rawMessage.messages[0] });
        }
    } else {
        if (find.users.includes(quotedUser)) {
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten bu grupta susturulmuş._", edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten bu grupta susturulmuş._" }, { quoted: rawMessage.messages[0] });
            }
        } else {
            global.database.globalMutes.find(x => x.chat === msg.key.remoteJid).users.push(quotedUser);
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta susturuldu._", edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta susturuldu._" }, { quoted: rawMessage.messages[0] });
            }
        }
    }
});

addCommand({ pattern: "^ungmute$", desc: "_*Bir kullanıcıyı grupta mesaj göndermeye açar.*_", access: "all", onlyInGroups: true }, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    if (!msg.quotedMessage) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_Lütfen bir kullanıcıya yanıt verin!_", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_Lütfen bir kullanıcıya yanıt verin!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    var quotedUser = rawMessage.messages[0]?.message?.extendedTextMessage?.contextInfo?.participant || rawMessage.messages[0]?.message?.conversation?.contextInfo?.participant
    if (quotedUser === sock.user.id.split(':')[0] + `@s.whatsapp.net`) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Kendimi açamam!_", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Kendimi açamam!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    const admins = await global.getAdmins(msg.key.remoteJid);
    if (!admins.includes(msg.key.participant)) {
        if (msg.key.fromMe) {
            return sock.sendMessage(groupId, { text: "_❌ Bu grupta yönetici değilsiniz!_", edit: msg.key })
        } else {
            return sock.sendMessage(groupId, { text: "_❌ Bu grupta yönetici değilsiniz!_", quoted: rawMessage.messages[0] })
        }
    }

    if (!await global.checkAdmin(msg, sock, groupId)) {
        // return satırını sil veya yorum satırı yap
    }

    const find = global.database.globalMutes.find(x => x.chat === msg.key.remoteJid);

    if (!find) {
        global.database.globalMutes.push({
            chat: msg.key.remoteJid,
            users: []
        });
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten mesaj gönderebilir._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten mesaj gönderebilir._" }, { quoted: rawMessage.messages[0] });
        }
    } else {
        if (find.users.includes(quotedUser)) {
            global.database.globalMutes.find(x => x.chat === msg.key.remoteJid).users.splice(find.users.indexOf(quotedUser), 1);
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta açıldı._", edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text: "_✅ Kullanıcı bu grupta açıldı._" }, { quoted: rawMessage.messages[0] });
            }
        } else {
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten mesaj gönderebilir._", edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text: "_❌ Kullanıcı zaten mesaj gönderebilir._" }, { quoted: rawMessage.messages[0] });
            }
        }
    }
});

addCommand({ pattern: "onMessage", dontAddCommandList: true, access: "all" }, async (msg, match, sock) => {
    const mutes = global.database.globalMutes.find(x => x.chat === msg.key.remoteJid);
    if (mutes?.users?.includes(msg.key.participant)) {
        try {
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
        } catch { }
    }
})
