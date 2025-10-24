addCommand({
    pattern: "^restart$",
    access: "sudo",
    desc: "_*Botu yeniden başlatır.*_",
    usage: ".restart",
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    // sudo kontrolü
    let userId = msg.key.participant || msg.key.remoteJid;
    let normalizedUserId = userId.split(":")[0].replace(/\D+/g, "");
    let isSudo = global.database.sudo.some(i => i.replace(/\D+/g, "") === normalizedUserId);
    if (!isSudo) return;

    // Uyarı mesajı
    const text = "♻️ Bot yeniden başlatılıyor...";
    try {
        if (msg.key.fromMe) {
            await sock.sendMessage(groupId, { text, edit: msg.key });
        } else if (rawMessage && rawMessage.messages && rawMessage.messages[0]) {
            await sock.sendMessage(groupId, { text }, { quoted: rawMessage.messages[0] });
        } else {
            await sock.sendMessage(groupId, { text });
        }
    } catch (err) {
        console.error("Mesaj gönderilirken hata:", err);
    }

    console.log("Bot restart komutu ile yeniden başlatılıyor...");
    process.exit(1); // PM2 veya başka process manager varsa otomatik yeniden başlatır
});
