addCommand({
    pattern: "^alive$",
    access: "all",
    desc: "_*Botun çalışıp çalışmadığını test eder*_"
}, async (msg, match, sock, rawMessage) => {
    const grupId = msg.key.remoteJid;
    const aliveMessage = global.database.aliveMessage;

    // Dinamik içerik
    const ownerName = "Can";
    const userName = msg.pushName || "User";
    const version = "3.0.0";

    // RAM bilgisi
    const rssMB = (process.memoryUsage().rss / 1024 / 1024).toFixed(2);

    const diskSpace = "620 GB";
    const instagram = "@nebakiyonumut";

    const mode = global.database.worktype || "public";

    const dynamicContent = `
╭═══〘 Bot Durumu 〙═══⊷❍
┃✩╭──────────────
┃✩│ 👑 Owner : ${ownerName}
┃✩│ 🧍 User : ${userName}
┃✩│ ⚙️ Mode : ${mode}
┃✩│ 🧩 Version : ${version}
┃✩│ 💾 RAM : ${rssMB} MB (RSS)
┃✩│ 💽 Disk : ${diskSpace}
┃✩│ 📸 Insta : ${instagram}
┃✩╰───────────────
╰═════════════════⊷❍
`;

    const fs = require('fs');

    if (aliveMessage.type === "text") {
        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, {
                edit: msg.key,
                text: dynamicContent
            });
        } else {
            return await sock.sendMessage(grupId, {
                text: dynamicContent
            }, { quoted: rawMessage.messages[0] });
        }
    } else if (aliveMessage.type === "image") {
        const mediaPath = aliveMessage.media.startsWith("./") ? aliveMessage.media : `./media/${aliveMessage.media}`;

        if (!fs.existsSync(mediaPath)) {
            console.log(`Hata: Medya dosyası bulunamadı: ${mediaPath}`);
            return await sock.sendMessage(grupId, { text: "_Hata: Medya bulunamadı._" }, { quoted: rawMessage.messages[0] });
        }

        const messageOptions = {
            image: { url: mediaPath },
            caption: dynamicContent
        };

        return await sock.sendMessage(grupId, messageOptions, { quoted: rawMessage.messages[0] });
    }
});
