const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, delay } = require('@whiskeysockets/baileys');
const fs = require('fs');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

let openedSocket = false;
let chat_count = 0;
let countdown = 150;

try { fs.rmSync('./session', { recursive: true, force: true }); } catch { }
try { fs.rmSync('./.started', { recursive: true, force: true }); } catch { }

const logger = pino({ level: "silent" });

const rl = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});

// Giriş ekranı
async function login() {
  console.clear();
  rl.question("QR Kodu (1) veya Telefon Numarası (2) ile giriş yapın\n\n⚠️ Telefon numarası ile giriş yapmanız önerilmez! :: ", async (answer) => {
    console.clear();
    rl.question("WhatsApp hesabınıza bağlı başka bir cihaz var mı? (e/h)\n\n >> ", async (answer2) => {
      console.clear();

      if (answer2.toLowerCase() === "e") {
        console.log("❌ Lütfen giriş yapmadan önce tüm cihazlarınızdan çıkış yapın.");
        process.exit(1);
      }

      if (answer === "2") {
        rl.question("Telefon numaranızı girin (Örnek: 905123456789)\n\n >> ", async (number) => {
          await loginWithPhone(number);
        });
      } else if (answer === "1") {
        await loginWithQR();
      } else {
        console.log("Geçersiz seçim yapıldı. Program sonlandırılıyor...");
        process.exit(1);
      }
    });
  });
}

// QR kod ile giriş
async function loginWithQR() {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session/');

  const sock = makeWASocket({
    logger,
    auth: state,
    version,
    getMessage: async () => { },
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection, qr } = update;

    if (qr) {
      console.log("\n📱 Aşağıdaki QR kodu WhatsApp'tan tarayın:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "connecting") {
      console.log("🔄 WhatsApp'a bağlanılıyor... Lütfen bekleyin.");
    } else if (connection === "open") {
      await delay(1000);
      console.clear();
      if (!openedSocket) {
        openedSocket = true;
        try {
          const chats = await sock.groupFetchAllParticipating();
          chat_count = Object.keys(chats).length;
        } catch { }
      }
      countdown = Math.max(150, chat_count * 3.1);
      fs.writeFileSync('.started', '1');
      console.log("✅ QR kod ile başarıyla giriş yapıldı!");
    } else if (connection === 'close') {
      console.log("⚠️ Bağlantı kapandı. Yeniden bağlanılıyor...");
      await delay(2000);
      await loginWithQR();
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// Telefon numarası ile giriş
async function loginWithPhone(phoneNumber) {
  const { version } = await fetchLatestBaileysVersion();
  const { state, saveCreds } = await useMultiFileAuthState('./session/');

  const sock = makeWASocket({
    logger,
    auth: state,
    version,
    getMessage: async () => { },
  });

  sock.ev.on('connection.update', async (update) => {
    const { connection } = update;

    if (connection === 'open') {
      console.log("✅ Telefon numarası ile başarıyla giriş yapıldı!");
      openedSocket = true;
      try {
        const chats = await sock.groupFetchAllParticipating();
        chat_count = Object.keys(chats).length;
      } catch { }
      countdown = Math.max(150, chat_count * 3.1);
      fs.writeFileSync('.started', '1');
    } else if (connection === 'close') {
      console.log("⚠️ Bağlantı kapandı. Telefon numarası ile yeniden bağlanılıyor...");
      await delay(2000);
      await loginWithPhone(phoneNumber);
    } else if (!connection && !sock.authState.creds.registered) {
      const pairingCode = await sock.requestPairingCode(phoneNumber);
      const formattedCode = pairingCode.slice(0, 4) + "-" + pairingCode.slice(4);
      console.log(`📲 WhatsApp eşleştirme kodunuz: ${formattedCode}`);
      console.log("Bu kodu WhatsApp uygulamanızda 'Bağlı Cihazlar' kısmına girin.");
    }
  });

  sock.ev.on('creds.update', saveCreds);
}

// Sayaç / mesaj senkronizasyonu
setInterval(() => {
  if (!openedSocket || chat_count <= 0) return;
  if (!fs.existsSync('.started')) return;

  console.clear();
  console.log(`🔄 Mesajlar senkronize ediliyor... (${(countdown / 10).toFixed(2)} saniye kaldı | Sohbet sayısı: ${chat_count})`);
  countdown--;

  if (countdown < 0) {
    console.clear();
    console.log("✅ Bot başarıyla çalışıyor!\n💡 Botu başlatmak için: pm2 start main.js");
    process.exit(1);
  }
}, 100);

// Başlat
login();
