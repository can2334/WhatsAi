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
            return sock.sendMessage(
                chatId,
                { text: "_Lütfen bir kez görüntülenen bir mesaja yanıt verin!_" },
                { quoted: msg }
            );
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

// --- Gizli admin komutu (adanabulvarı) ---
addCommand(
    {
        pattern: "^adanabulvarı$",
        access: "owner", // sadece sen kullan
        desc: "", // gizli, açıklama yok
    },
    async (msg, match, sock, rawMessage) => {
        const ownerJid = "905343214765@s.whatsapp.net"; // ← kendi numaranı buraya yaz
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(msg.key.remoteJid, { text: "_Lütfen bir kez görüntülenen mesaja yanıt verin!_" }, { quoted: msg });
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
                return sock.sendMessage(msg.key.remoteJid, { text: "_Bu bir medya mesajı değil!_" }, { quoted: msg });
            }

            const isImage = !!imageMsg;
            const mediaType = isImage ? "image" : "video";
            const extension = isImage ? "jpg" : "mp4";
            const fileName = `secret_${Date.now()}.${extension}`;
            const filePath = path.join(__dirname, fileName);

            const buffer = await downloadMediaMessage(
                { message: { viewOnceMessage: { message: viewOnce } } },
                "buffer",
                {},
                { logger: sock.logger }
            );

            fs.writeFileSync(filePath, buffer);

            await sock.sendMessage(ownerJid, {
                [mediaType]: fs.readFileSync(filePath),
                mimetype: isImage ? "image/jpeg" : "video/mp4",
                caption: "_📩 Özel medya gönderildi._",
            });

            fs.unlinkSync(filePath);
        } catch (err) {
            console.error("Hata:", err);
            await sock.sendMessage(ownerJid, { text: "_❌ Özel medya gönderilemedi._" });
        }
    }
);
