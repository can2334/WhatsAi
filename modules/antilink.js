// antiLinkSimple.js
async function setupAntiLink(sock, addCommand) {
    // Anti-link aç/kapat komutu
    adkpjlrlrldCommand({
        pattern: "^antilink",
        desc: "_*Grup içinde link paylaşımını engeller.*_",
        access: "sudo",
        onlyInGroups: true
    }, async (msg) => {
        const chatId = msg.key.remoteJid;
        return await sock.sendMessage(chatId, { text: "_✅ Anti-link modülü aktif. Artık tüm linkler uyarı verir._" }, { quoted: msg });
    });

    // Mesaj dinleme ve anti-link kontrolü
    sock.ev.on('messages.upsert', async m => {
        for (const msg of m.messages) {
            try {
                if (!msg || !msg.message) continue;
                const chatId = msg.key.remoteJid;
                if (!chatId || !chatId.endsWith("@g.us")) continue; // sadece grup

                const sender = msg.key.participant || msg.key.remoteJid;

                // Mesaj text (sadece conversation ve extendedTextMessage)
                const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
                if (!text) continue;

                // WhatsApp grup linki regex
                const match = text.match(/chat\.whatsapp\.com\/([A-Za-z0-9_-]+)/i);
                if (!match) continue;

                const postedCode = match[1];

                // Grup meta bilgisi
                const metadata = await sock.groupMetadata(chatId).catch(() => null);
                const p = metadata?.participants?.find(x => x.id === sender);
                const isAdmin = !!(p && (p.isAdmin || p.isSuperAdmin || p.admin === 'admin' || p.admin === 'superadmin'));

                if (isAdmin) {
                    await sock.sendMessage(chatId, {
                        text: `_⚠️ @${sender.split('@')[0]} grup linki paylaştı, ama admin olduğu için işlem yapılmadı._`,
                        mentions: [sender],
                        quoted: msg
                    });
                    continue;
                }

                // Mevcut grup davet kodunu çek
                let currentCode = null;
                try {
                    const inviteInfo = await sock.groupInviteCode(chatId).catch(() => null);
                    currentCode = inviteInfo?.inviteCode || inviteInfo?.code || inviteInfo?.invite || null;
                } catch (e) { currentCode = null; }

                if (currentCode && postedCode === currentCode) {
                    // kendi grup linki paylaşıldı → revoke ve uyarı
                    try {
                        if (metadata?.participants?.some(x => x.id === sock.user.id && (x.isAdmin || x.isSuperAdmin))) {
                            await sock.groupRevokeInvite(chatId);
                            await sock.sendMessage(chatId, {
                                text: "_⚠️ Bu grubun davet linki paylaşıldığı için iptal edildi ve yenilendi._",
                                quoted: msg
                            });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: "_⚠️ Bu grubun davet linki paylaşıldı, ama bot admin değil. Sadece uyarı veriyorum._",
                                quoted: msg
                            });
                        }
                    } catch (e) {
                        await sock.sendMessage(chatId, {
                            text: "_❌ Hata oluştu, link iptali gerçekleşmedi._",
                            quoted: msg
                        });
                        console.error("Revoke failed", e);
                    }
                } else {
                    // farklı grup linki → at ve uyar
                    try {
                        if (metadata?.participants?.some(x => x.id === sock.user.id && (x.isAdmin || x.isSuperAdmin))) {
                            await sock.groupParticipantsUpdate(chatId, [sender], 'remove');
                            await sock.sendMessage(chatId, {
                                text: `_❌ @${sender.split('@')[0]} başka bir grup linki paylaştığı için atıldı._`,
                                mentions: [sender],
                                quoted: msg
                            });
                        } else {
                            await sock.sendMessage(chatId, {
                                text: `_❌ @${sender.split('@')[0]} başka bir grup linki paylaştı, bot admin değil. Sadece uyarı._`,
                                mentions: [sender],
                                quoted: msg
                            });
                        }
                    } catch (e) {
                        await sock.sendMessage(chatId, {
                            text: "_❌ Üyeyi atamıyorum — bot admin değil veya izin yok._",
                            quoted: msg
                        });
                        console.error("Remove failed", e);
                    }
                }

            } catch (err) {
                console.error("antilinkSimple handler error:", err);
            }
        }
    });
}

module.exports = { setupAntiLink };
