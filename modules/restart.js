addCommand({
    pattern: "^\\.?restart$", // hem restart hem de .restart için
    desc: "_*Botu yeniden başlatır.*_",
    access: "sudo",
    onlyInGroups: false
}, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;

    // Console'a yazdır, komut algılandı mı
    console.log(`[COMMAND] restart komutu algılandı. Kullanıcı: ${msg.key.participant || chatId}`);

    // Sudo kontrolü
    const userId = msg.key.participant || msg.key.remoteJid;
    const normalizedUserId = userId.split(":")[0].replace(/\D+/g, "");
    // const isSudo = global.database.sudo.some(i => i.replace(/\D+/g, "") === normalizedUserId);
    // if (!isSudo) {
    //     console.log(`[COMMAND] restart komutu: kullanıcı sudo değil!`);
    //     return; // sudo değilse çık
    // }

    // WhatsApp mesajı gönder
    try {
        if (msg.key.fromMe) {
            await sock.sendMessage(chatId, { text: "♻️ Bot yeniden başlatılıyor...", edit: msg.key });
        } else if (rawMessage && rawMessage.messages && rawMessage.messages[0]) {
            await sock.sendMessage(chatId, { text: "♻️ Bot yeniden başlatılıyor..." }, { quoted: rawMessage.messages[0] });
        } else {
            await sock.sendMessage(chatId, { text: "♻️ Bot yeniden başlatılıyor..." });
        }
        console.log(`[COMMAND] restart mesajı kullanıcıya gönderildi.`);
    } catch (err) {
        console.error(`[COMMAND] mesaj gönderilirken hata:`, err);
    }

    // PM2 restart
    const { exec } = require('child_process');
    exec("pm2 restart all", (err, stdout, stderr) => {
        if (err) console.error("[COMMAND] PM2 restart hatası:", err);
        else console.log("[COMMAND] PM2 restart başarılı:", stdout);
    });
});
