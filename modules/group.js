/**
 * Updates the position of a user in a group.
 * @param {object} sock - The WhatsApp socket connection.
 * @param {string} groupJid - The JID of the group.
 * @param {string} userJid - The JID of the user to update.
 * @param {string} argm - The action to perform on the user (e.g. "remove" to ban).
 * @returns {Promise<boolean>} - True if the operation was successful, false otherwise.
 */
async function replaceUserPosition(sock, groupJid, userJid, argm) {
    try {
        var result = await sock.groupParticipantsUpdate(groupJid, [userJid], argm);
        if (result[0].status == "200") return true
        else return false
    } catch (error) {
        return false
    }
}

/**
 * Checks if the given participant is the bot itself.
 * @param {object} sock - The WhatsApp socket connection.
 * @param {string} participant - The JID of the participant to check.
 * @returns {boolean} - True if the participant is the bot itself, false otherwise.
 */
function preventOwner(sock, participant) {
    if (participant == sock.user.id.split(':')[0] + `@s.whatsapp.net`) return true
    else return false
}

addCommand({
    pattern: "^ban ?(.*)",
    desc: "_*Bir kişiyi gruptan yasaklamanı sağlar.*_",
    access: "all",
    onlyInGroups: true
},
    async (msg, match, sock, rawMessage) => {
        const groupId = msg.key.remoteJid;

        const admins = await global.getAdmins(groupId);
        if (!admins.includes(msg.key.participant)) {
            return await sock.sendMessage(groupId, { text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_", edit: msg.key });
        }

        let target;
        let result;

        // 1. Mesaja yanıtla banlama
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = msg.message.extendedTextMessage.contextInfo.participant;

            // 2. @mention ile banlama
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

            // 3. Komutla numara yazarak banlama (örnek: !ban 90555...)
        } else if (match[1]) {
            const num = match[1].replace(/[^0-9]/g, "");
            if (num.length < 8) {
                return await sock.sendMessage(groupId, { text: "_❌ Geçersiz numara formatı!_", edit: msg.key });
            }
            target = num + "@s.whatsapp.net";
        } else {
            return await sock.sendMessage(groupId, { text: "_Lütfen birine yanıt ver veya etiketle!_", edit: msg.key });
        }

        // Kendini banlamasın diye
        if (target === msg.key.participant) {
            return await sock.sendMessage(groupId, { text: "_❌ Kendini yasaklayamazsın!_", edit: msg.key });
        }

        // İşlem
        try {
            result = await replaceUserPosition(sock, groupId, target, "remove");

            if (result) {
                return await sock.sendMessage(groupId, {
                    text: `_✅ Kişi gruptan başarıyla yasaklandı!_`,
                    mentions: [target]
                }, { quoted: rawMessage?.messages?.[0] });
            } else {
                throw new Error();
            }

        } catch {
            return await sock.sendMessage(groupId, { text: "_❌ Kullanıcıyı yasaklarken bir hata oluştu!_", edit: msg.key });
        }
    });
addCommand({
    pattern: "^add ?(.*)",
    desc: "_*Bir kişiyi gruba eklemeyi sağlar.*_",
    access: "all",
    onlyInGroups: true
},
    async (msg, match, sock, rawMessage) => {
        const groupId = msg.key.remoteJid;

        const admins = await global.getAdmins(groupId);
        if (!admins.includes(msg.key.participant)) {
            return await sock.sendMessage(groupId, { text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_", edit: msg.key });
        }

        let target;

        // 1. Mesaja yanıtla ekleme
        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = msg.message.extendedTextMessage.contextInfo.participant;

            // 2. @mention ile ekleme (komut mesajında mention varsa)
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            // mentions array’i varsa ilkini al
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

            // 3. Numara ile ekleme
        } else if (match[1]) {
            const num = match[1].replace(/[^0-9]/g, "");
            if (num.length < 8) {
                return await sock.sendMessage(groupId, { text: "_❌ Geçersiz numara formatı!_", edit: msg.key });
            }
            target = num + "@s.whatsapp.net";

        } else {
            return await sock.sendMessage(groupId, { text: "_Lütfen birine yanıt ver, etiketle veya numara gir!_", edit: msg.key });
        }


        try {
            const [waUser] = await sock.onWhatsApp(target);
            if (!waUser) {
                return await sock.sendMessage(groupId, { text: "_❌ Bu kullanıcı WhatsApp kullanmıyor!_", edit: msg.key });
            }

            result = await replaceUserPosition(sock, groupId, target, "add");

            if (result) {
                return await sock.sendMessage(groupId, {
                    text: `_✅ Kişi başarıyla gruba eklendi!_`,
                    mentions: [target]
                }, { quoted: rawMessage?.messages?.[0] });
            } else {
                return await sock.sendMessage(groupId, { text: "_❌ Bu kullanıcı gruba eklenemiyor!_", edit: msg.key });
            }

        } catch (err) {
            return await sock.sendMessage(groupId, {
                text: "_❌ Kullanıcı eklenirken bir hata oluştu! Format: add <ülke kodu ile numara>_",
                edit: msg.key
            });
        }
    });


addCommand({
    pattern: "^promote ?(.*)",
    desc: "_*Bir kullanıcıyı grupta yönetici yapar.*_",
    access: "all",
    onlyInGroups: true
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const admins = await global.getAdmins(groupId);
    if (!admins.includes(msg.key.participant)) {
        return await sock.sendMessage(groupId, { text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_", edit: msg.key });
    }

    let target;

    // 1. Mesaja yanıtla promote
    if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
        target = msg.message.extendedTextMessage.contextInfo.participant;

        // 2. @mention ile promote
    } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
        target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];

        // 3. Numara ile promote
    } else if (match[1]) {
        const num = match[1].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
        target = num;

    } else {
        return await sock.sendMessage(groupId, { text: "_Lütfen birine yanıt ver, etiketle veya numara gir!_", edit: msg.key });
    }
    if (preventOwner(sock, String(target))) {
        return await sock.sendMessage(groupId, { text: "_❌ Kendimi yönetici yapamam!_", edit: msg.key });
    }
    try {
        const result = await replaceUserPosition(sock, groupId, target, "promote");

        if (result) {
            return await sock.sendMessage(groupId, {
                text: "_✅ Kişi başarıyla yönetici yapıldı ✅_",
                mentions: [target]
            }, { quoted: rawMessage?.messages?.[0] });
        } else {
            throw new Error();
        }

    } catch {
        return await sock.sendMessage(groupId, { text: "_❌ Kullanıcıyı yönetici yaparken bir hata oluştu!_", edit: msg.key });
    }
});


addCommand(
    {
        pattern: "^demote ?(.*)",
        desc: "_*Bir kullanıcının yönetici yetkisini alır.*_",
        access: "all",
        onlyInGroups: true
    },
    async (msg, match, sock, rawMessage) => {
        const groupId = msg.key.remoteJid;

        const admins = await global.getAdmins(groupId);
        if (!admins.includes(msg.key.participant)) {
            return await sock.sendMessage(groupId, { text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_", quoted: msg });
        }

        let target;

        if (msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.length) {
            target = msg.message.extendedTextMessage.contextInfo.mentionedJid[0];
        } else if (match[1]) {
            let num = match[1].replace(/[^0-9]/g, "");
            if (num.length < 8) return await sock.sendMessage(groupId, { text: "_❌ Geçersiz numara!_", quoted: msg });
            target = num + "@s.whatsapp.net";
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Lütfen birini yanıtla veya etiketle!_", quoted: msg });
        }

        // Bot kendini veya sahibi demote edemez
        if (preventOwner(sock, target)) {
            return await sock.sendMessage(groupId, { text: "_❌ Kendimi veya grup sahibini demote edemem!_", quoted: msg });
        }

        // Demote işlemi
        let result = await replaceUserPosition(sock, groupId, target, "demote");

        if (result) {
            return await sock.sendMessage(groupId, { text: "_✅ Kullanıcının yönetici yetkisi alındı!_", quoted: msg });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Kullanıcının yetkisini alırken bir hata oluştu!_", quoted: msg });
        }

    }
);



addCommand({
    pattern: "^mute ?(.*)",
    desc: "_*Grubu sessize alır.*_",
    usage: "mute 1 <s || m || h || d || w || y>",
    access: "all",
    onlyInGroups: true
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;

    const admins = await global.getAdmins(groupId);
    if (!admins.includes(msg.key.participant)) {
        return await sock.sendMessage(
            groupId,
            { text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_" },
            { quoted: rawMessage?.messages?.[0] }
        );
    }

    const timeMatch = match[1]?.match(/^(\d+)([smhdwy])$/);
    if (timeMatch) {
        const time = parseInt(timeMatch[1]);
        const unit = timeMatch[2];
        const unitDurations = {
            s: 1000,
            m: 60 * 1000,
            h: 60 * 60 * 1000,
            d: 24 * 60 * 60 * 1000,
            w: 7 * 24 * 60 * 60 * 1000,
            y: 365 * 24 * 60 * 60 * 1000
        };
        const duration = time * unitDurations[unit];
        const unitTexts = {
            s: "saniye",
            m: "dakika",
            h: "saat",
            d: "gün",
            w: "hafta",
            y: "yıl"
        };

        await sock.sendMessage(
            groupId,
            { text: `_✅ Grup ${time} ${unitTexts[unit]} boyunca sessize alındı!_` },
            { quoted: rawMessage?.messages?.[0] }
        );

        await sock.groupSettingUpdate(groupId, 'announcement');

        setTimeout(async () => {
            await sock.groupSettingUpdate(groupId, 'not_announcement');
            await sock.sendMessage(groupId, { text: `_✅ Grup sessizliği kaldırıldı!_` });
        }, duration);

        return;
    }

    if (!match[1]) {
        await sock.groupSettingUpdate(groupId, 'announcement');
        return await sock.sendMessage(
            groupId,
            { text: `_✅ Grup sessize alındı!_` },
            { quoted: rawMessage?.messages?.[0] }
        );
    }

    return await sock.sendMessage(
        groupId,
        { text: "_❌ Geçersiz süre formatı. Kullanım: `mute <süre><s|m|h|d|w|y>`_" },
        { quoted: rawMessage?.messages?.[0] }
    );
});

addCommand({
    pattern: "^unmute ?(.*)",
    desc: "_*Grubun sessizliğini kaldırır.*_",
    usage: "unmute",
    access: "all",
    onlyInGroups: true
}, async (msg, match, sock) => {

    const groupId = msg.key.remoteJid;

    const admins = await global.getAdmins(groupId);
    const sender = msg.key.participant || msg.participant;

    if (!admins.includes(sender)) {
        return await sock.sendMessage(groupId, {
            text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_"
        }, { quoted: msg });
    }

    try {
        await sock.groupSettingUpdate(groupId, 'not_announcement');
        await sock.sendMessage(groupId, {
            text: "_✅ Grubun sessizliği kaldırıldı!_"
        }, { quoted: msg });
    } catch (e) {
        await sock.sendMessage(groupId, {
            text: "_⚠️ Grubun sessizliğini kaldıramadım. Yönetici yetkilerimi kontrol et._"
        }, { quoted: msg });
        console.error(e);
    }
});
addCommand({
    pattern: "^invite$",
    access: "all",
    onlyInGroups: true,
    desc: "_*Grup davet linkini alır.*_"
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const sender = msg.key.participant || msg.key.remoteJid;

    // Adminleri al
    const admins = await global.getAdmins(groupId);

    if (!admins.includes(sender)) {
        return await sock.sendMessage(groupId, {
            text: "_❌ Bu komutu kullanmak için admin olmalısın!_"
        }, { quoted: rawMessage?.messages?.[0] || msg });
    }

    try {
        const inviteCode = (await sock.groupInviteCode(groupId)).inviteCode;
        await sock.sendMessage(groupId, {
            text: `🔗 Grup Davet Linki: https://chat.whatsapp.com/${inviteCode}`
        }, { quoted: rawMessage?.messages?.[0] || msg });
    } catch (err) {
        console.error("Davet linki alınamadı:", err);
        await sock.sendMessage(groupId, {
            text: "_❌ Davet linki alınamadı! Bot admin mi kontrol et veya geçici bir sunucu hatası olabilir._"
        }, { quoted: rawMessage?.messages?.[0] || msg });

    }
});
addCommand({
    pattern: "^inviteqr$",
    access: "all",
    onlyInGroups: true,
    desc: "_*Grup davet linkinin QR kodunu gösterir.*_"
}, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const admins = await global.getAdmins(groupId);
    const sender = msg.key.participant || msg.participant;

    if (!admins.includes(sender)) {
        return await sock.sendMessage(groupId, {
            text: "_❌ Üzgünüm, bu grupta yönetici değilsin!_"
        }, { quoted: rawMessage.messages[0] });
    }

    try {
        const invite = await sock.groupInviteCode(groupId);
        const inviteLink = `https://chat.whatsapp.com/${invite.inviteCode}`;
        // Burada QR oluşturabiliriz
        const QRCode = require('qrcode');
        const qrImage = await QRCode.toDataURL(inviteLink);

        await sock.sendMessage(groupId, {
            image: { url: qrImage },
            caption: `✨🔗 Katılmak için QR kodu tarayın!`
        }, { quoted: rawMessage.messages[0] });
    } catch (err) {
        console.error("Davet QR alınamadı:", err);
        await sock.sendMessage(groupId, { text: "_❌ Davet QR kodu alınamadı!_" }, { quoted: rawMessage.messages[0] });
    }
});
