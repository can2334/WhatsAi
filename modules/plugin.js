const axios = require("axios");
const fs = require("fs");

addCommand({ pattern: "^plugin ?(.*)", access: "sudo", desc: "_*Mağazada eklenti arayın.*_ https://phaticusthiccy.github.io/PrimonMarket/" }, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const query = match[1];

    if (!query) {
        var getLocalPlugins = global.database.plugins;
        if (getLocalPlugins == undefined || getLocalPlugins.length == 0) {
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text: "_❌ Hiç eklenti bulunamadı._\n\n_⌨️ Eklenti aramak için kullanın:_ ```" + global.handlers[0] + "plugin <eklenti-ismi>```\n_⌨️ En çok indirilen eklentileri görmek için:_ ```" + global.handlers[0] + "plugin top```", edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text: "_❌ Hiç eklenti bulunamadı._\n\n_⌨️ Eklenti aramak için kullanın:_ ```" + global.handlers[0] + "plugin <eklenti-ismi>```\n_⌨️ En çok indirilen eklentileri görmek için:_ ```" + global.handlers[0] + "plugin top```" }, { quoted: rawMessage.messages[0] });
            }
        } else {

            var text = "📜 _Eklentiler_\n-------------------------";
            for (var i = 0; i < getLocalPlugins.length; i++) {
                if (!fs.existsSync(getLocalPlugins[i].path)) {
                    global.database.plugins = global.database.plugins.filter(plugin => plugin.id != getLocalPlugins[i].id);
                    continue;
                }
                text += "\n_Eklenti :: " + getLocalPlugins[i].name + "_\n_Sürüm :: " + getLocalPlugins[i].version + "_\n_Yazar :: " + getLocalPlugins[i].author + "_\n_Açıklama :: " + getLocalPlugins[i].description + "_\n_ID :: " + getLocalPlugins[i].id + "_\n-------------------------";
            }
            text += "\n\n_⌨️ Bir eklentiyi silmek için:_ ```" + global.handlers[0] + "pldelete <eklenti-id>```"
            text += "\n_⌨️ Eklenti aramak için:_ ```" + global.handlers[0] + "plugin <eklenti-ismi>```"
            text += "\n_⌨️ En çok indirilen eklentileri görmek için:_ ```" + global.handlers[0] + "plugin top```"

            if (global.database.plugins.length == 0) {
                if (msg.key.fromMe) {
                    return await sock.sendMessage(groupId, { text: "_❌ Hiç eklenti bulunamadı._", edit: msg.key });
                } else {
                    return await sock.sendMessage(groupId, { text: "_❌ Hiç eklenti bulunamadı._" }, { quoted: rawMessage.messages[0] });
                }
            }
            if (msg.key.fromMe) {
                return await sock.sendMessage(groupId, { text, edit: msg.key });
            } else {
                return await sock.sendMessage(groupId, { text }, { quoted: rawMessage.messages[0] });
            }
        }
    }

    if (query == "top") {
        if (msg.key.fromMe) {
            await sock.sendMessage(groupId, { text: "_🔍 Eklentiler aranıyor..._", edit: msg.key });
        } else {
            await sock.sendMessage(groupId, { text: "_🔍 Eklentiler aranıyor..._" }, { quoted: rawMessage.messages[0] });
        }

        var getPlugin = await axios.get("https://create.thena.workers.dev/pluginMarket");

        var plugins = getPlugin.data;

        plugins.sort(function (a, b) {
            return b.downloads - a.downloads;
        })

        var text = "📜 _En Çok İndirilen 5 Eklenti_\n-------------------------";
        var addedPlugins = [];

        for (var i = 0; i < 5; i++) {
            try {
                if (addedPlugins.includes(plugins[i].pluginId)) {
                    continue;
                }
                addedPlugins.push(plugins[i].pluginId);
                text += "\n_Eklenti :: " + plugins[i].pluginName + "_\n_Sürüm :: " + plugins[i].pluginVersion + "_\n_Yazar :: " + plugins[i].author + "_\n_Açıklama :: " + plugins[i].description + "_\n_ID :: " + plugins[i].pluginId + "_\n_İndirme Sayısı :: " + plugins[i].downloads + "_\n-------------------------";
            } catch {
                continue;
            }
        }

        text += "\n\n_⌨️ Eklenti yüklemek için:_ ```" + global.handlers[0] + "plinstall <eklenti-id>```"
        text += "\n_⌨️ Eklenti silmek için:_ ```" + global.handlers[0] + "pldelete <eklenti-id>```"
        text += "\n_⌨️ En çok indirilen eklentileri görmek için:_ ```" + global.handlers[0] + "plugin top```"

        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text, edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text }, { quoted: rawMessage.messages[0] });
        }

    }

    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: "_🔍 Eklentiler aranıyor..._", edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: "_🔍 Eklentiler aranıyor..._" }, { quoted: rawMessage.messages[0] });
    }

    var getPlugin = await axios.get("https://create.thena.workers.dev/pluginMarket?search=" + query);
    var plugins = getPlugin.data;

    if (plugins.length == 0) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._" }, { quoted: rawMessage.messages[0] });
        }
    }

    plugins.sort(function (a, b) {
        return b.downloads - a.downloads;
    })

    var text = "📜 _Eklentiler_\n-------------------------";
    var addedPlugins = [];

    for (var i = 0; i < 5; i++) {
        try {
            if (addedPlugins.includes(plugins[i]?.pluginId)) {
                continue;
            }
            addedPlugins.push(plugins[i].pluginId);
            text += "\n_Eklenti :: " + plugins[i].pluginName + "_\n_Sürüm :: " + plugins[i].pluginVersion + "_\n_Yazar :: " + plugins[i].author + "_\n_Açıklama :: " + plugins[i].description + "_\n_ID :: " + plugins[i].pluginId + "_\n_İndirme Sayısı :: " + plugins[i].downloads + "_\n-------------------------";
        } catch {
            continue;
        }
    }

    text += "\n\n_⌨️ Eklenti yüklemek için:_ ```" + global.handlers[0] + "plinstall <eklenti-id>```"
    text += "\n_⌨️ Eklenti silmek için:_ ```" + global.handlers[0] + "pldelete <eklenti-id>```"
    text += "\n_⌨️ En çok indirilen eklentileri görmek için:_ ```" + global.handlers[0] + "plugin top```"

    if (msg.key.fromMe) {
        return await sock.sendMessage(groupId, { text, edit: msg.key });
    } else {
        return await sock.sendMessage(groupId, { text }, { quoted: rawMessage.messages[0] });
    }

})

addCommand({ pattern: "^plinstall ?(.*)", access: "sudo", dontAddCommandList: true }, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const pluginId = match[1];

    if (!pluginId) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Lütfen yüklemek istediğiniz eklentinin ID’sini girin._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Lütfen yüklemek istediğiniz eklentinin ID’sini girin._" }, { quoted: rawMessage.messages[0] });
        }
    }

    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: "_🔄 Eklenti yükleniyor..._", edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: "_🔄 Eklenti yükleniyor..._" }, { quoted: rawMessage.messages[0] });
    }

    var getPlugin = await axios.get("https://create.thena.workers.dev/pluginMarket?id=" + pluginId);
    if (getPlugin.data.author == "Unknown") {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._" }, { quoted: rawMessage.messages[0] });
        }
    }

    var plugin = getPlugin.data;

    if (global.database.plugins && global.database.plugins.find(plugin2 => plugin2.id == plugin.pluginId)) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti zaten yüklü._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti zaten yüklü._" }, { quoted: rawMessage.messages[0] });
        }
    }

    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: "_✅ Eklenti başarıyla yüklendi._\n\n_Kullanmak için yazın:_ ```" + global.handlers[0] + plugin.usage + "```", edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: "_✅ Eklenti başarıyla yüklendi._\n\n_Kullanmak için yazın:_ ```" + global.handlers[0] + plugin.usage + "```" }, { quoted: rawMessage.messages[0] });
    }

    global.database.plugins.push({
        name: plugin.pluginName,
        version: plugin.pluginVersion,
        description: plugin.description,
        author: plugin.author,
        id: plugin.pluginId,
        path: "./modules/" + plugin.pluginFileName
    });

    fs.writeFileSync("./modules/" + plugin.pluginFileName, plugin.context);
    return;
})

addCommand({ pattern: "^pldelete ?(.*)", access: "sudo", dontAddCommandList: true }, async (msg, match, sock, rawMessage) => {
    const groupId = msg.key.remoteJid;
    const pluginName = match[1];

    if (!pluginName) {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Lütfen silmek istediğiniz eklentinin adını girin._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Lütfen silmek istediğiniz eklentinin adını girin._" }, { quoted: rawMessage.messages[0] });
        }
    }

    if (msg.key.fromMe) {
        await sock.sendMessage(groupId, { text: "_🔄 Eklenti siliniyor..._", edit: msg.key });
    } else {
        await sock.sendMessage(groupId, { text: "_🔄 Eklenti siliniyor..._" }, { quoted: rawMessage.messages[0] });
    }

    if (global.database.plugins && global.database.plugins.find(plugin => plugin.id == pluginName)) {
        var pluginPath = global.database.plugins.find(plugin => plugin.id == pluginName).path;
        global.database.plugins = global.database.plugins.filter(plugin => plugin.id != pluginName);
        try { fs.unlinkSync(pluginPath); } catch (e) { }
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_✅ Eklenti başarıyla silindi._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_✅ Eklenti başarıyla silindi._" }, { quoted: rawMessage.messages[0] });
        }
    } else {
        if (msg.key.fromMe) {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._", edit: msg.key });
        } else {
            return await sock.sendMessage(groupId, { text: "_❌ Eklenti bulunamadı._" }, { quoted: rawMessage.messages[0] });
        }
    }
})
