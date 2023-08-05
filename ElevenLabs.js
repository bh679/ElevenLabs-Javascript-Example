const axios = require('axios');
const ENV = require('./env');
const ELEVENLABS_API_KEY = ENV.ELEVENLABS_API_KEY;

//Speak text with ElevenLabs
const Speak = async (req, res) => {
    console.log("Speak");
    const text = req.body.text;
    var voiceId;

    if(req.body.voiceId == null || req.body.voiceId == "")
        voiceId = '21m00Tcm4TlvDq8ikWAM';  // replace with your voice id
    else
        voiceId = req.body.voiceId;

    console.log("VoiceId " + voiceId);

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

    const response = await axios.post(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, body, {
        headers: headers,
        responseType: 'arraybuffer'  // This is important for handling binary data
    });

    const audio = Buffer.from(response.data, 'binary');
    res.send(audio);
};

module.exports = Speak;
