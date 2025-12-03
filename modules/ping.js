addCommand({
    pattern: "^ping$",
    access: "all",
    desc: "_*Botun yanıt süresini ve istatistiklerini gösterir.*_"
}, async (msg, match, sock, rawMessage) => {
    const startTime = Date.now();

    // İlk Pong mesajı
    let publicMessage;
    if (msg.key.fromMe) {
        publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong...", edit: msg.key });
    } else {
        publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong..." }, { quoted: rawMessage.messages[0] });
    }

    const responseTime = Date.now() - startTime;

    // Emoji tepkisi
    let emoji = "⚡";
    if (responseTime >= 400) emoji = "⚠️";
    else if (responseTime >= 200) emoji = "⏳";

    // Sistem bilgisi
    const memoryUsageRSS = process.memoryUsage().rss / 1024 / 1024; // RSS olarak MB cinsinden
    const uptime = Math.floor(process.uptime());
    const uptimeHours = Math.floor(uptime / 3600);
    const uptimeMinutes = Math.floor((uptime % 3600) / 60);
    const uptimeSeconds = uptime % 60;

    const statsMessage = `
${emoji} Pong!

_Bot yanıt süresi_: ${responseTime}ms
_Bot çalışma süresi_: ${uptimeHours} saat ${uptimeMinutes} dakika ${uptimeSeconds} saniye
_Hafıza kullanımı (RSS)_: ${memoryUsageRSS.toFixed(2)} MB
`.trim();

    const editKey = msg.key.fromMe ? msg.key : publicMessage.key;

    await sock.sendMessage(msg.key.remoteJid, { text: statsMessage, edit: editKey });
});
