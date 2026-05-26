module.exports = {
    name: "ping",
    description: "Check bot response time",
    
    async execute(ctx) {
        const { sock, msg, from } = ctx;
        
        const start = Date.now();
        await sock.sendMessage(from, { text: "📊 *Checking Ping...*" }, { quoted: msg });
        const end = Date.now();
        const ping = end - start;
        
        await sock.sendMessage(from, { 
            text: `🏓 *Pong!*\n📡 *Response Time:* ${ping}ms` 
        }, { quoted: msg });
    }
};