const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { jidNormalizedUser } = require('@whiskeysockets/baileys');
const ytdl = require('youtube-dl-exec');
// ÖNEMLİ: Eğer libmuse'u hala kullanıyorsanız, searchVideo içinde import edilmiştir.

ffmpeg.setFfmpegPath(ffmpegPath);

// ===============================================
// 🔥 GLOBAL DEĞİŞKEN TANIMI
// Kullanıcıların arama sonuçlarını geçici olarak saklamak için global harita
const videoSearchState = new Map();
// ===============================================

// ------------------- YARDIMCI FONKSİYONLAR -------------------

// Yardımcı fonksiyon - Mesaj gönderme
async function sendResponse(sock, msg, text, isEdit = false, quotedMsg = null) {
    const jid = jidNormalizedUser(msg.key.remoteJid);

    if (msg.key.fromMe && isEdit) {
        return await sock.sendMessage(jid, { text, edit: msg.key });
    } else if (quotedMsg) {
        return await sock.sendMessage(jid, { text }, { quoted: quotedMsg });
    } else {
        return await sock.sendMessage(jid, { text });
    }
}

// Mesaj silme
async function deleteMessage(sock, msg, targetKey = null) {
    const jid = jidNormalizedUser(msg.key.remoteJid);
    await sock.sendMessage(jid, { delete: targetKey || msg.key });
}

// Video ID çıkarma
function extractVideoId(query) {
    const urlPattern = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/;
    const match = query.match(urlPattern);
    return match ? match[1] : null;
}

// Video arama (Çoklu sonuç döndürür) - libmuse varsayılmıştır
async function searchVideo(query, count = 5) {
    try {
        const ytVideo = await import('libmuse');
        const searchResults = await ytVideo.search(query);

        if (!searchResults || searchResults.length === 0) {
            return [];
        }

        const videos = searchResults.categories.find(x => x.title === "Videos");
        if (!videos || !videos.results || videos.results.length === 0) {
            return [];
        }

        // İlk N sonucu döndür
        return videos.results.slice(0, count).map(video => ({
            title: video.title,
            videoId: video.videoId,
            duration: video.durationText,
            author: video.author,
        }));
    } catch (err) {
        console.error('Video search error (libmuse):', err);
        return [];
    }
}

// yt-dlp ile video bilgisi al
async function getVideoInfo(videoId) {
    try {
        const url = videoId.length > 15 ? videoId : `https://www.youtube.com/watch?v=${videoId}`;
        const info = await ytdl(url, {
            dumpJson: true,
            noWarnings: true,
        });

        return {
            title: info.title,
            author: info.uploader || info.channel,
            duration: parseInt(info.duration),
            views: parseInt(info.view_count || 0),
            url: url
        };
    } catch (err) {
        console.error('Video info error:', err);
        return null;
    }
}

// yt-dlp ile video indirme (HIZ OPTİMİZASYONU: Küçük formatları zorlama)
async function downloadVideo(url, outputPath, duration) {
    try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        // 🔥 HIZLANDIRMA İÇİN KRİTİK DEĞİŞİKLİK:
        // 144p (17), 240p (36), 360p (18) gibi önceden birleştirilmiş (muxed) küçük formatlara öncelik veriyoruz.
        // Bu, yt-dlp'nin FFmpeg kullanarak birleştirme yapmasını engeller ve indirme hızını artırır.
        /*         const quality = duration > 300 ? 'worst' : '17/36/18/best[ext=mp4]';
         */
        const quality = '17/36/18/best[ext=mp4]'; // Süre kontrolünü kaldırıp her zaman en küçük muxed formatlara öncelik veriyoruz.
        console.log('📥 Downloading video...');

        await ytdl(url, {
            format: quality,
            noWarnings: true,
            noPlaylist: true,
            mergeOutputFormat: 'mp4',
            output: outputPath
        }, {
            maxBuffer: 100 * 1024 * 1024,
            ffmpegLocation: ffmpegPath
        });

        return fs.existsSync(outputPath);
    } catch (err) {
        console.error('Video download error:', err);
        return false;
    }
}

// FFmpeg ile MP4'e kopyalama (YENİ: Copy/Remux) - Artık kullanılmıyor ama hata durumuna karşı tutulabilir.
async function convertToMp4(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            // HIZLANDIRMA: Yeniden kodlama yerine sadece kopyalama yap
            .videoCodec('copy')
            .audioCodec('copy')
            .outputOptions(
                '-movflags', '+faststart',
                '-max_muxing_queue_size', '1024'
            )
            .output(outputFile)
            .on('end', () => {
                console.log('✅ MP4 conversion (copy) complete');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ MP4 conversion (copy) error:', err);
                reject(err);
            })
            .run();
    });
}

// Dosyaları temizle
function cleanupFiles(...files) {
    files.forEach(file => {
        try {
            if (fs.existsSync(file)) {
                fs.unlinkSync(file);
                console.log('🗑️ Cleaned:', file);
            }
        } catch (err) {
            console.error('Cleanup error:', err);
        }
    });
}

// Format süresi
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Format görüntülenme
function formatViews(views) {
    if (views >= 1000000) {
        return (views / 1000000).toFixed(1) + 'M';
    } else if (views >= 1000) {
        return (views / 1000).toFixed(1) + 'K';
    }
    return views.toString();
}

// İndirme ve gönderme işlemini ayrı bir fonksiyona ayırma (HIZ OPTİMİZASYONU: FFmpeg Adımı Kaldırıldı)
async function handleVideoDownload(sock, msg, videoId, rawMessage, loadingMsgKey) {
    const jid = jidNormalizedUser(msg.key.remoteJid);
    const isMe = msg.key.fromMe;

    await sendResponse(sock, msg, "_📥 Getting video info..._", true, null);
    const videoInfo = await getVideoInfo(videoId);

    if (!videoInfo) {
        return await sendResponse(sock, msg,
            "_❌ Could not fetch video information._\n\n_Check if video is private or deleted._",
            true, null
        );
    }

    const { title, author, duration, views, url } = videoInfo;

    // Süre kontrolü
    if (duration > 600) {
        return await sendResponse(sock, msg,
            `_❌ Video is too long! Max 10:00 (600s)._\n\n` +
            `⏱️ Duration: ${formatDuration(duration)}`,
            true, null
        );
    }

    // Video bilgilerini göster
    await sendResponse(sock, msg,
        `_📹 Video Found!_\n\n` +
        `*${title}*\n\n` +
        `👤 ${author}\n` +
        `⏱️ ${formatDuration(duration)}\n` +
        `👁️ ${formatViews(views)} views\n\n` +
        `_⬇️ Downloading... This may take a minute._`,
        true, null
    );

    // Dosya yolları
    const timestamp = Date.now();
    const downloadPath = `src/video_dl_${timestamp}.mp4`;
    const finalPath = downloadPath; // 🔥 HIZLANDIRMA: Artık optimize edilen dosya yoluna gerek yok, doğrudan indirilen yolu kullanıyoruz.

    // Video indir
    const downloadSuccess = await downloadVideo(url, downloadPath, duration);

    if (!downloadSuccess) {
        cleanupFiles(downloadPath);
        return await sendResponse(sock, msg,
            "_❌ Failed to download video._\n\n_Make sure yt-dlp can access the video._",
            true, null
        );
    }

    // 🔥 HIZLANDIRMA: FFmpeg ile optimizasyon (convertToMp4) adımı tamamen kaldırıldı.

    // İlk mesajı sil
    if (loadingMsgKey) {
        await deleteMessage(sock, msg, isMe ? msg.key : loadingMsgKey);
    }

    // Video gönder
    const caption = `*${title}*\n\n` +
        `👤 ${author}\n` +
        `⏱️ ${formatDuration(duration)}\n` +
        `👁️ ${formatViews(views)} views`;

    const messageOptions = {
        video: { url: finalPath },
        caption
    };

    if (isMe) {
        await sock.sendMessage(jid, messageOptions);
    } else {
        await sock.sendMessage(jid, messageOptions, { quoted: rawMessage.messages[0] });
    }

    // Temizlik
    cleanupFiles(finalPath); // Sadece indirilen dosyayı temizle
}


// ------------------- KOMUTLAR -------------------

// ==================== VIDEO KOMUTU ====================
addCommand({
    pattern: "^video ?(.*)",
    access: "all",
    desc: "_*Download video from YouTube with high quality.*_",
    usage: global.handlers[0] + "video <query || url>"
}, async (msg, match, sock, rawMessage) => {
    const query = match[1]?.trim();
    const jid = jidNormalizedUser(msg.key.remoteJid);

    if (!query) {
        return await sendResponse(sock, msg,
            "_❌ Please provide a video URL or search query._\n\n" +
            `_Example:_ ${global.handlers[0]}video Despacito`,
            msg.key.fromMe, rawMessage.messages[0]
        );
    }

    const loadingMsg = await sendResponse(sock, msg,
        "_🔍 Searching for video..._",
        msg.key.fromMe, rawMessage.messages[0]
    );

    try {
        // Adım 1: Query'nin URL/ID olup olmadığını kontrol et
        let videoId = extractVideoId(query);

        if (videoId) {
            // URL/ID ile gelmişse, hemen indir (Tek video)
            videoSearchState.delete(jid);

            await deleteMessage(sock, msg, msg.key.fromMe ? msg.key : loadingMsg.key);

            await handleVideoDownload(sock, msg, videoId, rawMessage, null);
        } else {
            // Adım 2: URL değilse, arama sorgusu olarak işle (Çoklu sonuç listesi)
            await sendResponse(sock, msg, "_🔎 Searching YouTube..._", true, null);
            const searchResults = await searchVideo(query, 5); // İlk 5 sonucu getir

            if (searchResults.length === 0) {
                // Arama sonuç vermediyse hata mesajı
                await deleteMessage(sock, msg, msg.key.fromMe ? msg.key : loadingMsg.key);
                return await sendResponse(sock, msg,
                    "_❌ No video found for this query._",
                    false, rawMessage.messages[0]
                );
            }

            // Adım 3: Sonuçları kaydet ve listeyi göster
            const resultsMap = searchResults.map((res, index) => ({
                id: index + 1,
                videoId: res.videoId,
                title: res.title
            }));
            videoSearchState.set(jid, resultsMap);

            let replyText = `_✅ Found ${searchResults.length} videos for your query:_\n\n` +
                `*Lütfen indirmek istediğiniz videonun numarasını cevap olarak gönderin (1-${searchResults.length}).*\n\n`;

            searchResults.forEach((video, index) => {
                replyText += `*${index + 1}.* ${video.title}\n` +
                    `  ↳ _${video.author} (${video.duration})_\n`;
            });

            replyText += `\n_Örnek: ${global.handlers[0]}select 2_`;

            await deleteMessage(sock, msg, msg.key.fromMe ? msg.key : loadingMsg.key);
            await sendResponse(sock, msg, replyText, false, rawMessage.messages[0]);
        }
    } catch (err) {
        console.error('Video command error:', err);
        await sendResponse(sock, msg,
            `_❌ An error occurred during search or download:_\n\`\`\`${err.message}\`\`\`\n\n_Check installed dependencies._`,
            false, rawMessage.messages[0]
        );
    }
});

// ==================== SELECT KOMUTU ====================
addCommand({
    pattern: "^select ?([0-9]+)",
    access: "all",
    desc: "_*Selects a video from the search results to download.*_",
    usage: global.handlers[0] + "select <index>"
}, async (msg, match, sock, rawMessage) => {
    const jid = jidNormalizedUser(msg.key.remoteJid);
    const index = parseInt(match[1]);

    if (!videoSearchState.has(jid)) {
        return await sendResponse(sock, msg,
            "_❌ Devam eden bir video arama sonucunuz bulunamadı. Lütfen önce " + global.handlers[0] + "video komutunu kullanın._",
            false, rawMessage.messages[0]
        );
    }

    const results = videoSearchState.get(jid);

    if (isNaN(index) || index < 1 || index > results.length) {
        return await sendResponse(sock, msg,
            `_❌ Geçersiz seçim. Lütfen 1 ile ${results.length} arasında bir sayı seçin._`,
            false, rawMessage.messages[0]
        );
    }

    const selectedVideo = results[index - 1];

    // State'i temizle
    videoSearchState.delete(jid);

    // İndirme işlemini başlatılıyor mesajı
    const loadingMsg = await sendResponse(sock, msg,
        `_Starting download for: *${selectedVideo.title}*..._`,
        false, rawMessage.messages[0]
    );

    try {
        // İndirme işlemini handleVideoDownload ile başlat
        await handleVideoDownload(sock, msg, selectedVideo.videoId, rawMessage, loadingMsg.key);
    } catch (err) {
        console.error('Select command download error:', err);
        await sendResponse(sock, msg,
            `_❌ Seçilen video indirilirken bir hata oluştu:_\n\`\`\`${err.message}\`\`\``,
            false, rawMessage.messages[0]
        );
    }
});
