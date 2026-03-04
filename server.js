const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

app.post('/api/search', async (req, res) => {
  console.log('Search request received, embedding length:', req.body.embedding?.length);
  const { embedding } = req.body;
  const { data, error } = await supabase.rpc('match_knowledge', {
    query_embedding: embedding,
    match_count: 5
  });
  console.log('Supabase result:', { dataLength: data?.length, error });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/speak', async (req, res) => {
  const { text } = req.body;
  const voiceId = process.env.REACT_APP_ELEVENLABS_VOICE_ID;
  const apiKey = process.env.REACT_APP_ELEVENLABS_KEY;
  
  console.log('Speaking, voice ID:', voiceId);
  console.log('API key exists:', !!apiKey);
  
  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': apiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          output_format: 'mp3_44100_128',
          voice_settings: { stability: 0.5, similarity_boost: 0.75 }
        })
      }
    );
    console.log('ElevenLabs status:', response.status);
    if (!response.ok) {
      const err = await response.text();
      console.error('ElevenLabs error:', err);
      return res.status(response.status).json({ error: err });
    }
    const arrayBuffer = await response.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Speak error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/track', async (req, res) => {
  const { question, response, userAgent, sessionId } = req.body;
  try {
    await supabase.from('conversations').insert({
      question,
      response,
      user_agent: userAgent,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      await fetch(slackWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `🤖 *priyank.exe got a visitor!*\n\n*Asked:* ${question}\n\n*Response:* ${(response || '').substring(0, 200)}...\n\n*Time:* ${new Date().toLocaleString()}\n*Device:* ${(userAgent || '').substring(0, 80)}`
        })
      });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Track error:', err);
    res.json({ success: false });
  }
});

app.get('/api/visitors', async (req, res) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('session_id');
  if (error) return res.json({ count: 0 });
  const uniqueSessions = new Set(data.map(r => r.session_id));
  res.json({ count: uniqueSessions.size });
});

app.listen(3001, () => console.log('Proxy running on port 3001'));

