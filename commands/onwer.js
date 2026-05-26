module.exports = {
    name: "owner",
    description: "Show owner contact",
    
    async execute(ctx) {
        const { sock, msg, from, config } = ctx;
        
        const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:${config.botName} Owner\nTEL;type=CELL;type=VOICE;waid=${config.ownerNumber.split("@")[0]}:+${config.ownerNumber.split("@")[0]}\nEND:VCARD`;
        
        await sock.sendMessage(from, {
            contacts: {
                displayName: `${config.botName} Owner`,
                contacts: [{ vcard }]
            }
        }, { quoted: msg });
    }
};
