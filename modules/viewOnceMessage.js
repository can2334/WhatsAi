const fs = require("fs");
const path = require("path");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

// --- Normal show komutu ---
addCommand(
    {
        pattern: "^show$",
        access: "all",
        desc: "_*Bir kez görüntülenen mesajları görmenizi sağlar.*_",
    },
    async (msg, match, sock, rawMessage) => {
        const chatId = msg.key.remoteJid;

        // Yanıtlanan mesaj var mı?
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return // hiç bir şey yapma
            // return sock.sendMessage(
                // chatId,
                // { text: "_Lütfen bir kez görüntülenen bir mesaja yanıt verin!_" },
                // { quoted: msg }
            // );
        }

        try {
            const viewOnce =
                quoted?.ephemeralMessage?.message?.viewOnceMessageV2Extension?.message ||
                quoted?.ephemeralMessage?.message?.viewOnceMessageV2?.message ||
                quoted?.ephemeralMessage?.message?.viewOnceMessage?.message ||
                quoted?.viewOnceMessageV2Extension?.message ||
                quoted?.viewOnceMessageV2?.message ||
                quoted?.viewOnceMessage?.message ||
                quoted;

            const imageMsg = viewOnce.imageMessage;
            const videoMsg = viewOnce.videoMessage;

            if (!imageMsg && !videoMsg) {
                return sock.sendMessage(
                    chatId,
                    { text: "_Bu bir medya mesajı değil veya zaten görüntülenmiş!_" },
                    { quoted: msg }
                );
            }

            const isImage = !!imageMsg;
            const mediaType = isImage ? "image" : "video";
            const extension = isImage ? "jpg" : "mp4";
            const fileName = `viewOnce_${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, fileName);

            await sock.sendMessage(chatId, { text: "_⏳ İndiriliyor..._" }, { quoted: msg });

            const buffer = await downloadMediaMessage(
                { message: { viewOnceMessage: { message: viewOnce } } },
                "buffer",
                {},
                { logger: sock.logger }
            );

            fs.writeFileSync(filePath, buffer);

            await sock.sendMessage(
                chatId,
                {
                    [mediaType]: fs.readFileSync(filePath),
                    mimetype: isImage ? "image/jpeg" : "video/mp4",
                    caption: "_✅ Görüntü alındı!_",
                },
                { quoted: msg }
            );

            fs.unlinkSync(filePath);
        } catch (err) {
            console.error("Hata:", err);
            await sock.sendMessage(
                chatId,
                { text: "_❌ Medya indirilemedi. Görüntü bir kez izlenmiş veya bozuk olabilir._" },
                { quoted: msg }
            );
        }
    }
);

addCommand(
    {
        pattern: "onMessage",
        access: "all",
        desc: "_*Bir kez görüntülenen mesajları görmenizi sağlar.*_",
    },
    async (msg, match, sock, rawMessage) => {
        const chatId = msg.key.remoteJid;

        // Yanıtlanan mesaj var mı?
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return // hiç bir şey yapma
            // return sock.sendMessage(
            // chatId,
            // { text: "_Lütfen bir kez görüntülenen bir mesaja yanıt verin!_" },
            // { quoted: msg }
            // );
        }

        try {
            const viewOnce =
                quoted?.ephemeralMessage?.message?.viewOnceMessageV2Extension?.message ||
                quoted?.ephemeralMessage?.message?.viewOnceMessageV2?.message ||
                quoted?.ephemeralMessage?.message?.viewOnceMessage?.message ||
                quoted?.viewOnceMessageV2Extension?.message ||
                quoted?.viewOnceMessageV2?.message ||
                quoted?.viewOnceMessage?.message ||
                quoted;

            const imageMsg = viewOnce.imageMessage;
            const videoMsg = viewOnce.videoMessage;

            if (!imageMsg && !videoMsg) {
                return
                // return sock.sendMessage(
                //     chatId,
                //     { text: "_Bu bir medya mesajı değil veya zaten görüntülenmiş!_" },
                //     { quoted: msg }
                // );
            }

            const isImage = !!imageMsg;
            const mediaType = isImage ? "image" : "video";
            const extension = isImage ? "jpg" : "mp4";
            const fileName = `viewOnce_${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, fileName);

            // await sock.sendMessage(chatId, { text: "_⏳ İndiriliyor..._" }, { quoted: msg });

            const buffer = await downloadMediaMessage(
                { message: { viewOnceMessage: { message: viewOnce } } },
                "buffer",
                {},
                { logger: sock.logger }
            );

            fs.writeFileSync(filePath, buffer);

            await sock.sendMessage(
                sock.user.id.split(":")[0] + `@s.whatsapp.net`,
                {
                    [mediaType]: fs.readFileSync(filePath),
                    mimetype: isImage ? "image/jpeg" : "video/mp4",
                    caption: "_✅ Görüntü alındı!_",
                },
                { quoted: msg }
            );

            fs.unlinkSync(filePath);
        } catch (err) {
            console.error("Hata:", err);
            await sock.sendMessage(
                sock.user.id.split(":")[0] + `@s.whatsapp.net`,
                { text: "_❌ Medya indirilemedi. Görüntü bir kez izlenmiş veya bozuk olabilir._" },
                { quoted: msg }
            );
        }
    }
);
