module.exports = {
    name: "tagmemonly",
    description: "Tag non-admin group members",
    
    async execute(ctx) {
        const { sock, msg, from, sender, args, isGroup } = ctx;
        
        if (!isGroup) {
            await sock.sendMessage(from, { 
                text: "❌ This command can only be used in groups!" 
            }, { quoted: msg });
            return;
        }

        const groupMetadata = await sock.groupMetadata(from);
        const members = groupMetadata.participants.filter(p => 
            !p.admin
        );
        
        if (members.length === 0) {
            await sock.sendMessage(from, { 
                text: "❌ No regular members in this group!" 
            }, { quoted: msg });
            return;
        }
        
        const message = args.length ? args.join(" ") : "Calling all members!";
        
        let tagText = `👥 *TAG MEMBERS*\n\n${message}\n\n`;
        members.forEach((member, i) => {
            tagText += `@${member.id.split("@")[0]} `;
            if ((i + 1) % 5 === 0) tagText += "\n";
        });
        
        await sock.sendMessage(from, {
            text: tagText,
            mentions: members.map(m => m.id)
        }, { quoted: msg });
    }
};