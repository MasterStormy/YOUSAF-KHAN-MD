module.exports = {
    name: "tagall",
    description: "Tag all group members (Admin only)",
    
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

        const message = args.length ? args.join(" ") : "Attention everyone!";
        const participants = groupMetadata.participants.map(p => p.id);
        
        let tagText = `📢 *TAG ALL*\n\n${message}\n\n`;
        participants.forEach((p, i) => {
            tagText += `@${p.split("@")[0]} `;
            if ((i + 1) % 5 === 0) tagText += "\n";
        });
        
        await sock.sendMessage(from, {
            text: tagText,
            mentions: participants
        }, { quoted: msg });
    }
};