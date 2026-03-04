require('dotenv').config();
const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const cors = require('cors');

const app = express();
app.use(cors());
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

        const msg = await anthropic.messages.create({
            // UPDATED MODEL: Replacing retired 3.5 Sonnet with Sonnet 4.6
            model: "claude-sonnet-4-6", 
            max_tokens: 1024,
            // SYSTEM PROMPT: Forces AI to behave as a pure API
            system: "You are a fraud detection engine. Analyze emails and return ONLY a raw JSON object. Do not include any introductory text or markdown formatting.",
            messages: [{ 
                role: "user", 
                content: `Analyze this email and return JSON with keys: verdict, confidence, summary, red_flags, green_flags, top_reason. Email: "${email}"` 
            }],
        });

        //  Extract only the text content
        const aiResponseText = msg.content[0].text;
        
        //  Attempt to parse JSON on server to ensure frontend gets valid data
        try {
            const result = JSON.parse(aiResponseText.replace(/```json|```/g, "").trim());
            console.log("✅ Analysis successful");
            res.json(result); 
        } catch (parseError) {
            console.error("⚠️ AI returned invalid JSON format.");
            res.status(422).json({ error: "Invalid AI format", raw: aiResponseText });
        }

    } catch (error) {
        // This will now catch 404s if model names are wrong or 401s for key issues
        console.error("❌ Server Error:", error.message);
        res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 FraudGuard Server running on port ${PORT}`));