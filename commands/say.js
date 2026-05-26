module.exports = {
    name: "say",
    description: "Make bot say something",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, config } = ctx;
        
        // Check if sender is owner
        if (sender !== config.ownerNumber) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for the bot owner!" 
            }, { quoted: msg });
            return;
        }

        if (!args.length) {
            await sock.sendMessage(from, { 
                text: "❌ Please provide a message to say!" 
            }, { quoted: msg });
            return;
        }

        const message = args.join(" ");
        await sock.sendMessage(from, { text: message }, { quoted: msg });
    }
};