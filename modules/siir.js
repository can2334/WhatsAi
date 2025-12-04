addCommand({
    pattern: "siir$", // ".siir" veya "siir" yazılsa tetiklenecek
    fromMe: false,     // kullanıcılar da kullanabilir
    desc: "Rastgele bir şiir gönderir",
    access: "all",
}, async (msg, match, sock) => {
    const groupId = msg.key.remoteJid;

    if (!groupId) return;

    const siirler = [
        // Nazım Hikmet
        "En güzel deniz: henüz gidilmemiş olan,\nEn güzel çocuk: henüz büyümedi.\nEn güzel günler: henüz yaşanmamış olan,\nVe sana söylemek istediğim en güzel söz: henüz söylememiş olduğum söz.",

        // Cemal Süreya
        "Sana dün bir tepeden baktım aziz İstanbul,\nGörmedim gezmediğim, sevmediğim hiçbir yer.\nÖmrüm oldukça, seni gözümde büyüteceğim,\nVe her akşamüstü aynı saatte seveceğim seni.",

        // Orhan Veli Kanık
        "Anlatamıyorum, ne kadar anlatsam azdır,\nYalnızlık çiçekleri solar gizlice.\nKimi zaman deniz, kimi zaman bir sokak,\nDüşerim hayaline, kaybolur tüm sesler.",

        // Yahya Kemal Beyatlı
        "Sessizce beklerim rüzgarın gelişini,\nGönlümde eski şarkılar çalar gizlice.\nBir bakışın yeter bana hayal kurmaya,\nVe gün doğmadan başlar yeni bir masal gibi.",

        // Fazıl Hüsnü Dağlarca
        "Dünyayı sevdim ben her köşesiyle,\nToprağı, denizi, gökyüzüyle.\nVe gecenin karanlığında yıldızlarla,\nUykusuzluğumu paylaştım sessizce.",

        // Ahmet Arif
        "Hasret bir yürek işidir, unutulmaz,\nÖzlemle büyür, zamanla yanar.\nVe her gün yeni bir hayal kurulur,\nAşkın en güzel hâli kalır gönüllerde.",

        // Can Yücel
        "Sevda emektir, sevgiyle örülür,\nHer dizesiyle insanı sarar.\nVe bazen bir söz yeter anlatmaya,\nKalpte bir çiçek açtırmaya sessizce.",

        // Edip Cansever
        "Ben sana mecburum bilemezsin,\nGözlerin bir deniz, içimde kaybolurum.\nVe her gece düşlerimde seninle,\nBaşlar yeni bir şiir, sessizce."
    ];


    // Rastgele bir şiir seç
    const rastgeleSiir = siirler[Math.floor(Math.random() * siirler.length)];

    try {
        await sock.sendMessage(groupId, { text: rastgeleSiir, quoted: msg });
        console.log(`📜 Şiir gönderildi: ${rastgeleSiir}`);
    } catch (e) {
        console.error("Şiir gönderilemedi:", e);
    }
});
