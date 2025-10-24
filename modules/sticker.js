// bağımlılıkları ekle
const fs = require('fs')
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
ffmpeg.setFfmpegPath(ffmpegPath);
const axios = require('axios');
const formData = require('form-data');

/**
 * Animasyonlu WebP dosyasını MP4 formatına dönüştürür.
 * 
 * Bu fonksiyon, animasyonlu bir WebP dosyasını çevrimiçi bir dönüştürücüye
 * yükler ve MP4 formatına çevirir. Dönüşüm tamamlanana kadar durumu kontrol eder,
 * ardından MP4 dosyasını buffer olarak indirir.
 * 
 * @param {string} file - Dönüştürülecek WebP dosyasının yolu.
 * @returns {Promise<Buffer|string>} - Dönüştürülmüş MP4 dosyasını buffer olarak döndürür veya başarısızsa boş string.
 */
async function animatedWebpToMp4(file) {
    var form = new formData();
    form.append("file", fs.createReadStream(file));
    form.append("from", "webp");
    form.append("to", "mp4");
    form.append("class", "video");
    form.append("source", "online");
    var job = await axios({
        url: "https://host40.onlineconverter.com/file/send",
        method: "POST",
        headers: form.getHeaders(),
        data: form
    })
    var status = "c"
    while (status == "c" || status == "s") {
        var status = await axios({
            url: "https://host40.onlineconverter.com/file/" + job.data.split("convert/")[1],
            method: "GET"
        })
        status = status.data.trim()
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    if (status == "d") {
        var getFile = await axios({
            url: "https://host40.onlineconverter.com/file/" + job.data.split("convert/")[1] + "/download",
            method: "GET",
            responseType: "arraybuffer"
        })
        return getFile.data
    } else {
        return ""
    }
}

addCommand({ pattern: "^sticker$", access: "all", desc: "_*Medya dosyasını sticker'a dönüştürür veya her ikisini yapar.*_" }, async (msg, match, sock, rawMessage) => {
    if (!msg.quotedMessage) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir resim, video veya sticker'a cevap verin!_", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir resim, video veya sticker'a cevap verin!_" }, { quoted: rawMessage.messages[0] });
        }
    }
    if (msg.key.fromMe) {
        await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Dönüştürülüyor.._", edit: msg.key });
    } else {
        var publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Dönüştürülüyor.._" }, { quoted: rawMessage.messages[0] });
    }

    if (msg.quotedMessage.imageMessage) {
        const imagePath = "./src/sticker" + Math.floor(Math.random() * 100) + ".png";
        const imagePath2 = "./src/sticker" + Math.floor(Math.random() * 10000) + ".webp";
        await global.downloadMedia(msg.quotedMessage.imageMessage, "image", imagePath);
        ffmpeg(imagePath).outputOptions(["-y", "-vcodec libwebp"]).videoFilters('scale=2000:2000:flags=lanczos:force_original_aspect_ratio=decrease,format=rgba,pad=2000:2000:(ow-iw)/2:(oh-ih)/2:color=#00000000,setsar=1').save(imagePath2).on('end', async () => {
            if (msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
                await sock.sendMessage(msg.key.remoteJid, { sticker: { url: imagePath2 } });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
                await sock.sendMessage(msg.key.remoteJid, { sticker: { url: imagePath2 } }, { quoted: rawMessage.messages[0] });
            }
            [imagePath, imagePath2].forEach(file => {
                if (fs.existsSync(file)) try { fs.unlinkSync(file) } catch { }
            });
            return
        });
    } else if (msg.quotedMessage?.stickerMessage) {
        if (msg.quotedMessage.stickerMessage.isAnimated) {
            if (msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { text: "_Lütfen animasyonlu sticker'ları dönüştürmek için_ ```" + global.handlers[0] + "vsticker``` _komutunu kullanın!_", edit: msg.key });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { text: "_Lütfen animasyonlu sticker'ları dönüştürmek için_ ```" + global.handlers[0] + "vsticker``` _komutunu kullanın!_", edit: publicMessage.key });
            }
            return;
        } else {
            const stickerPath = "./src/sticker" + Math.floor(Math.random() * 100) + ".webp";
            await global.downloadMedia(msg.quotedMessage.stickerMessage, "sticker", stickerPath);
            if (msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
                await sock.sendMessage(msg.key.remoteJid, { image: { url: stickerPath } });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
                await sock.sendMessage(msg.key.remoteJid, { image: { url: stickerPath } }, { quoted: rawMessage.messages[0] });
            }
            [stickerPath].forEach(file => {
                if (fs.existsSync(file)) try { fs.unlinkSync(file) } catch { }
            });
        }
        return;
    } else if (msg.quotedMessage?.videoMessage) {
        const vvpth = "./src/sticker" + Math.floor(Math.random() * 100) + ".mp4";
        const vpth = "./src/sticker" + Math.floor(Math.random() * 10000) + ".webp";
        await global.downloadMedia(msg.quotedMessage.videoMessage, "video", vvpth);
        ffmpeg(vvpth).addOutputOptions([
            "-vcodec",
            "libwebp",
            "-vf",
            "scale='min(320,iw)':min'(320,ih)':force_original_aspect_ratio=decrease,fps=15, pad=320:320:-1:-1:color=white@0.0, split [a][b]; [a] palettegen=reserve_transparent=on:transparency_color=ffffff [p]; [b][p] paletteuse",
            "-loop",
            "0",
            "-ss",
            "00:00:00",
            "-t",
            "00:00:05",
            "-preset",
            "default",
            "-an",
            "-vsync",
            "0"
        ])
            .toFormat("webp").save(vpth).on('end', async () => {
                if (msg.key.fromMe) {
                    await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
                    await sock.sendMessage(msg.key.remoteJid, { sticker: { url: vpth, isAnimated: true } }, { isAnimated: true });
                } else {
                    await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
                    await sock.sendMessage(msg.key.remoteJid, { sticker: { url: vpth, isAnimated: true } }, { quoted: rawMessage.messages[0] });
                }
                [vvpth, vpth].forEach(file => {
                    if (fs.existsSync(file)) try { fs.unlinkSync(file) } catch { }
                });
                return
            });
    } else {
        if (msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir resim veya sticker'a cevap verin!_", edit: msg.key });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir resim veya sticker'a cevap verin!_", edit: publicMessage.key });
        }
        return;
    }
})

addCommand({ pattern: "^vsticker$", access: "all", desc: "_*Animasyonlu sticker'ları videoya dönüştürür.*_" }, async (msg, match, sock, rawMessage) => {

    if (!msg.quotedMessage) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir video veya animasyonlu sticker'a cevap verin!_", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir video veya animasyonlu sticker'a cevap verin!_" }, { quoted: rawMessage.messages[0] });
        }
    }

    if (msg.key.fromMe) {
        await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Dönüştürülüyor.._", edit: msg.key });
    } else {
        var publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Dönüştürülüyor.._" }, { quoted: rawMessage.messages[0] });
    }

    if (msg.quotedMessage?.stickerMessage) {
        const stickerPath = "./src/sticker" + Math.floor(Math.random() * 100) + ".webp";
        const stickerPath2 = "./src/sticker" + Math.floor(Math.random() * 100) + ".mp4";
        await global.downloadMedia(msg.quotedMessage.stickerMessage, "sticker", stickerPath);
        var mp4Data = await animatedWebpToMp4(stickerPath)
        fs.writeFileSync(stickerPath2, mp4Data)

        if (animatedWebpToMp4 == "") {
            if (msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Animasyonlu sticker dönüştürülürken hata oluştu!_", edit: msg.key });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Animasyonlu sticker dönüştürülürken hata oluştu!_", edit: publicMessage.key });
            }
        } else {
            if (msg.key.fromMe) {
                await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
                await sock.sendMessage(msg.key.remoteJid, { video: { url: stickerPath2 } });
            } else {
                await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
                await sock.sendMessage(msg.key.remoteJid, { video: { url: stickerPath2 } }, { quoted: rawMessage.messages[0] });
            }
        }
        [stickerPath, stickerPath2].forEach(file => {
            if (fs.existsSync(file)) try { fs.unlinkSync(file) } catch { }
        });
        return;

    } else {
        if (msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir video veya sticker'a cevap verin!_", edit: msg.key });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen bir video veya sticker'a cevap verin!_", edit: publicMessage.key });
        }
        return;
    }
})
