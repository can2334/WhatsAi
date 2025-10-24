const simpleGit = require('simple-git');
const git = simpleGit();

addCommand({
    pattern: "^update$",
    access: "sudo",
    desc: "_*Botun güncellemelerini kontrol eder ve listeler.*_"
}, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    const sendOpts = msg.key.fromMe ? { edit: msg.key } : { quoted: rawMessage.messages[0] };

    await sock.sendMessage(chatId, { text: `_🔄 Güncellemeler kontrol ediliyor..._`, ...sendOpts });

    await git.fetch();
    const commits = await git.log(["main..origin/main"]);

    if (commits.total === 0) {
        return await sock.sendMessage(chatId, { text: `_🔄 Güncelleme bulunamadı._`, ...sendOpts });
    }

    let news = "*🆕 Yeni Güncellemeler:*\n";
    commits.all.forEach(commit => {
        news += `▫️ [${commit.date.substring(0, 10)}]: ${commit.message} <${commit.author_name}>\n`;
    });

    news += `\n_Güncellemek için: \`${global.handlers[0]}update now\` yazın._`;

    await sock.sendMessage(chatId, { text: news, ...sendOpts });
});

addCommand({
    pattern: "^update now$",
    access: "sudo",
    desc: "_*Botu GitHub üzerinden günceller.*_",
    dontAddCommandList: true
}, async (msg, match, sock, rawMessage) => {
    const chatId = msg.key.remoteJid;
    const sendOpts = msg.key.fromMe ? { edit: msg.key } : { quoted: rawMessage.messages[0] };

    await sock.sendMessage(chatId, { text: `_🔄 Bot güncelleniyor..._`, ...sendOpts });

    await git.stash();
    try {
        await git.pull();
        await sock.sendMessage(chatId, { text: `_✅ Güncelleme başarılı! Bot yeniden başlatılıyor._`, ...sendOpts });
    } catch (err) {
        await sock.sendMessage(chatId, { text: `_❌ Güncelleme başarısız. Yerel değişiklikleriniz varsa otomatik güncelleyemezsiniz._`, ...sendOpts });
    }
    await git.stash(['pop']);
    process.exit(0); // Botu yeniden başlatmak için çıkış
});
