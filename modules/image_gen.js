var axios = require('axios');
var fs = require('fs');

var runningProcesses = [];
setInterval(async () => {
    if (runningProcesses.length > 0) {
        var index = 0;
        while (index < runningProcesses.length) {
            index++
            var getGenerationStatus = await axios.get(runningProcesses[index - 1].url);

            if (getGenerationStatus.data.status == 200) {
                const tempProcess = runningProcesses
                runningProcesses = runningProcesses.filter(x => x.url != tempProcess[index - 1].url);

                var mediaPath = "./src/Thena" + Math.floor(Math.random() * 100) + ".png";
                fs.writeFileSync(mediaPath, getGenerationStatus.data.image, 'base64');

                try { await tempProcess[index - 1].sock.sendMessage(tempProcess[index - 1].groupId, { delete: tempProcess[index - 1].messageId }) } catch { }
                try { await tempProcess[index - 1].sock.sendMessage(tempProcess[index - 1].groupId, { image: { url: mediaPath }, caption: tempProcess[index - 1].caption }) } catch { }

                try { fs.unlinkSync(mediaPath) } catch { }
            } else {
                if (getGenerationStatus.data.status != 202) {
                    const tempProcess = runningProcesses
                    runningProcesses = runningProcesses.filter(x => x.url != tempProcess[index - 1].url);

                    try { await tempProcess[index - 1].sock.sendMessage(tempProcess[index - 1].groupId, { delete: tempProcess[index - 1].messageId }) } catch { }
                    await tempProcess[index - 1].sock.sendMessage(tempProcess[index - 1].groupId, { text: "_❌ Görüntü oluşturulamadı!_" });
                }
            }
        }
    }
}, 8000)

addCommand({
    pattern: "^dream ?(.*)",
    access: "all",
    desc: "_Thena API ile görsel oluşturur._",
    usage: global.handlers[0] + "dream <metin> <model> <oran> <mod>",
    pluginVersion: "1.0.3",
    pluginId: "image-generation"
}, async (msg, match, sock, rawMessage) => {
    if (!global.database.thenaAPIKey && !String(match[1]).includes("addAPI")) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_🔐 Önce Thena API anahtarını eklemelisiniz._\n\n_Kullanım: ```" + global.handlers[0] + "dream addAPI <api-anahtarınız>```_\n\n_API anahtarı almak için: https://t.me/ThenaAIBot?start=refAPI_", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Bot sahibinin API anahtarı eklemesi gerekiyor. Lütfen bot sahibi ile iletişime geçin._" }, { quoted: rawMessage.messages[0] });
        }
    }

    var text = match[1];
    if (!text) {
        const örnekMetin = "_Örnek kullanım: ```" + global.handlers[0] + "dream <metin> <model> <oran> <mod>```_";
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_🔤 Görsel oluşturmak için metin girmelisiniz._\n\n" + örnekMetin + "\n\n_Model seçenekleri: -real || -vip || -anime_\n_Oran: 1:1 || 3:4 || 9:16 || 4:3 || 16:9_\n_Mod: -fast || -quality_", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_🔤 Görsel oluşturmak için metin girmelisiniz._\n\n" + örnekMetin + "\n_Model seçenekleri: -real || -vip || -anime_\n_Oran: 1:1 || 3:4 || 9:16 || 4:3 || 16:9_\n_Mod: -fast || -quality_" }, { quoted: rawMessage.messages[0] });
        }
    };

    if (text.includes("addAPI") && msg.key.fromMe) {
        const apiKey = match[1].replace("addAPI ", "").replace(/ /gmi, "");
        if (!apiKey) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ API anahtarı eklemeniz gerekiyor._\n_Kullanım: ```" + global.handlers[0] + "dream addAPI <api-anahtarınız>```_\n_API almak için: https://t.me/ThenaAIBot?start=refAPI_", edit: msg.key });
        }
        global.database.thenaAPIKey = apiKey;
        return await sock.sendMessage(msg.key.remoteJid, { text: "_✅ API anahtarı başarıyla eklendi._", edit: msg.key });
    }

    const model = match[1].includes("-real") ? "real" : (match[1].includes("-vip") ? "vip" : (match[1].includes("-anime") ? "anime" : "real"));
    const ratio = match[1].includes("3:4") ? "3:4" : (match[1].includes("9:16") ? "9:16" : (match[1].includes("4:3") ? "4:3" : (match[1].includes("16:9") ? "16:9" : "1:1")));
    const mode = match[1].includes("-fast") ? "fast" : "quality";

    const ratioMapping = {
        "1:1": { width: 1024, height: 1024 },
        "3:4": { width: 768, height: 1024 },
        "9:16": { width: 576, height: 1024 },
        "4:3": { width: 1024, height: 768 },
        "16:9": { width: 1024, height: 576 }
    }

    const dimensions = ratioMapping[ratio] || { width: 1024, height: 1024 }
    const tempGroupId = msg.key.remoteJid;

    const payload = {
        "prompt": text.replace(model, "").replace(ratio, ""),
        "model": model === "real" ? "754019 b5df2e e606f1 a7600b 96b0c8 94" : model === "vip" ? "77h621 yy5271 gga166 hhau22 882hha 1a 3090" : model === "anime" ? "5g72h1 y661hp k771ns 33bb21 77bagl 6b 3090" : "754019 b5df2e e606f1 a7600b 96b0c8 94",
        "creative": false,
        "width": dimensions.width,
        "height": dimensions.height,
        "fastMode": mode === "fast" ? true : false,
    }
    var payloadConfig = {
        method: 'post',
        url: 'https://create.thena.workers.dev/create_image_thena_v5',
        headers: {
            'User-Agent': global.database.thenaAPIKey,
            'Content-Type': 'application/json'
        },
        data: payload
    };

    var result = await axios(payloadConfig);

    if (result.data.status == 200) {
        let loadingMessage;
        if (msg.key.fromMe) {
            loadingMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_🔄 Görsel oluşturuluyor.._", edit: msg.key });
        } else {
            loadingMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_🔄 Görsel oluşturuluyor.._" }, { quoted: rawMessage.messages[0] });
        }

        runningProcesses.push({
            url: "https://create.thena.workers.dev/status?id=" + result.data.image,
            messageId: msg.key.fromMe ? msg.key : loadingMessage.key,
            groupId: tempGroupId,
            caption: "*✨ Thena AI tarafından oluşturuldu*\n\n_Prompt ::_ ```" + text + "```",
            sock: sock,
        })
        return;
    } else {
        let errorMsg;
        if (msg.key.fromMe) {
            errorMsg = await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Görsel oluşturulamadı._\n\n_Hata: " + result.data.content + "_\n\n_Lütfen daha sonra tekrar deneyin._", edit: msg.key });
        } else {
            errorMsg = await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Görsel oluşturulamadı._\n\n_Hata: " + result.data.content + "_\n\n_Lütfen daha sonra tekrar deneyin._" }, { quoted: rawMessage.messages[0] });
        }
    }
})
