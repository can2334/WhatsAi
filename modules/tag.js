addCommand({
    pattern: "^tagall ?([\\s\\S]*)",
    desc: "_*Grup içindeki tüm kullanıcıları etiketlemenizi sağlar.*_",
    access: "all",
    onlyInGroups: true
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    const groupMetadata = await sock.groupMetadata(groupId);
    const participants = groupMetadata.participants.map(p => p.id);

    let mentionText;
    if (match[1]) {
        mentionText = match[1];
    } else {
        mentionText = participants.map(id => `• @${id.split("@")[0]}\n`).join("");
    }

    if (msg.key.fromMe) {
        return sock.sendMessage(groupId, { text: mentionText, mentions: participants, edit: msg.key });
    } else {
        return sock.sendMessage(groupId, { text: mentionText, mentions: participants }, { quoted: rawMessage.messages[0] });
    }
});

addCommand({
    pattern: "^tagadmin ?([\\s\\S]*)",
    desc: "_*Grup yöneticilerini etiketlemenizi sağlar.*_",
    access: "all",
    onlyInGroups: true
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    const groupMetadata = await sock.groupMetadata(groupId);
    const admins = groupMetadata.participants
        .filter(p => p.admin === 'admin' || p.admin === 'superadmin')
        .map(p => p.id);

    let mentionText;
    if (match[1]) {
        mentionText = match[1];
    } else {
        mentionText = admins.map(id => `• @${id.split("@")[0]}\n`).join("");
    }

    if (msg.key.fromMe) {
        return sock.sendMessage(groupId, { text: mentionText, mentions: admins, edit: msg.key });
    } else {
        return sock.sendMessage(groupId, { text: mentionText, mentions: admins }, { quoted: rawMessage.messages[0] });
    }
});
