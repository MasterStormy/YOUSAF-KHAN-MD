module.exports = {
    name: "autotyping",
    description: "Toggle auto typing (Owner only)",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, config, db } = ctx;
        
        // Check if sender is owner
        if (sender !== config.ownerNumber) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for the bot owner!" 
            }, { quoted: msg });
            return;
        }

        if (!args[0] || !["on", "off"].includes(args[0].toLowerCase())) {
            await sock.sendMessage(from, { 
                text: `❌ Usage: ${config.prefix}autotyping on/off` 
            }, { quoted: msg });
            return;
        }

        const status = args[0].toLowerCase();
        db.updateSetting(from, "autotyping", status);
        
        await sock.sendMessage(from, { 
            text: `✅ Auto Typing turned *${status.toUpperCase()}*` 
        }, { quoted: msg });
    }
};