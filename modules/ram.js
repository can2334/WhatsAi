addCommand({
    pattern: "^ram$",
    access: "sudo",
    desc: "_*Bot RAM kullanımını gösterir ve limit kontrolü yapar.*_",
    usage: ".ram",
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    // Sudo kontrolü
    let userId = msg.key.participant || msg.key.remoteJid;
    let normalizedUserId = userId.split(":")[0].replace(/\D+/g, "");
    let isSudo = global.database.sudo.some(i => i.replace(/\D+/g, "") === normalizedUserId);
    if (!isSudo) return;

    // RAM bilgileri
    const memUsage = process.memoryUsage();
    const rss = (memUsage.rss / 1024 / 1024).toFixed(2);
    const heapUsed = (memUsage.heapUsed / 1024 / 1024).toFixed(2);

    // Limit belirleyelim (opsiyonel)
    const ramLimit = 2048; // MB
    const ramWarning = rss > ramLimit ? "⚠️ RAM limiti aşıldı!" : "✅ RAM limiti güvenli";

    // Şık, süslü mesaj
    const response = `
╔════🌟 RAM DURUMU 🌟════╗
║
║ 💻 Toplam Kullanılan RAM: ${rss} MB
║ 🧠 JS Heap Kullanımı: ${heapUsed} MB
║ ⚙️ Limit Durumu: ${ramWarning}
║
╚═════════════════════════╝
`;

    // Mesaj gönder
    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: response, edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: response }, { quoted: rawMessage?.messages?.[0] });
    }
});
