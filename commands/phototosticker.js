const { downloadContentFromMessage } = require("@whiskeysockets/baileys");
const { writeFile } = require("fs/promises");
const { exec } = require("child_process");
const path = require("path");

module.exports = {
    name: "phototosticker",
    description: "Convert photo to sticker",
    
    async execute(ctx) {
        const { sock, msg, from, messageType } = ctx;
        
        if (messageType !== "imageMessage") {
            // Check if replying to an image
            if (!msg.message.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage) {
                await sock.sendMessage(from, { 
                    text: "❌ Please send an image or reply to an image!" 
                }, { quoted: msg });
                return;
            }
        }

        try {
            let imageMessage;
            if (messageType === "imageMessage") {
                imageMessage = msg.message.imageMessage;
            } else {
                imageMessage = msg.message.extendedTextMessage.contextInfo.quotedMessage.imageMessage;
            }

            const stream = await downloadContentFromMessage(imageMessage, "image");
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            const tempPath = path.join(__dirname, "../temp");
            if (!require("fs").existsSync(tempPath)) {
                require("fs").mkdirSync(tempPath);
            }

            const pngPath = path.join(tempPath, `temp_${Date.now()}.png`);
            const webpPath = path.join(tempPath, `temp_${Date.now()}.webp`);

            await writeFile(pngPath, buffer);

            // Convert png to sticker using ffmpeg
            await new Promise((resolve, reject) => {
                exec(`ffmpeg -i ${pngPath} -vcodec libwebp -vf "scale=512:512:force_original_aspect_ratio=decrease,format=rgba,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=#00000000" -lossless 1 -q:v 80 ${webpPath}`, (error) => {
                    if (error) reject(error);
                    else resolve();
                });
            });

            await sock.sendMessage(from, {
                sticker: { url: webpPath }
            }, { quoted: msg });

            // Clean up temp files
            setTimeout(() => {
                require("fs").unlinkSync(pngPath);
                require("fs").unlinkSync(webpPath);
            }, 5000);

        } catch (error) {
            console.error(error);
            await sock.sendMessage(from, { 
                text: "❌ Failed to convert photo to sticker! Make sure ffmpeg is installed." 
            }, { quoted: msg });
        }
    }
};