// Test Telegram notification
const TELEGRAM_BOT_TOKEN = '7836069749:AAEuFKlrLCtfVh30vNUqwfJgWox1cA2jDec';
const TELEGRAM_CHAT_ID = '8119329733';

async function sendTestMessage() {
    const message = '🛸 Test poruka: ISS Tracker je uspešno povezan sa Telegram-om!';
    
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message
            })
        });
        
        const data = await response.json();
        console.log('Response:', data);
    } catch (error) {
        console.error('Error:', error);
    }
}

sendTestMessage();
