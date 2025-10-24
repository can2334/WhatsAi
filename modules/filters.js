addCommand({ pattern: "onMessage", dontAddCommandList: true, access: "all" }, async (msg, match, sock, rawMessage) => {
    const chatFilters = global.database.filters.find(f => f.chat === msg.key.remoteJid && f.active);
    if (!chatFilters || chatFilters.filters.length === 0) return;

    for (const filter of chatFilters.filters) {
        if (new RegExp(filter.incoming, "i").test(msg.text)) { // Küçük/büyük harf farkı yok
            if (!msg.text.startsWith(".filter add") && !msg.text.startsWith(".filter delete") && !msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { text: filter.outgoing }, { quoted: rawMessage.messages[0] });
            }
        }
    }
});

addCommand({
    pattern: "^filter ?([\\s\\S]*)",
    access: "all",
    desc: "_*Sohbetlerde otomatik cevap verecek filtreler ekler. Regexp destekler.*_",
    usage: `${global.handlers[0]}filter - ${global.handlers[0]}filter <add || delete || on || off>\nÖrnek: ${global.handlers[0]}filter add sa Selam!`
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    if (!groupId.endsWith("@g.us")) return; // DM’yi yok say

    // Admin + sudo kontrolü
    const isSudo = global.sudo?.includes(msg.key.fromMe ? sock.user.id.split(':')[0] + "@s.whatsapp.net" : msg.key.participant);
    const admins = await global.getAdmins(groupId);
    const isAdmin = admins.includes(msg.key.participant);
    if (!isSudo && !isAdmin) return await sock.sendMessage(groupId, { text: "_Bu komutu kullanmak için admin veya sudo olmalısınız!_" }, { quoted: rawMessage.messages[0] });

    // Filtreleri bul veya oluştur
    let chatFilters = global.database.filters.find(f => f.chat === groupId);
    if (!chatFilters) {
        chatFilters = { chat: groupId, active: true, filters: [] };
        global.database.filters.push(chatFilters);
    }

    const arg = match[1].trim();

    if (!arg) {
        if (chatFilters.filters.length === 0) return await sock.sendMessage(groupId, { text: "_❌ Filtre bulunamadı._" }, { quoted: rawMessage.messages[0] });
        let text = "📜 _Bu sohbetteki filtreler_\n" + chatFilters.filters.map((f, i) => `\n*${i + 1}.* \`${f.incoming}\` -> \`${f.outgoing}\``).join('');
        text += chatFilters.active ? `\n\n*🟢 Filtreler bu sohbette aktif*` : `\n\n*🔴 Filtreler bu sohbette devre dışı*`;
        return await sock.sendMessage(groupId, { text }, { quoted: rawMessage.messages[0] });
    }

    if (arg.toLowerCase().startsWith("delete")) {
        const toDelete = arg.replace(/delete/i, "").trim();
        const index = chatFilters.filters.findIndex(f => f.incoming.toLowerCase() === toDelete.toLowerCase());
        if (index !== -1) {
            chatFilters.filters.splice(index, 1);
            return await sock.sendMessage(groupId, { text: `_✅ Filtre başarıyla silindi._\n_Silinen filtre ::_ \`${toDelete}\`` }, { quoted: rawMessage.messages[0] });
        }
        return await sock.sendMessage(groupId, { text: "_❌ Filtre bulunamadı._" }, { quoted: rawMessage.messages[0] });
    }

    if (arg.toLowerCase().startsWith("add")) {
        const [incoming, ...outParts] = arg.replace(/add/i, "").trim().split(" ");
        const outgoing = outParts.join(" ").trim();
        if (!incoming || !outgoing) return await sock.sendMessage(groupId, { text: "_❌ Geçersiz filtre formatı!_\n_Kullanım_ `.filter add <incoming> <outgoing>`" }, { quoted: rawMessage.messages[0] });

        const existing = chatFilters.filters.find(f => f.incoming.toLowerCase() === incoming.toLowerCase());
        if (existing) existing.outgoing = outgoing;
        else chatFilters.filters.push({ incoming, outgoing });

        return await sock.sendMessage(groupId, { text: "_✅ Filtre başarıyla eklendi/güncellendi._" }, { quoted: rawMessage.messages[0] });
    }

    if (arg.toLowerCase().startsWith("on") || arg.toLowerCase().startsWith("off")) {
        chatFilters.active = arg.toLowerCase().startsWith("on");
        return await sock.sendMessage(groupId, { text: chatFilters.active ? "_✅ Filtreler aktif edildi._" : "_✅ Filtreler devre dışı bırakıldı._" }, { quoted: rawMessage.messages[0] });
    }

    return await sock.sendMessage(groupId, { text: "_❌ Geçersiz komut!_" }, { quoted: rawMessage.messages[0] });
});
