const fs = require("fs");
const path = require("path");

const dbPath = path.join(__dirname, "../database.json");

// Veritabanını yükle veya oluştur
if (!global.database) {
    if (fs.existsSync(dbPath)) {
        global.database = JSON.parse(fs.readFileSync(dbPath));
    } else {
        global.database = {};
    }
}

if (!global.database.antilink) global.database.antilink = [];

// helper: tüm mesaj tiplerinden metin al
function getMessageText(msg) {
    return (
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        ""
    );
}

addCommand({
    pattern: "antilink",
    fromMe: true,
    desc: "Antilink özelliğini aç/kapat",
}, async (msg, match, sock) => {
    const groupId = msg.key.remoteJid;

    // Mesaj metnini al
    let text = msg.body || getMessageText(msg);
    text = text.split(" ").slice(1).join(" ").trim().toLowerCase();

    // Durum göster
    if (!text) {
        const status = global.database.antilink.includes(groupId) ? "🟢 Açık" : "🔴 Kapalı";
        return await sock.sendMessage(groupId, {
            text: `📘 Kullanım: *.antilink on* veya *.antilink off*\nDurum: ${status}`
        });
    }

    if (text === "on") {
        if (!global.database.antilink.includes(groupId)) {
            global.database.antilink.push(groupId);
            fs.writeFileSync(dbPath, JSON.stringify(global.database, null, 2));
            await sock.sendMessage(groupId, { text: "✅ Antilink aktif edildi!" });
        } else {
            await sock.sendMessage(groupId, { text: "⚠️ Antilink zaten aktif!" });
        }
    } else if (text === "off") {
        global.database.antilink = global.database.antilink.filter(id => id !== groupId);
        fs.writeFileSync(dbPath, JSON.stringify(global.database, null, 2));
        await sock.sendMessage(groupId, { text: "❌ Antilink devre dışı bırakıldı!" });
    } else {
        await sock.sendMessage(groupId, { text: "❓ Kullanım: *.antilink on* veya *.antilink off*" });
    }
});
