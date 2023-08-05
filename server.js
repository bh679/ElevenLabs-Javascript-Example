const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = 3000;

// Import the 'speak' function from 'ElevenLabs.js'
const Speak = require('./ElevenLabs');

const ENV = require('./env');
const ELEVENLABS_API_KEY = ENV.ELEVENLABS_API_KEY;

app.use(express.json());

// Use the 'speak' function as a route handler for the '/Speak' route
app.post('/Speak', Speak);

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
