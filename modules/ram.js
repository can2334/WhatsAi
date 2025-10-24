addCommand({
    pattern: "^ramcheck$",
    access: "sudo",
    desc: "_*Bot RAM kullanımını gösterir ve limit kontrolü yapar.*_",
    usage: ".ramcheck",
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    // sudo kontrolü (normalize edilmiş)
    let userId = msg.key.participant || msg.key.remoteJid;
    let normalizedUserId = userId.split(":")[0].replace(/\D+/g, "");
    let isSudo = global.database.sudo.some(i => i.replace(/\D+/g, "") === normalizedUserId);
    if (!isSudo) return; // sudo değilse komutu görmez ve çalışmaz

    // RAM kontrolü
    const used = process.memoryUsage().rss / 1024 / 1024; // MB cinsinden
    const limit = 2048; // 2 GB
    let response = `📊 Bot RAM Kullanımı: ${Math.round(used)}MB\n`;
    if (used > limit) {
        response += `⚠️ RAM limiti aşıldı (${limit}MB). Bot restart edilmelidir.`;
    } else {
        response += `✅ RAM limiti güvenli (${limit}MB).`;
    }

    // Mesaj gönder
    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: response, edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: response }, { quoted: rawMessage?.messages?.[0] });
    }
});
