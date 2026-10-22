const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const TOKEN = '8942840244:AAGs9fFyjtYut4gKuydL7Ciq21TGIe0KkIw';
const bot = new TelegramBot(TOKEN, { polling: true });
const CHANNEL_USERNAME = '@TouchEarningBDOfficial'; 

app.post('/check-subscription', async (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.json({ subscribed: false });

    try {
        let chatMember = await bot.getChatMember(CHANNEL_USERNAME, userId);
        let status = chatMember.status;
        
        if (status === 'member' || status === 'administrator' || status === 'creator') {
            return res.json({ subscribed: true });
        } else {
            return res.json({ subscribed: false });
        }
    } catch (error) {
        return res.json({ subscribed: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
