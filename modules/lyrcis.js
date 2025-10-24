const Genius = require("genius-lyrics");
const Client = new Genius.Client("HOAnWV-f4dqf2id6JLyZsjHvcEofEYRZePkc3GLiFePZDecBgsvkJvN2YcfVWBjI"); // Demo Key

addCommand({
    pattern: "^lyrics ?(.*)",
    access: "all",
    desc: "_*Bir şarkının sözlerini alır.*_",
    usage: global.handlers[0] + "lyrics <şarkı adı>"
}, async (msg, match, sock, rawMessage) => {
    if (!match[1]) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen aramak istediğiniz şarkıyı yazın._", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Lütfen aramak istediğiniz şarkıyı yazın._" }, { quoted: rawMessage.messages[0] });
        }
    }

    if (msg.key.fromMe) {
        await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Şarkı sözleri indiriliyor.._", edit: msg.key });
    } else {
        var publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_⏳ Şarkı sözleri indiriliyor.._" }, { quoted: rawMessage.messages[0] });
    }

    try {
        const searches = await Client.songs.search(match[1]);
        const firstSong = searches[0];

        const imageUrl = firstSong._raw.header_image_url;
        const title = firstSong._raw.primary_artist_names + " - " + firstSong._raw.title;
        const lyrics = await firstSong.lyrics();

        if (msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
            await sock.sendMessage(msg.key.remoteJid, { image: { url: imageUrl }, caption: title + "\n\n" + lyrics });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
            await sock.sendMessage(msg.key.remoteJid, { image: { url: imageUrl }, caption: title + "\n\n" + lyrics }, { quoted: rawMessage.messages[0] });
        }
    } catch {
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Bu şarkının sözleri bulunamadı._", edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: "_❌ Bu şarkının sözleri bulunamadı._", edit: publicMessage.key });
        }
    }
});
