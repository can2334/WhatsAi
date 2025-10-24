/**
 * Konfigürasyonları düzenlemek için komut ekler.
 * 
 * @param {Object} command - Komut nesnesi.
 * @param {string} command.pattern - Komutu eşleştirmek için regex deseni.
 * @param {boolean} command.fromMe - Komut kullanıcının kendisinden mi.
 * @param {boolean} command.notAvaliablePersonelChat - Komut kişisel sohbette kullanılamaz mı.
 * @param {string} command.desc - Komut açıklaması.
 * @param {string} command.usage - Komut kullanımı.
 * @param {Function} callback - Komutu işleyen callback fonksiyonu.
 * @param {Object} msg - Mesaj nesnesi.
 * @param {Array} match - Komut ile eşleşen desenler.
 * @param {Object} sock - Mesaj gönderme için socket nesnesi.
 * 
 * @returns {Promise<void>}
*/
const fs = require('fs');

addCommand({
    pattern: "^edit ?(.*)",
    access: "sudo",
    notAvaliablePersonelChat: true,
    desc: "_*Konfigürasyonları düzenle.*_",
    usage: global.handlers[0] + "edit <alive || afk || welcome || goodbye>\n Örnek : .edit alive aktifim"
}, async (msg, match, sock, rawMessage) => {
    const grupId = msg.key.remoteJid;

    // Eğer hangi konfigürasyon düzenleneceği belirtilmemişse
    if (!match[1]) {
        const mesaj = "_Lütfen düzenlemek istediğiniz konfigürasyonu girin._\n\n_Mevcut Konfigürasyonlar ::_ ```alive, welcome, goodbye, afk```";
        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
        } else {
            return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
        }
    }

    // Eğer mesaj alıntısı yoksa ve silme işlemi değilse
    if (!msg.quotedMessage && !match[1].includes("del")) {
        const mesaj = "_Lütfen düzenlemek için bir mesaja veya medyaya yanıt verin._";
        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
        } else {
            return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
        }
    }

    /*
        Bu yorum sadece geliştiriciye rehberlik ediyor:
        Text Messages = msg.quotedMessage.extendedTextMessage.text 
        Image Messages = msg.quotedMessage.imageMessage
        Video Messages = msg.quotedMessage.videoMessage
        Audio Messages = msg.quotedMessage.audioMessage
        Document Messages = msg.quotedMessage.documentMessage
        Sticker Messages = msg.quotedMessage.stickerMessage
        Location Messages = msg.quotedMessage.locationMessage
        Contact Messages = msg.quotedMessage.contactMessage
        Ptv Messages = msg.quotedMessage.ptvMessage (Video Note)
        View Once Messages = msg.quotedMessage.viewOnceMessage
        View Once V2 Messages = msg.quotedMessage.viewOnceMessageV2
        View Once Messages Extension = msg.quotedMessage.viewOnceMessageV2Extension
    */

    // Konfigürasyonu güncelleyen fonksiyon
    const updateMessage = async (type, mediaPath, content, configType) => {
        const configMap = {
            alive: 'aliveMessage',
            welcome: 'welcomeMessage',
            goodbye: 'goodbyeMessage',
            afk: 'afkMessage'
        };
        const configKey = configMap[configType];

        if (configType === 'alive') {
            global.database[configKey] = { type, media: mediaPath ? fs.readFileSync(mediaPath, "base64").toString() : "", content };
        } else if (configType === "afk") {
            global.database[configKey] = { type, media: mediaPath ? fs.readFileSync(mediaPath, "base64").toString() : "", content, active: false };
        } else {
            let config = global.database[configKey].find(x => x.chat === grupId);
            if (!config) {
                global.database[configKey].push({ chat: grupId, type, media: mediaPath ? fs.readFileSync(mediaPath, "base64").toString() : "", content });
            } else {
                config.type = type;
                config.media = mediaPath ? fs.readFileSync(mediaPath, "base64").toString() : "";
                config.content = content;
            }
        }

        let toDelMessage = "";
        if (configType == "welcome") toDelMessage = "\n\n_Silmek için_ ```" + global.handlers[0] + "edit del welcome```";
        if (configType == "goodbye") toDelMessage = "\n\n_Silmek için_ ```" + global.handlers[0] + "edit del goodbye```";
        if (configType == "afk") toDelMessage = "\n\n_Silmek için_ ```" + global.handlers[0] + "edit del afk```";

        const mesaj = `_✅ ${configType.charAt(0).toUpperCase() + configType.slice(1)} mesajı başarıyla güncellendi._` + toDelMessage;

        if (msg.key.fromMe) {
            return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
        } else {
            return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
        }
    };

    const { imageMessage, videoMessage, extendedTextMessage, conversation } = msg.quotedMessage || {};
    const configType = match[1];

    if (["alive", "welcome", "goodbye", "afk"].includes(configType)) {
        if (imageMessage) {
            const mediaPath = `./${configType}.png`;
            await global.downloadMedia(imageMessage, "image", mediaPath);
            return await updateMessage("image", mediaPath, imageMessage.caption || "", configType);
        } else if (videoMessage) {
            const mediaPath = `./${configType}.mp4`;
            await global.downloadMedia(videoMessage, "video", mediaPath);
            return await updateMessage("video", mediaPath, videoMessage.caption || "", configType);
        } else if (extendedTextMessage) {
            return await updateMessage("text", "", extendedTextMessage.text, configType);
        } else if (conversation) {
            return await updateMessage("text", "", conversation, configType);
        } else {
            const mesaj = "_❌ Desteklenmeyen mesaj türü._";
            if (msg.key.fromMe) {
                return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
            } else {
                return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
            }
        }
    }

    // Mesaj silme işlemleri
    if (["del welcome", "del goodbye", "del afk"].includes(configType)) {
        let config = configType === "del welcome" ? global.database.welcomeMessage.find(x => x.chat === grupId)
            : configType === "del afk" ? (global.database.afkMessage.active == false ? false : global.database.afkMessage)
                : global.database.goodbyeMessage.find(x => x.chat === grupId);

        if (!config) {
            const mesaj = "_❌ " + (configType === "del welcome" ? "Welcome" : configType === "del afk" ? "AFK" : "Goodbye") + " mesajı bulunamadı._";
            if (msg.key.fromMe) {
                return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
            } else {
                return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
            }
        } else {
            if (configType === "del welcome") {
                global.database.welcomeMessage = global.database.welcomeMessage.filter(x => x.chat !== grupId);
            } else if (configType === "del afk") {
                global.database.afkMessage.active = false;
                global.database.afkMessage.content = "";
                global.database.afkMessage.media = "";
                global.database.afkMessage.type = "text";

                const mesaj = "_✅ AFK mesajı başarıyla silindi._";
                if (msg.key.fromMe) {
                    return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
                } else {
                    return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
                }
            } else {
                global.database.goodbyeMessage = global.database.goodbyeMessage.filter(x => x.chat !== grupId);
            }

            const mesaj = "_✅ " + (configType === "del welcome" ? "Welcome" : "Goodbye") + " mesajı başarıyla silindi._";
            if (msg.key.fromMe) {
                return await sock.sendMessage(grupId, { text: mesaj, edit: msg.key });
            } else {
                return await sock.sendMessage(grupId, { text: mesaj }, { quoted: rawMessage.messages[0] });
            }
        }
    }
});
