const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. WhatsApp Webhook Verification
app.get('/api/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // This 'boro_safe_2026' must match what you type in Meta Dashboard
    if (mode && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// 2. Handling Incoming "Boro" Messages
app.post('/api/webhook', async (req, res) => {
    const body = req.body;
    
    // Check if it's a message from WhatsApp
    if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const msg = body.entry[0].changes[0].value.messages[0];
        const from = msg.from; 
        const text = msg.text.body.toLowerCase();

        if (text.includes('boro') || text.includes('help')) {
            // We use a placeholder link for now
            const boroLink = `https://${process.env.VERCEL_URL || 'your-app.vercel.app'}/pay?to=${from}`;
            
            const reply = `🛡️ *BORO: EMERGENCY BRIDGE*\n\nYour helper can use this link to fund your vault:\n\n👉 ${boroLink}\n\n_Givers Never Lack._`;
            
            await sendWhatsApp(from, reply);
        }
    }
    res.sendStatus(200);
});

async function sendWhatsApp(to, text) {
    try {
        await axios.post(`https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`, {
            messaging_product: "whatsapp",
            to: to,
            text: { body: text }
        }, {
            headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` }
        });
    } catch (error) {
        console.error("WhatsApp API Error:", error.response?.data || error.message);
    }
}

module.exports = app;
