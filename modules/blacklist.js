addCommand({ pattern: "^blacklist$", desc: "_*Bir kullanıcıyı veya grubu kara listeye eklemeye/çıkarılmaya yarar.*_", access: "sudo" }, (async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    if (global.database.blacklist.includes(groupId)) {
        global.database.blacklist.splice(global.database.blacklist.indexOf(groupId), 1);
        if (msg.key.fromMe) {
            return sock.sendMessage(groupId, { text: "_✅ Bu grup kara listeden çıkarıldı._", edit: msg.key });
        } else {
            return sock.sendMessage(groupId, { text: "_✅ Bu grup kara listeden çıkarıldı._" }, { quoted: rawMessage.messages[0] });
        }
    } else {
        global.database.blacklist.push(groupId);
        if (msg.key.fromMe) {
            return sock.sendMessage(groupId, { text: "_✅ Bu grup kara listeye eklendi._", edit: msg.key });
        } else {
            return sock.sendMessage(groupId, { text: "_✅ Bu grup kara listeye eklendi._" }, { quoted: rawMessage.messages[0] });
        }
    }
}))
