# WhatsAi - WhatsApp Bot

WhatsAi, Node.js ve Baileys kütüphanesi ile geliştirilmiş güçlü ve çok yönlü bir WhatsApp botudur. Gelişmiş otomasyon özellikleri ve grup yönetimi araçları sayesinde WhatsApp deneyiminizi hem daha verimli hem de daha keyifli hale getirir. Sohbetleri kolaylaştırır, tekrarlayan işleri otomatikleştirir ve gruplarınızda tam kontrol sağlar.

## Features
🎵 Medya ve Eğlence: Instagram, TikTok ve YouTube’dan hızlı indirme; şarkı sözleri, sticker oluşturma ve “bir kez görüntüle” mesajlarını görme.

👥 Grup Yönetimi: Üyeleri ekleyin veya yasaklayın, yöneticileri yönetin, toplu etiketleme ve global sessize alma.

⚙️ Otomasyon ve Yardımcı Araçlar: Özel filtreler, canlı kontrol, çalışma modu ayarları, sudo yetkileri, kara liste ve özelleştirilebilir mesajlar.

🔄 Her Zaman Güncel: Otomatik güncelleyici ile en yeni özellikler her zaman elinizin altında.

* **Instagram Downloader:** Download photos and videos from Instagram links.
* **TikTok Downloader:** Download TikTok videos with a simple command.
* **YouTube Downloader:** Download YouTube videos and music in high quality.
* **Lyrics Fetcher:** Quickly get song lyrics using the Genius API.
* **Sticker Creator:** Convert images and stickers to different formats.
* **View Once Message Viewer:** Reveal and download "view once" messages.

* **Group Mute/Unmute:** Control group chat activity by muting and unmuting.
* **Ban/Add Members:** Easily ban and add users to your groups.
* **Promote/Demote Admins:** Manage group administrators efficiently.
* **Tag All/Admins:** Quickly tag all members or just the admins in a group.
* **Global Mute:** Mute specific users across all groups the bot is in.

* **Custom Filters:** Create automated responses to specific keywords or regular expressions.
* **Alive Check (`alive`):** Confirm the bot is online and responsive, including RAM (RSS & Heap), disk space, and mode info.
* **Ping (`ping`):** Measure bot response time with emoji feedback ⚡ ⏳ ⚠️.
* **Work Type (Public/Private):** Configure the bot to respond to all users or only authorized users.
* **Sudo Users:** Grant elevated permissions to specific users.
* **Blacklist:** Block specific groups from using the bot.
* **Menu:** View the available commands and their usage.
* **Edit Configurations:** Customize welcome, goodbye, and alive messages directly within WhatsApp.
* **Auto-Updater:** Stay up-to-date with the latest features and improvements.

* **RSS & Heap RAM Info:** Monitor the bot’s memory usage in real-time.
* **Dynamic Alive Messages:** Show owner, version, RAM, disk, Instagram, and mode info in a visually appealing format.
* **Emoji-Enhanced Ping:** Visual feedback for fast/slow responses.



## Installation

These instructions assume you have Node.js (version 16 or higher) and npm (or yarn) installed.

1. **Clone the repository:**

   ```bash
   git clone https://github.com/can2334/WhatsAi.git
   cd WhatsAi
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Generate QR Code and Authenticate:**

   ```bash
   node qr.js
   ```

   Follow the on-screen prompts to scan the QR code with your WhatsApp account. This step is only required for the initial setup.

4. **Start the bot:**

   ```bash
   pm2 start main.js
   ```

   This will run the bot in the background using pm2.

##  Management Commands (Using PM2)

* **View Logs:** `pm2 logs`  (Useful for debugging)
* **Kill (Force Stop):** `pm2 kill`

## Usage

WhatsAi uses handlers to trigger commands.  The default handlers are ".", "/", and "!".  You can customize these in the `database.json` file.  For example, to use the "!alive" command, send "!alive" in a WhatsApp chat where the bot is present.

**Command List:**  Use `!menu` (or your chosen handler + "menu") to see a complete list of available commands and their descriptions within WhatsApp.  You can also use `!menu <command>` to get specific help for a single command.

**All Commands:**

**Media & Entertainment:**

* `!insta <instagram_url>` - Downloads Instagram media.
* `!tiktok <tiktok_url>` - Downloads TikTok videos.
* `!video <query or url>` - Downloads YouTube videos.
* `!music <query or url>` - Downloads YouTube music.
* `!lyrics <song name>` - Fetches song lyrics.
* `!sticker` (reply to an image or sticker) - Converts images to stickers or stickers to images.
* `!show` (reply to a view once message) - Reveals view once messages.


**Group Administration:**

* `!add <number>` - Adds a user to the group.
* `!ban <number or reply>` - Bans a user from the group.
* `!promote <number or reply>` - Promotes a user to admin.
* `!demote <number or reply>` - Demotes a user from admin.
* `!mute <duration(optional)>` - Mutes the group. Provide duration like `!mute 1h` for 1 hour.
* `!unmute` - Unmutes the group.
* `!tagall <message(optional)>` - Tags all group members.  If you provide a message, it will be included after the tags.
* `!tagadmin <message(optional)>` - Tags all group admins. If you provide a message, it will be included after the tags.
* `!gmute` (reply to a user) - Globally mutes a user in all groups the bot is present.
* `!ungmute` (reply to a user) - Globally unmutes a user.


**Media & Entertainment:**

* `.insta <instagram_url>` - Downloads Instagram media.
* `.tiktok <tiktok_url>` - Downloads TikTok videos.
* `.video <query or url>` - Downloads YouTube videos.
* `.music <query or url>` - Downloads YouTube music.
* `.lyrics <song name>` - Fetches song lyrics.
* `.sticker` (reply to an image or sticker) - Converts images to stickers or stickers to images.
* `.show` (reply to a view once message) - Reveals view once messages.

**Group Administration:**

* `.add <number>` - Adds a user to the group.
* `.ban <number or reply>` - Bans a user from the group.
* `.promote <number or reply>` - Promotes a user to admin.
* `.demote <number or reply>` - Demotes a user from admin.
* `.mute <duration(optional)>` - Mutes the group. Provide duration like `.mute 1h` for 1 hour.
* `.unmute` - Unmutes the group.
* `.tagall <message(optional)>` - Tags all group members. If you provide a message, it will be included after the tags.
* `.tagadmin <message(optional)>` - Tags all group admins. If you provide a message, it will be included after the tags.
* `.gmute` (reply to a user) - Globally mutes a user in all groups the bot is present.
* `.ungmute` (reply to a user) - Globally unmutes a user.

**Automation & Utilities:**

* `.filter add <incoming message> <outgoing message>` - Adds a new filter.
* `.filter delete <incoming message>` - Deletes a filter.
* `.filter` - Lists all filters in the current chat.
* `.filter <on|off>` - Enables or disables filters in the current chat.
* `.alive` - Checks if the bot is alive, shows RSS & Heap RAM, disk space, owner info, and mode.
* `.ping` - Checks the bot's response time with emoji feedback ⚡ ⏳ ⚠️.
* `.worktype <public|private>` - Changes the bot's work type (sudo only).
* `.sudo add <number>` - Adds a user to the sudo list (sudo only).
* `.sudo delete <number>` - Removes a user from the sudo list (sudo only).
* `.blacklist` - Adds or removes the current group to/from the blacklist (sudo only).
* `.menu` - Displays the command menu.
* `.edit <alive|welcome|goodbye>` (reply to a message) - Edits welcome/goodbye messages or alive message (sudo only).
* `.update` - Checks for bot updates (sudo only).
* `.update now` - Updates the bot to the latest version (sudo only).
* `.plugin <query>` - Searches for plugins.
* `.plugin top` - Shows top plugins.
* `.pinstall <plugin_id>` - Installs a plugin (sudo only).
* `.pldelete <plugin_id>` - Deletes a plugin (sudo only).

## Contributing

Contributions are welcome! Fork the repository, make your changes, and submit a pull request.


## License

MIT License. See the [LICENSE](LICENSE) file for details.