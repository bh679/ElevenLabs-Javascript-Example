const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

const ENV = require('./env');
const ELEVENLABS_API_KEY = ENV.ELEVENLABS_API_KEY;

app.use(express.json());

app.post('/speak', async (req, res) => {
    const text = req.body.text;
    const voiceId = '21m00Tcm4TlvDq8ikWAM';  // replace with your voice id

    const headers = {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
    };

    const body = JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
        }
    });

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: headers,
        body: body
    });

    const audio = await response.blob();
    res.send(audio);
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
