const axios = require('axios');

function getShortcode(url) {
    url = url.trim().replace(/\/+$/, '');
    const patterns = ['p/', 'reel/', 'reels/', 'tv/'];
    for (const pattern of patterns) {
        if (url.includes(pattern)) {
            const parts = url.split(pattern);
            if (parts[1]) {
                return parts[1].split(/[/?&#]/)[0];
            }
        }
    }
    throw new Error("Geçersiz Instagram linki.");
}

async function fetchInstagramMedia(url) {
    const shortcode = getShortcode(url);
    const apiUrl = `https://www.instagram.com/p/${shortcode}/?__a=1&__d=dis`;

    // 🛡️ Daha gerçekçi ve Instagram dostu header'lar
    const headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate',
        'Referer': 'https://www.instagram.com/',
        'X-Requested-With': 'XMLHttpRequest',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'Pragma': 'no-cache',
        'Cache-Control': 'no-cache'
    };

    // 🍪 Opsiyonel: Cookie eklemek daha iyi olur (ama zorunlu değil)
    // Eğer botunuzda cookie varsa, aşağıya ekleyin:
    // 'Cookie': 'csrftoken=...; sessionid=...;'

    try {
        const res = await axios.get(apiUrl, {
            headers,
            timeout: 10000,
            maxRedirects: 3,
            // Instagram bazen chunked encoding kullanır, bu yüzden:
            decompress: true
        });

        const text = res.data;

        // Instagram bazen "for (;;);" ile başlar (XSSI koruması)
        let jsonStr = text;
        if (text.startsWith('for (;;);')) {
            jsonStr = text.substring('for (;;);'.length);
        }

        const data = JSON.parse(jsonStr);

        // Hata kontrolü
        if (data && data.graphql && data.graphql.shortcode_media) {
            return data.graphql.shortcode_media;
        }

        if (data.error) {
            throw new Error(`Instagram hatası: ${data.errorSummary || 'Bilinmeyen hata'}`);
        }

        throw new Error("Beklenmeyen yanıt formatı.");
    } catch (err) {
        if (err.response) {
            if (err.response.status === 404) {
                throw new Error("Gönderi bulunamadı.");
            } else if (err.response.status === 403) {
                throw new Error("Erişim reddedildi. Hesap özel olabilir veya IP engellendi.");
            } else if (err.response.status === 429) {
                throw new Error("Çok fazla istek! Biraz ara verin.");
            }
        }
        throw new Error("İstek başarısız: " + (err.message || 'Bilinmeyen hata'));
    }
}

function processMedia(mediaData) {
    const isSidecar = mediaData.__typename === "GraphSidecar";
    const caption = mediaData.edge_media_to_caption.edges?.[0]?.node?.text || "";
    const urls = [];

    if (isSidecar) {
        for (const edge of mediaData.edge_sidecar_to_children.edges) {
            const node = edge.node;
            urls.push(node.is_video ? node.video_url : node.display_url);
        }
    } else {
        urls.push(mediaData.is_video ? mediaData.video_url : mediaData.display_url);
    }

    const hasVideo = isSidecar
        ? mediaData.edge_sidecar_to_children.edges.some(e => e.node.is_video)
        : mediaData.is_video;

    return {
        media: urls,
        type: hasVideo ? "video" : "image",
        caption: caption
    };
}

// WhatsApp Komutu
addCommand({
    pattern: "^insta ?(.*)",
    desc: "*~Instagram'dan medya indirir.~*",
    access: "all"
}, async (msg, match, sock, rawMessage) => {

    if (!match[1]) {
        const txt = "_Lütfen bir Instagram linki girin._";
        if (msg.key.fromMe) {
            return await sock.sendMessage(msg.key.remoteJid, { text: txt }, { edit: msg.key });
        } else {
            return await sock.sendMessage(msg.key.remoteJid, { text: txt }, { quoted: rawMessage.messages[0] });
        }
    }

    let status;
    if (msg.key.fromMe) {
        status = await sock.sendMessage(msg.key.remoteJid, { text: "_📥 İşleniyor..._" }, { edit: msg.key });
    } else {
        status = await sock.sendMessage(msg.key.remoteJid, { text: "_📥 İşleniyor..._" }, { quoted: rawMessage.messages[0] });
    }

    try {
        const mediaData = await fetchInstagramMedia(match[1]);
        const result = processMedia(mediaData);

        await sock.sendMessage(msg.key.remoteJid, { delete: status.key });

        const opts = msg.key.fromMe ? {} : { quoted: rawMessage.messages[0] };
        const cap = result.caption.substring(0, 1000);

        for (const url of result.media) {
            if (result.type === "video") {
                await sock.sendMessage(msg.key.remoteJid, { video: { url }, caption: cap }, opts);
            } else {
                await sock.sendMessage(msg.key.remoteJid, { image: { url }, caption: cap }, opts);
            }
        }
    } catch (err) {
        console.error("Instagram Hatası:", err.message);
        await sock.sendMessage(msg.key.remoteJid, { delete: status.key });
        const errMsg = `_❌ Hata: ${err.message}_`;
        if (msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { text: errMsg }, { edit: msg.key });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { text: errMsg }, { quoted: rawMessage.messages[0] });
        }
    }
});