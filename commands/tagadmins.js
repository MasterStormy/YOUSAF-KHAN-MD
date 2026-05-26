module.exports = {
    name: "tagadmins",
    description: "Tag all group admins",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, isGroup } = ctx;
        
        if (!isGroup) {
            await sock.sendMessage(from, { 
                text: "❌ This command can only be used in groups!" 
            }, { quoted: msg });
            return;
        }

        const groupMetadata = await sock.groupMetadata(from);
        const admins = groupMetadata.participants.filter(p => 
            p.admin === "admin" || p.admin === "superadmin"
        );
        
        const message = args.length ? args.join(" ") : "Calling all admins!";
        
        let tagText = `👑 *TAG ADMINS*\n\n${message}\n\n`;
        admins.forEach((admin, i) => {
            tagText += `@${admin.id.split("@")[0]} `;
            if ((i + 1) % 3 === 0) tagText += "\n";
        });
        
        await sock.sendMessage(from, {
            text: tagText,
            mentions: admins.map(a => a.id)
        }, { quoted: msg });
    }
};