module.exports = {
    name: "vv",
    description: "View Once message viewer (Owner only)",
    
    async execute(ctx) {
        const { sock, msg, from, sender, config } = ctx;
        
        // Check if sender is owner
        if (sender !== config.ownerNumber) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for the bot owner!" 
            }, { quoted: msg });
            return;
        }

        // Check if replying to a view once message
        const quotedMsg = msg.message.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quotedMsg) {
            await sock.sendMessage(from, { 
                text: "❌ Please reply to a view once message!" 
            }, { quoted: msg });
            return;
        }

        try {
            if (quotedMsg.imageMessage) {
                const buffer = await sock.downloadMediaMessage({
                    key: {
                        remoteJid: from,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    },
                    message: quotedMsg
                });
                
                await sock.sendMessage(from, {
                    image: buffer,
                    caption: "✅ View Once Image Revealed!"
                }, { quoted: msg });
                
            } else if (quotedMsg.videoMessage) {
                const buffer = await sock.downloadMediaMessage({
                    key: {
                        remoteJid: from,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    },
                    message: quotedMsg
                });
                
                await sock.sendMessage(from, {
                    video: buffer,
                    caption: "✅ View Once Video Revealed!"
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, { 
                    text: "❌ Not a view once media message!" 
                }, { quoted: msg });
            }
        } catch (error) {
            await sock.sendMessage(from, { 
                text: "❌ Failed to view once message!" 
            }, { quoted: msg });
        }
    }
};