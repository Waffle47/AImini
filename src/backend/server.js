require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();

// 1. Configure CORS to allow your Vercel URL in production
// While developing, app.use(cors()) works, but for deployment:
app.use(cors({
    origin: process.env.FRONTEND_URL || '*', 
    methods: ['GET', 'POST']
}));

app.use(express.json());

// Check if API key exists before starting
if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ ERROR: ANTHROPIC_API_KEY is missing from .env file");
    process.exit(1);
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/api/analyse', async (req, res) => {
    try {
        const { email } = req.body;
        console.log("📩 Received analysis request...");

        if (!email) {
            return res.status(400).json({ error: "Email content is required" });
        }

        const msg = await anthropic.messages.create({
            // Ensure you use a valid model string like "claude-3-7-sonnet-20250219"
            model: "claude-sonnet-4-6", 
            max_tokens: 1024,
            system: "You are a fraud detection engine. Analyze emails and return ONLY a raw JSON object. Do not include any introductory text or markdown formatting.",
            messages: [{ 
                role: "user", 
                content: `Analyze this email and return JSON with keys: verdict, confidence, summary, red_flags, green_flags, top_reason. Email: "${email}"` 
            }],
        });

        const aiResponseText = msg.content[0].text;
        
        try {
            const result = JSON.parse(aiResponseText.replace(/```json|```/g, "").trim());
            console.log("✅ Analysis successful");
            res.json(result); 
        } catch (parseError) {
            console.error("⚠️ AI returned invalid JSON format.");
            res.status(422).json({ error: "Invalid AI format", raw: aiResponseText });
        }

    } catch (error) {
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

// 2. Render provides the PORT automatically via environment variables
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FraudGuard Server running on port ${PORT}`);
});