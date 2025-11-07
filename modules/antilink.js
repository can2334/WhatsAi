if (!global.database.antilink) global.database.antilink = [];

function getMessageText(msg) {
    return (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ""
    );
}

addCommand({
    pattern: "antilink",
    fromMe: true,
    desc: "Antilink özelliğini aç/kapat",
}, async (msg, match, sock) => {
    const groupId = msg.key.remoteJid;

    let text = msg.body || getMessageText(msg);
    text = text.split(" ").slice(1).join(" ").trim().toLowerCase();

    if (!text) {
        const status = global.database.antilink.includes(groupId) ? "🟢 Açık" : "🔴 Kapalı";
        return await sock.sendMessage(groupId, {
            text: `📘 Kullanım: *.antilink on* veya *.antilink off*\nDurum: ${status}`
        });
    }

    if (text === "on") {
        if (!global.database.antilink.includes(groupId)) {
            global.database.antilink.push(groupId);
            await sock.sendMessage(groupId, { text: "✅ Antilink aktif edildi!" });
        } else {
            await sock.sendMessage(groupId, { text: "⚠️ Antilink zaten aktif!" });
        }
    } else if (text === "off") {
        global.database.antilink = global.database.antilink.filter(id => id !== groupId);
        await sock.sendMessage(groupId, { text: "❌ Antilink devre dışı bırakıldı!" });
    } else {
        await sock.sendMessage(groupId, { text: "❓ Kullanım: *.antilink on* veya *.antilink off*" });
    }
});
addCommand({
    pattern: "onMessage",
    access: "all",
    dontAddCommandList: true
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    if (!groupId || !groupId.endsWith("@g.us")) return;
    if (!global.database?.antilink?.includes(groupId)) return;

    const message = msg.message || msg.messages?.[0]?.message;
    if (!message) return;

    let text = (
        message.conversation ||
        message?.extendedTextMessage?.text ||
        message?.imageMessage?.caption ||
        message?.videoMessage?.caption ||
        ""
    ).toLowerCase();

    if (!text) return;

    // WhatsApp linkleri: chat.whatsapp.com ve wa.me
    const waLinkRegex = /(wa\.me\/\d+)|(chat\.whatsapp\.com\/[A-Za-z0-9_-]+)/gi;
    const matches = text.match(waLinkRegex);

    if (matches && matches.length > 0) {
        console.log("🔗 WhatsApp linki algılandı:", matches);
        console.log("📌 Gönderen:", msg.key.participant);
        console.log("📌 Mesaj:", text);

        try {
            const sender = msg.key.participant || msg.key.remoteJid;
            const botJid = sock.user?.id; // Botun kendi JID'i

            // 1️ Bot kendi mesajını veya kendi numarasını atmaz
            if (sender === botJid || msg.key.fromMe) return;

            // Grup metadata al
            const metadata = await sock.groupMetadata(groupId);
            const participant = metadata.participants.find(p => p.id === sender);

            //  Admin veya owner ise atmaz
            if (participant?.admin === "admin" || participant?.admin === "superadmin") return;

            //  Grubun kendi davet linki ise işlem yapma
            const inviteObj = await sock.groupInviteCode(groupId);
            const inviteCode = inviteObj?.inviteCode || inviteObj;
            const groupInviteLink = `https://chat.whatsapp.com/${inviteCode}`.toLowerCase();

            if (matches.some(link => link === groupInviteLink)) {
                await sock.sendMessage(groupId, {
                    text: `🔗 Grup Davet Linki: ${groupInviteLink} paylaşıldı, işlem yapılmadı!`
                }, { quoted: msg });
                return;
            }

            // Ban işlemi
            const result = await sock.groupParticipantsUpdate(groupId, [sender], "remove");
            if (result) {
                await sock.sendMessage(groupId, {
                    text: `_❌ WhatsApp linki gönderildiği için kişi gruptan atıldı!_`,
                    mentions: [sender]
                });
            } else {
                await sock.sendMessage(groupId, {
                    text: "_❌ Kişiyi atamadım (yetki yok veya hata)._",
                    mentions: [sender]
                });
            }
        } catch (err) {
            console.error("Ban hatası:", err);
        }
    }
});
