// A class that manages speech synthesis through an external API
class SpeechManager {
    // The constructor initializes the class with the API domain and sets up some state variables
    constructor(apiDomain, status) {
        this.apiDomain = apiDomain;  // The domain of the API to fetch speech from
        this.currentAudio = null;  // The Audio object of the currently playing speech
        this.queue = [];  // A queue of speech tasks
        this.voicing = true;  // A flag indicating whether speech synthesis is currently allowed
        this.isSpeaking = false;  // A flag indicating whether speech synthesis is currently happening
        
        this.audioContext = null;//new (window.AudioContext || window.webkitAudioContext)();
        this.unlocked = false;

        if(status)
            this.status = status;

         this.cache = new Map();  // Cache to store audio blob URLs for text-voice combinations
    }

    async unlockAudioContext() {
    if (this.unlocked) return;

    this.AddToStatus("Unlocking", true);

    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

    const buffer = this.audioContext.createBuffer(1, 1, 22050);
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start(0);

    // Older browsers might require 'noteOn' instead of 'start'.
    // source.noteOn(0); 

    // By checking the play state after some time, we can see if we're really unlocked
    setTimeout(() => {
        if((source.playbackState === source.PLAYING_STATE || source.playbackState === source.FINISHED_STATE)) {
            this.unlocked = true;
            this.AddToStatus("Unlocked");
        }
    }, 0);
}


    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {

            this.AddToStatus("resuming");
            await this.audioContext.resume();
        }
    }

    // The AddToStatus function updates the status text
    // newLine is the text to be added
    // reset is a boolean indicating whether the status text should be cleared before adding newLine
    AddToStatus(newLine, reset)
    {
        console.log(newLine);

        // If reset is true, clear the status text
        if(reset)
            if (this.status != null)
                this.status.innerText = "";
        
        // Add newLine to the status text
        if (this.status != null) this.status.innerText += newLine + "\n";
    }

    // The Speak function initiates a speech task
    async Speak(text, voice, callBack) 
    {
        this.AddToStatus("Speak text:" + text + " voice:" + voice);

        if (!this.unlocked)
            await buttonPressHandler();

        // If the system is not currently allowed to speak, or if there is an audio currently playing, or if a speech task is already happening, return immediately
        if (!this.voicing)
            return;

        //if new thing to be said
        if (text != null && voice != null) {
            console.log("Adding to queue");

            const cacheKey = `${text}-${voice}`;  // Create a unique key for text-voice combination
            let blobUrl;

            if (this.cache.has(cacheKey)) {
                blobUrl = this.cache.get(cacheKey);  // Retrieve the blob URL from the cache
            } else {
                blobUrl = await this.fetchSpeech(text, voice);
                this.cache.set(cacheKey, blobUrl);  // Store the blob URL in the cache
            }

            this.queue.push({ text: text, voice: voice, callBack: callBack, blobUrl: blobUrl });

            // If it's not currently speaking, start to play
            if (!this.isSpeaking) {
                await this.PlayNextInQueue();
            }
        }
    }


    async PlayNextInQueue() {
        // If the system is currently speaking or there's no speech task in the queue, return immediately
        if (this.isSpeaking || this.queue.length === 0)
            return;

        this.isSpeaking = true;  // Set the isSpeaking flag to true

        console.log("getting message to play");

        // Dequeue the next speech task
        let message = this.queue.shift();

        // Update the status text
        this.AddToStatus("Speak: " + message.text, true);

        try {
            // Fetch and decode the audio for the given text
            const audioBuffer = await this.GetAudio(message.blobUrl);

            // Play the decoded audio
            this.PlayAudio(audioBuffer, message.callBack);

        } catch (error) {
            // Log the error and update the status text
            console.error('Error:', error);
            this.AddToStatus('Error: ' + error.message);
        }
    }

    async GetAudio(blobUrl) {
        const response = await fetch(blobUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch audio from blob URL. Status: ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        return this.audioContext.decodeAudioData(arrayBuffer);
    }


    PlayAudio(audioBuffer, callBack) {
        // Create an AudioBufferSourceNode from the AudioBuffer
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        // Connect the AudioBufferSourceNode to the AudioContext's destination (the speakers)
        source.connect(this.audioContext.destination);
        // Start playing the audio immediately
        source.start(0);

        // Keep a reference to the AudioBufferSourceNode that's currently playing
        this.currentSource = source;

        // Handle the end of the audio
        this.handleAudioEnd(source, callBack);
    }



    // The fetchSpeech function fetches the speech audio from the API
    async fetchSpeech(text, voice) {
        const response = await fetch(this.apiDomain + '/Speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, voiceId: voice })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        console.log(`Generated blob URL: ${url}`);
        return url;

    }

    /*
     * The handleAudioEnd function handles the end of the audio.
     * It sets up a callback to be called when the audio finishes playing.
     *
     * @param {AudioBufferSourceNode} source - The AudioBufferSourceNode that is playing the audio.
     * @param {function} callBack - A function to be called when the audio finishes playing.
     */
    handleAudioEnd(source, callBack) {
        // Set up a callback to be called when the audio finishes playing
        source.onended = () => {
            // Update the status text
            this.AddToStatus('Audio has finished playing!');

            // If a callback function was provided, call it
            if (callBack != null)
                callBack();

            // Set the isSpeaking flag to false, since the audio has finished playing
            this.isSpeaking = false;

            // If there are more speech tasks in the queue, start the next one
            if (this.queue.length > 0) {
                this.PlayNextInQueue();
            }
        };
    }

    // The StopSpeaking function stops the currently playing audio, clears the queue of speech tasks, and pauses any further speech synthesis
    StopSpeaking() {
        if (this.currentSource) {
            this.currentSource.stop();  // Stop the currently playing audio
            this.currentSource = null;  // Clear the currently playing audio
        }
        this.queue = [];  // Clear the queue of speech tasks
        this.isSpeaking = false;  // Set the isSpeaking flag to false
        this.voicing = false;  // Set the voicing flag to false
    }

    // The ResumeSpeaking function resumes speech synthesis
    ResumeSpeaking() {
        this.voicing = true;  // Set the voicing flag to true
        if(this.queue.length > 0) {
            this.PlayNextInQueue();  // Start the next speech task if there are any in the queue
        }
    }

}

// Create a new SpeechManager object
let speechManager = new SpeechManager('https://brennan.games:3000', document.getElementById('SpeechManagerStatus'));

// Use this function to unlock the audio context after a user interaction (e.g., button press)
async function buttonPressHandler() {
    await speechManager.unlockAudioContext();
    await speechManager.resumeAudioContext();
}
