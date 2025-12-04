const fs = require('fs');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

ffmpeg.setFfmpegPath(ffmpegPath);

// yt-dlp exe yolu
const ytDlpPath = "C:\\Users\\utku.stajyer\\tools\\yt-dlp.exe";

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

// Video arama
async function searchVideo(query) {
    try {
        const ytVideo = await import('libmuse');
        const searchResults = await ytVideo.search(query);

        if (!searchResults || searchResults.length === 0) {
            return null;
        }

        const videos = searchResults.categories.find(x => x.title === "Videos");
        if (!videos || videos.results.length === 0) {
            return null;
        }

        return videos.results[0].videoId;
    } catch (err) {
        console.error('Video search error:', err);
        return null;
    }
}

// Müzik arama
async function searchMusic(query) {
    try {
        const ytMusic = await import('libmuse');
        const searchResults = await ytMusic.search(query);

        if (!searchResults || searchResults.length === 0) {
            return null;
        }

        const songs = searchResults.categories.find(x => x.title === "Songs");
        if (!songs || songs.results.length === 0) {
            return null;
        }

        return songs.results[0].videoId;
    } catch (err) {
        console.error('Music search error:', err);
        return null;
    }
}

// yt-dlp ile video bilgisi al
async function getVideoInfo(videoId) {
    try {
        const url = videoId.length > 15 ? videoId : `https://www.youtube.com/watch?v=${videoId}`;

        const command = `"${ytDlpPath}" --dump-json --no-warnings "${url}"`;
        const { stdout } = await execPromise(command, {
            maxBuffer: 10 * 1024 * 1024
        });

        const info = JSON.parse(stdout);

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

// yt-dlp ile video indirme
async function downloadVideo(url, outputPath, duration) {
    try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        // 5 dakikadan uzunsa düşük kalite
        const quality = duration > 300 ? 'worst[ext=mp4]' : 'best[ext=mp4]';

        const command = `"${ytDlpPath}" -f "${quality}" --no-warnings --no-playlist --merge-output-format mp4 -o "${outputPath}" "${url}"`;

        console.log('📥 Downloading video...');
        await execPromise(command, { maxBuffer: 100 * 1024 * 1024 }); // 100MB

        return fs.existsSync(outputPath);
    } catch (err) {
        console.error('Video download error:', err);
        return false;
    }
}

// yt-dlp ile audio indirme
async function downloadAudio(url, outputPath) {
    try {
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

        const command = `"${ytDlpPath}" -f "bestaudio" --extract-audio --audio-format mp3 --audio-quality 0 --no-warnings --no-playlist -o "${outputPath}" "${url}"`;

        console.log('📥 Downloading audio...');
        await execPromise(command, { maxBuffer: 50 * 1024 * 1024 }); // 50MB

        return fs.existsSync(outputPath);
    } catch (err) {
        console.error('Audio download error:', err);
        return false;
    }
}

// OGG'ye çevir
async function convertToOgg(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .outputOptions('-avoid_negative_ts', 'make_zero', '-ac', '1', '-qscale:a', '0')
            .audioBitrate('192k')
            .output(outputFile)
            .on('end', () => {
                console.log('✅ OGG conversion complete');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ OGG conversion error:', err);
                reject(err);
            })
            .run();
    });
}

// MP4'e çevir (optimize)
async function convertToMp4(inputFile, outputFile) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputFile)
            .videoCodec('libx264')
            .audioCodec('aac')
            .audioBitrate('128k')
            .outputOptions(
                '-preset', 'ultrafast',
                '-crf', '28',
                '-movflags', '+faststart',
                '-max_muxing_queue_size', '1024'
            )
            .output(outputFile)
            .on('end', () => {
                console.log('✅ MP4 conversion complete');
                resolve();
            })
            .on('error', (err) => {
                console.error('❌ MP4 conversion error:', err);
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

// ==================== VIDEO KOMUTU ====================
// Satır 478 burada başlıyor
addCommand({
    pattern: "^video ?(.*)",
    access: "all",
    desc: "_*Download video from YouTube with high quality.*_",
    usage: global.handlers[0] + "video <query || url>"
}, async (msg, match, sock, rawMessage) => {
    const query = match[1]?.trim();

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
        // Video ID bul
        let videoId = extractVideoId(query);

        if (!videoId) {
            await sendResponse(sock, msg, "_🔎 Searching YouTube..._", true, null);
            videoId = await searchVideo(query);
        }

        if (!videoId) {
            return await sendResponse(sock, msg,
                "_❌ No video found for this query._",
                true, null
            );
        }

        // Video bilgilerini al
        await sendResponse(sock, msg, "_📥 Getting video info..._", true, null);
        const videoInfo = await getVideoInfo(videoId);

        if (!videoInfo) {
            return await sendResponse(sock, msg,
                "_❌ Could not fetch video information._\n\n_Make sure yt-dlp is installed._",
                true, null
            );
        }

        const { title, author, duration, views, url } = videoInfo;

        // Süre kontrolü
        if (duration > 600) {
            return await sendResponse(sock, msg,
                `_❌ Video is too long!_\n\n` +
                `⏱️ Duration: ${formatDuration(duration)}\n` +
                `📊 Max: 10:00`,
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
        const finalPath = `src/video_final_${timestamp}.mp4`;

        // Video indir
        const downloadSuccess = await downloadVideo(url, downloadPath, duration);

        if (!downloadSuccess) {
            cleanupFiles(downloadPath);
            return await sendResponse(sock, msg,
                "_❌ Failed to download video._\n\n_Make sure yt-dlp is installed:_\n`choco install yt-dlp`",
                true, null
            );
        }

        // Convert et (daha küçük boyut için)
        await sendResponse(sock, msg, "_🔄 Optimizing video..._", true, null);

        try {
            await convertToMp4(downloadPath, finalPath);
        } catch (convertErr) {
            console.log('Conversion failed, using original file');
            fs.copyFileSync(downloadPath, finalPath);
        }

        // İlk mesajı sil
        await deleteMessage(sock, msg, msg.key.fromMe ? msg.key : loadingMsg.key);

        // Video gönder
        const jid = jidNormalizedUser(msg.key.remoteJid);
        const caption = `*${title}*\n\n` +
            `👤 ${author}\n` +
            `⏱️ ${formatDuration(duration)}\n` +
            `👁️ ${formatViews(views)} views`;

        if (msg.key.fromMe) {
            await sock.sendMessage(jid, {
                video: { url: finalPath },
                caption
            });
        } else {
            await sock.sendMessage(jid, {
                video: { url: finalPath },
                caption
            }, { quoted: rawMessage.messages[0] });
        }

        // Temizlik
        cleanupFiles(downloadPath, finalPath);

    } catch (err) {
        console.error('Video command error:', err);
        await sendResponse(sock, msg,
            `_❌ An error occurred:_\n\`\`\`${err.message}\`\`\`\n\n_Install yt-dlp:_ \`choco install yt-dlp\``,
            true, null
        );
    }
});
