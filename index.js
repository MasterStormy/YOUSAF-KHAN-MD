const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
    Browsers
} = require("@whiskeysockets/baileys");
const qrcode = require("qrcode-terminal");
const config = require("./config");
const db = require("./database");
const fs = require("fs");
const path = require("path");

// Command imports
const menuCommand = require("./commands/menu");
const pingCommand = require("./commands/ping");
const ownerCommand = require("./commands/owner");
const channelreactpostCommand = require("./commands/channelreactpost");
const autotypingCommand = require("./commands/autotyping");
const autorecordingCommand = require("./commands/autorecording");
const vvCommand = require("./commands/vv");
const blockCommand = require("./commands/block");
const banCommand = require("./commands/ban");
const unblockCommand = require("./commands/unblock");
const sayCommand = require("./commands/say");
const hidetagCommand = require("./commands/hidetag");
const tagallCommand = require("./commands/tagall");
const tagadminsCommand = require("./commands/tagadmins");
const tagmemonlyCommand = require("./commands/tagmemonly");
const stickertophotoCommand = require("./commands/stickertophoto");
const phototostickerCommand = require("./commands/phototosticker");

// Create directories if not exists
if (!fs.existsSync("./commands")) {
    fs.mkdirSync("./commands");
}

if (!fs.existsSync("./session")) {
    fs.mkdirSync("./session");
}

if (!fs.existsSync("./temp")) {
    fs.mkdirSync("./temp");
}

// Command map
const commands = {
    menu: menuCommand,
    ping: pingCommand,
    owner: ownerCommand,
    channelreactpost: channelreactpostCommand,
    autotyping: autotypingCommand,
    autorecording: autorecordingCommand,
    vv: vvCommand,
    block: blockCommand,
    ban: banCommand,
    unblock: unblockCommand,
    say: sayCommand,
    hidetag: hidetagCommand,
    tagall: tagallCommand,
    tagadmins: tagadminsCommand,
    tagmemonly: tagmemonlyCommand,
    stickertophoto: stickertophotoCommand,
    phototosticker: phototostickerCommand
};

// Get phone number from environment variable or config
function getPhoneNumber() {
    // Check environment variable first
    if (process.env.PAIR_CODE_NUMBER) {
        return process.env.PAIR_CODE_NUMBER;
    }
    // Fallback to config number (remove @s.whatsapp.net)
    const ownerNum = config.ownerNumber || "";
    return ownerNum.replace("@s.whatsapp.net", "");
}

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: Browsers.macOS("Desktop"),
        syncFullHistory: false
    });

    // ====== PAIR CODE LOGIC START ======
    sock.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log("══════════════════════════════════");
            console.log("📱 QR Code received! Generating Pair Code...");
            console.log("══════════════════════════════════");
            
            const phoneNumber = getPhoneNumber();
            
            if (!phoneNumber || phoneNumber === "923000000000") {
                console.log("❌ ERROR: Phone number not set!");
                console.log("Please set your number in config.js or environment variables");
                console.log("══════════════════════════════════");
                return;
            }
            
            try {
                // Request Pairing Code
                const code = await sock.requestPairingCode(phoneNumber);
                
                console.log("══════════════════════════════════");
                console.log("✅ YOUR PAIR CODE IS:", code);
                console.log("══════════════════════════════════");
                console.log("📱 HOW TO CONNECT:");
                console.log("1. Open WhatsApp on your phone");
                console.log("2. Go to Settings → Linked Devices");
                console.log("3. Tap 'Link a Device'");
                console.log("4. Tap 'Link with Phone Number'");
                console.log("5. Enter your number:", phoneNumber);
                console.log("6. Enter the Pair Code:", code);
                console.log("══════════════════════════════════");
                console.log("⏰ Code expires in 60 seconds!");
                console.log("══════════════════════════════════");
                
            } catch (error) {
                console.log("══════════════════════════════════");
                console.log("❌ Failed to generate Pair Code");
                console.log("Error:", error.message);
                console.log("══════════════════════════════════");
                console.log("💡 Trying alternative method...");
                console.log("Please scan QR Code instead:");
                qrcode.generate(qr, { small: true });
                console.log("══════════════════════════════════");
            }
        }
        
        if (connection === "close") {
            const shouldReconnect = 
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            
            console.log("⚠️ Connection closed");
            
            if (shouldReconnect) {
                console.log("🔄 Reconnecting...");
                startBot();
            } else {
                console.log("❌ Logged out. Delete session folder and restart.");
            }
        } else if (connection === "open") {
            console.log("══════════════════════════════════");
            console.log("✅ BOT CONNECTED SUCCESSFULLY!");
            console.log(`🤖 Bot Name: ${config.botName}`);
            console.log(`📌 Prefix: ${config.prefix}`);
            console.log(`👑 Owner: ${config.ownerNumber.split("@")[0]}`);
            console.log("══════════════════════════════════");
        }
    });
    // ====== PAIR CODE LOGIC END ======

    // Save credentials
    sock.ev.on("creds.update", saveCreds);

    // Handle messages
    sock.ev.on("messages.upsert", async (m) => {
        const msg = m.messages[0];
        if (!msg.message) return;
        if (msg.key.fromMe) return;

        const from = msg.key.remoteJid;
        const sender = msg.key.participant || msg.key.remoteJid;
        const isGroup = from.endsWith("@g.us");
        const messageType = Object.keys(msg.message)[0];
        
        // Get message text
        let body = "";
        if (messageType === "conversation") {
            body = msg.message.conversation;
        } else if (messageType === "extendedTextMessage") {
            body = msg.message.extendedTextMessage.text;
        } else if (messageType === "imageMessage") {
            body = msg.message.imageMessage.caption || "";
        } else if (messageType === "videoMessage") {
            body = msg.message.videoMessage.caption || "";
        }

        // Check if message starts with prefix
        if (!body.startsWith(config.prefix)) return;

        // Parse command and args
        const args = body.slice(config.prefix.length).trim().split(/ +/);
        const commandName = args.shift().toLowerCase();

        // Check if user is banned
        const bannedUsers = db.getBannedUsers();
        if (bannedUsers.includes(sender)) {
            if (commandName !== "menu") {
                await sock.sendMessage(from, { 
                    text: "❌ You are banned from using this bot!" 
                }, { quoted: msg });
                return;
            }
        }

        // Check if user is blocked
        const blockedUsers = db.getBlockedUsers();
        if (blockedUsers.includes(sender)) {
            return; // Silent ignore
        }

        // Prepare context
        const ctx = {
            sock,
            msg,
            from,
            sender,
            isGroup,
            args,
            commandName,
            body,
            config,
            db,
            messageType
        };

        // Execute command
        try {
            if (commands[commandName]) {
                await commands[commandName].execute(ctx);
            }
        } catch (error) {
            console.error(`Error in command ${commandName}:`, error);
            await sock.sendMessage(from, { 
                text: "❌ An error occurred while executing the command." 
            }, { quoted: msg });
        }
    });

    return sock;
}

// Start the bot
console.log("══════════════════════════════════");
console.log("🤖 Starting WhatsApp Bot...");
console.log("══════════════════════════════════");

startBot().catch((err) => {
    console.error("Failed to start bot:", err);
    process.exit(1);
});