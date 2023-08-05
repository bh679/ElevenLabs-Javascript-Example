const apiDomain = 'https://brennan.games:3000';

async function speak() {
    const text = document.getElementById('text-input').value;
    const status = document.getElementById('status');
    status.innerText = "Speak: " + text + '\n';

    try {
        status.innerText += 'Processing...\n';

        const response = await fetch(apiDomain+'/Speak', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: text })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        status.innerText += 'Speech successfully generated!\n';

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.play();

        audio.onended = () => {
            status.innerText += 'Audio has finished playing!\n';
        };

    } catch (error) {
        console.error('Error:', error);
        status.innerText += 'Error: ' + error.message + '\n';
    }
}
