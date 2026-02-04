const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const auth = require('../middleware/auth');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// Get chat history (isolated)
router.get('/', auth, async (req, res) => {
    try {
        const ChatMessage = req.db.model('ChatMessage');
        const history = await ChatMessage.find({})
            .sort({ createdAt: 1 });
        res.json(history);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Send message (isolated)
router.post('/', auth, async (req, res) => {
    try {
        const ChatMessage = req.db.model('ChatMessage');
        const { message } = req.body;
        const userId = req.user.id;

        // Save user message
        const userMsg = new ChatMessage({
            userId,
            role: 'user',
            content: message
        });
        await userMsg.save();

        let aiResponseContent = "I am a basic chatbot. Please configure OPENAI_API_KEY to get real AI responses.";

        if (process.env.OPENAI_API_KEY) {
            try {
                const completion = await openai.chat.completions.create({
                    messages: [{ role: "user", content: message }],
                    model: "gpt-3.5-turbo",
                });
                aiResponseContent = completion.choices[0].message.content;
            } catch (openaiErr) {
                console.error("OpenAI Error:", openaiErr);
                aiResponseContent = "Sorry, I am having trouble connecting to my brain right now.";
            }
        }

        // Save AI response
        const aiMsg = new ChatMessage({
            userId,
            role: 'assistant',
            content: aiResponseContent
        });
        await aiMsg.save();

        res.json(aiMsg);

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
