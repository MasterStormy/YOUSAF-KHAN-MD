const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const { exec } = require("child_process");
const path = require("path");

module.exports = {
    name: "stickertophoto",
    description: "Convert sticker to photo",
    
    async execute(ctx) {
        const { sock, msg, from, messageType } = ctx;
        
        if (messageType !== "stickerMessage") {
            // Check if replying to a sticker
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage) {
                await sock.sendMessage(from, { 
                    text: "❌ Please send a sticker or reply to a sticker!" 
                }, { quoted: msg });
                return;
            }
        }

        try {
            let stickerMessage;
            if (messageType === "stickerMessage") {
                stickerMessage = msg.message.stickerMessage;
            } else {
                stickerMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.stickerMessage;
            }

            const stream = await downloadContentFromMessage(stickerMessage, "sticker");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempPath = path.join(__dirname, "../temp");
            const webpPath = path.join(tempPath, `temp_${Date.now()}.webp`);
            const pngPath = path.join(tempPath, `temp_${Date.now()}.png`);

            await writeFile(webpPath, buffer);

            // Convert webp to png using ffmpeg (requires ffmpeg installed)
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -i ${webpPath} ${pngPath}`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            await sock.sendMessage(from, {
                image: { url: pngPath },
                caption: "✅ Sticker converted to photo!"
            }, { quoted: msg });

            // Clean up temp files
            setTimeout(() => {
                require("fs").unlinkSync(webpPath);
                require("fs").unlinkSync(pngPath);
            }, 5000);

        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { 
                text: "❌ Failed to convert sticker to photo! Make sure ffmpeg is installed." 
            }, { quoted: msg });
        }
    }
};