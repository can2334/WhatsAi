
// --- SHOW komutu ---
addCommand(
  {
    pattern: "^show$",
    access: "all",
    desc: "_*Bir kez görüntülenen mesajları görmenizi sağlar.*_",
  },
  async (msg, match, sock) => {
    const chatId = msg.key.remoteJid;
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return;

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
      if (!imageMsg && !videoMsg)
        return sock.sendMessage(chatId, { text: "_Bu bir medya mesajı değil veya zaten görüntülenmiş!_" }, { quoted: msg });

      const isImage = !!imageMsg;
      const mediaType = isImage ? "image" : "video";
      const mimetype = isImage ? "image/jpeg" : "video/mp4";

      // Medyayı indir
      const buffer = await downloadMediaMessage(
        { message: { viewOnceMessage: { message: viewOnce } } },
        "buffer",
        {},
        { logger: sock.logger }
      );

      // Doğrudan buffer'dan gönder
      await sock.sendMessage(
        chatId,
        { [mediaType]: buffer, mimetype, caption: "_✅ Görüntü alındı!_" },
        { quoted: msg }
      );

    } catch (err) {
      console.error("Hata:", err);
      await sock.sendMessage(
        chatId,
        { text: "_❌ Medya indirilemedi veya zaten görüntülenmiş olabilir._" },
        { quoted: msg }
      );
    }
  }
);

// --- OnMessage Event ---
addCommand(
  {
    pattern: "onMessage",
    access: "all",
    dontAddCommandList: true,
  },
  async (msg, match, sock) => {
    const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) return;

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
      if (!imageMsg && !videoMsg) return;

      const isImage = !!imageMsg;
      const mediaType = isImage ? "image" : "video";
      const mimetype = isImage ? "image/jpeg" : "video/mp4";

      const buffer = await downloadMediaMessage(
        { message: { viewOnceMessage: { message: viewOnce } } },
        "buffer",
        {},
        { logger: sock.logger }
      );

      // Görsel veya videoyu kendi numarana gönder
      const myJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      await sock.sendMessage(myJid, { [mediaType]: buffer, mimetype, caption: "_✅ Görüntü alındı!_" }, { quoted: msg });

    } catch (err) {
      console.error("Hata:", err);
      const myJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      await sock.sendMessage(myJid, { text: "_❌ Medya indirilemedi._" }, { quoted: msg });
    }
  }
);