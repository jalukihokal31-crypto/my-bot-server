const express = require('express');
const TelegramBot = require('node-telegram-bot-api');
const cors = require('cors');
const admin = require('firebase-admin');

// ফায়ারবেস ডেটাবেস কানেকশন (অ্যাডমিন প্যানেলের নোটিশ পড়ার জন্য)
// আপনার ফায়ারবেস প্রজেক্টের রিয়েলটাইম ডাটাবেস URL এখানে দেবেন
const firebaseConfig = {
  databaseURL: "https://touchearning-59948-default-rtdb.firebaseio.com"
};

// নোটিশ পাঠানোর জন্য বেসিক ইনিশিয়ালাইজেশন
const app = express();
app.use(express.json());
app.use(cors());

const TOKEN = '8942840244:AAGs9fFyjtYut4gKuydL7Ciq21TGIe0KkIw';
const bot = new TelegramBot(TOKEN, { polling: true });
const CHANNEL_USERNAME = '@TouchEarningBDOfficial'; 

// ইউজার সাবস্ক্রিপশন চেক করার এপিআই
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

// যখনই ফায়ারবেসে নতুন কোনো ব্রডকাস্ট নোটিশ অ্যাড হবে, সার্ভার সেটা ধরে সব ইউজারের কাছে পাঠিয়ে দেবে
const axios = require('axios');
const DB_URL = "https://touchearning-59948-default-rtdb.firebaseio.com";

let lastCheckedTime = "";

setInterval(async () => {
    try {
        let response = await axios.get(`${DB_URL}/broadcasts.json`);
        let broadcasts = response.data;
        if (broadcasts) {
            let keys = Object.keys(broadcasts);
            let latestKey = keys[keys.length - 1];
            let latestNotice = broadcasts[latestKey];

            if (latestNotice && latestNotice.time !== lastCheckedTime) {
                lastCheckedTime = latestNotice.time;

                // ফায়ারবেস থেকে সকল ইউজারের আইডি নিয়ে তাদের মেসেজ পাঠানো
                let usersRes = await axios.get(`${DB_URL}/users.json`);
                let users = usersRes.data;
                if (users) {
                    Object.keys(users).forEach(uid => {
                        // যদি ইউজার আইডি টেলিগ্রামের নিজস্ব নাম্বার (যেমন সংখ্যা দিয়ে শুরু) হয়
                        if (!uid.startsWith('TG_')) {
                            bot.sendMessage(uid, `📢 **অ্যাডমিন নোটিশ:**\n\n${latestNotice.message}`, { parse_mode: 'Markdown' }).catch(err => {});
                        }
                    });
                }
            }
        }
    } catch (e) {
        console.log("Broadcast error:", e);
    }
}, 5000); // প্রতি ৫ সেকেন্ড পর পর নতুন নোটিশ চেক করবে

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
