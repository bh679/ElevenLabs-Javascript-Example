const apiDomain = 'https://brennan.games:3000';

async function Speak(text, voice, status) {
    if(status != null) status.innerText = "Speak: " + text + '\n';

    try {
        if(status != null) status.innerText += 'Processing...\n';

        const response = await fetch(apiDomain+'/Speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text, voiceId: voice })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        if(status != null) status.innerText += 'Speech successfully generated!\n';

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();

        audio.onended = () => {
            if(status != null) status.innerText += 'Audio has finished playing!\n';
        };

    } catch (error) {
        console.error('Error:', error);
        if(status != null) status.innerText += 'Error: ' + error.message + '\n';
    }
}
