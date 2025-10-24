const path = require('path');
const axios = require('axios');
const fs = require('fs');
let requestData = {
    duration: 5,
    fps: 4,
    colors: [
        [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255],
        [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255],
        [Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), 255]
    ],
    text: undefined
};
addCommand({ pattern: "^attp ?(.*)", access: "all", desc: "_*Yazdığınız metini renkli sitckera çevirir.*_", pluginVersion: "1.0.1", pluginId: "attp" }, async (msg, match, sock, rawMessage) => {
    if (!match[1]) return await sock.sendMessage(msg.key.remoteJid, { text: '_❌ Please provide a text to convert to sticker._', ...(msg.key.fromMe ? { edit: msg.key } : {}) }, msg.key.fromMe ? {} : { quoted: rawMessage.messages[0] });

    const dKey = await sock.sendMessage(msg.key.remoteJid, { text: '_⏳ Generating.._', ...(msg.key.fromMe ? { edit: msg.key } : {}) }, msg.key.fromMe ? {} : { quoted: rawMessage.messages[0] })

    requestData.text = match[1];
    let response;
    try {
        response = await axios.post('https://api.ic3zy.com.tr/generate-video', requestData, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 45000
        });
    } catch { response = 'err' };
    const stickerPath = path.join(__dirname, '..', 'src', `attp${Math.floor(Math.random() * 10000)}.webp`);
    if (response?.data?.success != true && response == 'err') return await sock.sendMessage(msg.key.remoteJid, { text: '❌ _Üretim sırasında bir hata oluştu. Sunucu kapalı olabilir veya başka bir sorun olabilir, yakında çözülecektir._', ...(msg.key.fromMe ? { edit: msg.key } : {}) }, msg.key.fromMe ? {} : { quoted: rawMessage.messages[0] });
    await downloadVideo(response.data.videoUrl, stickerPath);
    await sock.sendMessage(msg.key.remoteJid, { delete: dKey.key });
    await sock.sendMessage(msg.key.remoteJid, { sticker: { url: stickerPath } });
    try { fs.unlinkSync(stickerPath); } catch { }
    return;
});

async function downloadVideo(url, outputPath) {
    const writer = fs.createWriteStream(outputPath);

    const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
    });

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
}
