const express = require('express');
const cors    = require('cors');
const multer  = require('multer');
require('dotenv').config();

const app    = express();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.post('/api/analyze', async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: 'No summary provided' });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'OpenAI API key not configured on server' });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 1000,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `You are an expert digital marketing analyst specializing in Meta (Facebook/Instagram) advertising for MENA and GCC markets. 
You write clear, professional, data-driven reports for clients. Be specific, reference actual numbers, and focus on strategic value.
Always respond with valid JSON only — no markdown, no code blocks, just raw JSON.`
          },
          {
            role: 'user',
            content: `Analyze this Meta Ads campaign data and respond with a JSON object with exactly this structure:
{
  "summary": "2-3 sentence executive summary referencing specific numbers",
  "insights": [
    {"title": "short insight title (max 6 words)", "body": "2-3 sentences with specific numbers from the data", "color": "teal"},
    {"title": "short insight title", "body": "2-3 sentences with specific numbers", "color": "gold"},
    {"title": "short insight title", "body": "2-3 sentences with specific numbers", "color": "teal"},
    {"title": "short insight title", "body": "2-3 sentences with specific numbers", "color": "gold"},
    {"title": "short insight title", "body": "2-3 sentences with specific numbers", "color": "teal"},
    {"title": "short insight title", "body": "2-3 sentences with specific numbers", "color": "gold"}
  ]
}

Use "teal" and "gold" alternating for colors. Ground every insight in the actual numbers below.

${summary}`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', err);
      return res.status(502).json({ error: 'OpenAI API error', detail: err });
    }

    const data   = await response.json();
    const text   = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(text);
    res.json(parsed);

  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', detail: err.message });
  }
});

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`AdInsight running on port ${PORT}`));
