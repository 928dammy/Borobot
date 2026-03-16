const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.json());

// 1. WhatsApp Webhook Verification
app.get('/api/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token === process.env.WEBHOOK_VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }
    res.sendStatus(403);
});

// 2. Incoming Message Logic
app.post('/api/webhook', async (req, res) => {
    try {
        const body = req.body;
        if (body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
            const msg = body.entry[0].changes[0].value.messages[0];
            const from = msg.from;
            const text = msg.text.body.toLowerCase();

            if (text.includes('boro') || text.includes('help')) {
                // Generates the link to your Vercel site
                const boroLink = `https://borobot-pi.vercel.app/pay?to=${from}`;
                
                const reply = `🛡️ *BORO: EMERGENCY BRIDGE*\n\nYour vault is ready. Share this link with your helper to receive emergency funds:\n\n👉 ${boroLink}\n\n_Givers Never Lack._`;
                
                await sendWhatsApp(from, reply);
            }
        }
        res.sendStatus(200);
    } catch (err) {
        console.error("Webhook Error:", err);
        res.sendStatus(500);
    }
});

async function sendWhatsApp(to, text) {
    await axios.post(`https://graph.facebook.com/v21.0/${process.env.WA_PHONE_ID}/messages`, {
        messaging_product: "whatsapp",
        to: to,
        text: { body: text }
    }, {
        headers: { Authorization: `Bearer ${process.env.WA_TOKEN}` }
    });
}

module.exports = app;
