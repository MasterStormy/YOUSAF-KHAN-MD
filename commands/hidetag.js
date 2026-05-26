module.exports = {
    name: "hidetag",
    description: "Send message with hidden tag (Admin only)",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, isGroup } = ctx;
        
        if (!isGroup) {
            await sock.sendMessage(from, { 
                text: "❌ This command can only be used in groups!" 
            }, { quoted: msg });
            return;
        }

        // Check if sender is admin
        const groupMetadata = await sock.groupMetadata(from);
        const participant = groupMetadata.participants.find(p => p.id === sender);
        const isAdmin = participant && (participant.admin === "admin" || participant.admin === "superadmin");
        
        if (!isAdmin) {
            await sock.sendMessage(from, { 
                text: "❌ This command is only for group admins!" 
            }, { quoted: msg });
            return;
        }

        if (!args.length) {
            await sock.sendMessage(from, { 
                text: "❌ Please provide a message!" 
            }, { quoted: msg });
            return;
        }

        const message = args.join(" ");
        const participants = groupMetadata.participants.map(p => p.id);
        
        await sock.sendMessage(from, {
            text: message,
            mentions: participants
        }, { quoted: msg });
    }
};