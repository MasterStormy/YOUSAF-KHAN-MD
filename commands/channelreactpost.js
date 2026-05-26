module.exports = {
    name: "channelreactpost",
    description: "React to channel posts (Owner only)",
    
    async execute(ctx) {
        const { sock, msg, from, sender, config } = ctx;
        
        // Check if sender is owner
        if (sender !== config.ownerNumber) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for the bot owner!" 
            }, { quoted: msg });
            return;
        }

        // Check if the message is a reply
        if (!msg.message.extendedTextMessage?.contextInfo?.participant) {
            await sock.sendMessage(from, { 
                text: "❌ Please reply to a channel post to react!" 
            }, { quoted: msg });
            return;
        }

        try {
            await sock.sendMessage(from, {
                react: {
                    text: "❤️",
                    key: msg.message.extendedTextMessage.contextInfo.stanzaId ? {
                        remoteJid: from,
                        fromMe: false,
                        id: msg.message.extendedTextMessage.contextInfo.stanzaId,
                        participant: msg.message.extendedTextMessage.contextInfo.participant
                    } : msg.key
                }
            });
        } catch (error) {
            await sock.sendMessage(from, { 
                text: "❌ Failed to react to the post!" 
            }, { quoted: msg });
        }
    }
};