const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");

/**
 * IMDb'de bir film arar ve ayrıntılarını döndürür.
 * @param {string} movieName - Aranacak filmin adı.
 * @returns {Promise<{status: number, title: string, description: string, rating: string, url: string, director: string, writer: string, actors: string[], stars: string[], thumbnail: string, release_date: string, length: string}>}
 */
async function searchMovie(movieName) {
    let response = await axios.get(`https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(movieName)}.json?includeVideos=1`);
    const jsonData = response.data;

    if (!jsonData.d || jsonData.d.length === 0) {
        return { status: 404 };
    }

    const movies = jsonData.d.filter((m) => m.qid === "movie" || m.qid === "tvMovie");
    if (movies.length === 0) {
        return { status: 404 };
    }

    const url = `https://www.imdb.com/title/${movies[0].id}/`;
    let moviePageResponse = await axios.get(url, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
        }
    });

    const moviePage = moviePageResponse.data;
    const $ = cheerio.load(moviePage);

    const movieTitle = $(".hero__primary-text").text().trim();
    const movieRating = $(".sc-d541859f-1.imUuxf").first().text().trim() + "/10";
    const director = $(".ipc-metadata-list-item__list-content-item--link").first().text().trim();
    const writer = $(".ipc-metadata-list-item__list-content-item--link").eq(1).text().trim();
    const description = $(".sc-42125d72-1").text().trim();

    const actorNames = [];
    $('section[data-testid="title-cast"]').find('.sc-cd7dc4b7-1.kVdWAO').each((i, el) => {
        actorNames.push($(el).text().trim());
    });

    let aa2 = "";
    const parts = moviePage.split('<li role="presentation" class="ipc-metadata-list__item ipc-metadata-list-item--link" data-testid="title-pc-principal-credit">');
    for (const part of parts) {
        if (part.includes("Stars")) {
            aa2 = part.split('<a class="ipc-metadata-list-item__icon-link"')[0];
            break;
        }
    }

    const $2 = cheerio.load(aa2);
    const stars = [];
    $2('ul.ipc-inline-list li a').each((i, el) => {
        stars.push($2(el).text().trim());
    });

    const thumbnail = movies[0]?.i?.imageUrl || "";
    const rDate = [];
    $('.ipc-link.ipc-link--baseAlt.ipc-link--inherit-color').each((i, el) => {
        const text = $(el).text().trim();
        if (/^\d+$/.test(text)) rDate.push(text);
    });

    let length = "";
    $('.ipc-inline-list__item').each((i, el) => {
        const text = $(el).text().trim();
        if (/^\d+h \d+m$/.test(text)) {
            length = text;
            return false;
        }
    });

    return {
        status: 200,
        title: movieTitle,
        description,
        rating: movieRating,
        url,
        director,
        writer,
        actors: actorNames,
        stars,
        thumbnail,
        release_date: rDate[0],
        length
    };
}

// Komut ekleme
addCommand(
    { pattern: "^imdb ?(.*)$", access: "all", desc: "_*IMDb'de bir film arar.*_", pluginVersion: "1.0.1", pluginId: "imdb" },
    async (msg, match, sock, rawMessage) => {
        const movieName = match[1];
        if (!movieName) {
            const text = "_❌ Lütfen aranacak bir film adı girin._";
            if (msg.key.fromMe)
                return await sock.sendMessage(msg.key.remoteJid, { text, edit: msg.key });
            else
                return await sock.sendMessage(msg.key.remoteJid, { text }, { quoted: rawMessage.messages[0] });
        }

        if (msg.key.fromMe)
            await sock.sendMessage(msg.key.remoteJid, { text: "_Film aranıyor..._", edit: msg.key });
        else
            var publicMessage = await sock.sendMessage(msg.key.remoteJid, { text: "_Film aranıyor..._" }, { quoted: rawMessage.messages[0] });

        let imdbData;
        try {
            imdbData = await searchMovie(movieName);
        } catch {
            imdbData = { status: 404 };
        }

        if (imdbData.status === 404) {
            const text = "_❌ Film bulunamadı._";
            if (msg.key.fromMe)
                return await sock.sendMessage(msg.key.remoteJid, { text, edit: msg.key });
            else
                return await sock.sendMessage(msg.key.remoteJid, { text, edit: publicMessage.key });
        }

        const buffer = await global.downloadarraybuffer(imdbData.thumbnail);
        const mediaPath = `./src/imdb_${Math.floor(Math.random() * 20)}.jpg`;
        fs.writeFileSync(mediaPath, buffer);

        const caption = `📽️ *Film Ayrıntıları* 📽️

*Başlık:* _${imdbData.title}_
*Açıklama:* _${imdbData.description}_
*Derecelendirme:* _${imdbData.rating}_
*Yönetmen:* _${imdbData.director}_
*Yazar:* _${imdbData.writer}_
*Oyuncular:* _${imdbData.actors.join(", ")}_
*Yıldızlar:* _${imdbData.stars.join(", ")}_
*Yayın Tarihi:* _${imdbData.release_date}_
*Uzunluk:* _${imdbData.length}_
*URL:* _${imdbData.url}_`;

        if (msg.key.fromMe) {
            await sock.sendMessage(msg.key.remoteJid, { delete: msg.key });
            await sock.sendMessage(msg.key.remoteJid, { image: { url: mediaPath }, caption });
        } else {
            await sock.sendMessage(msg.key.remoteJid, { delete: publicMessage.key });
            await sock.sendMessage(msg.key.remoteJid, { image: { url: mediaPath }, caption });
        }

        try { fs.unlinkSync(mediaPath); } catch { }
    }
);
