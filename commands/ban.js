module.exports = {
    name: "ban",
    description: "Ban a user from using bot",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, config, db } = ctx;
        
        // Check if sender is owner
        if (sender !== config.ownerNumber) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for the bot owner!" 
            }, { quoted: msg });
            return;
        }

        let target;
        
        // Check if replying to a message
        if (msg.message.extendedTextMessage?.contextInfo?.participant) {
            target = msg.message.extendedTextMessage.contextInfo.participant;
        } else if (args[0]) {
            target = args[0].includes("@s.whatsapp.net") ? args[0] : `${args[0]}@s.whatsapp.net`;
        } else {
            await sock.sendMessage(from, { 
                text: "❌ Please reply to a message or provide a number!" 
            }, { quoted: msg });
            return;
        }

        db.addBannedUser(target);
        
        await sock.sendMessage(from, { 
            text: `🚫 User *${target.split("@")[0]}* has been banned from using the bot!` 
        }, { quoted: msg });
    }
};