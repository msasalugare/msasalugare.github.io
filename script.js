// NY Clock
function updateNYTime() {
    const timeElement = document.getElementById('ny-time');
    const options = {
        timeZone: 'America/New_York',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    
    const nyTime = new Date().toLocaleTimeString('en-US', options);
    timeElement.textContent = nyTime;
}

// Update the clock every second
updateNYTime();
setInterval(updateNYTime, 1000);

// ISS Tracking
let map;
let issMarker;
let issIcon;

// Serbia boundaries (approximate)
const SERBIA_BOUNDS = {
    north: 46.190,
    south: 41.856,
    east: 23.006,
    west: 18.817
};

// Telegram configuration
const TELEGRAM_BOT_TOKEN = '7836069749:AAEuFKlrLCtfVh30vNUqwfJgWox1cA2jDec';
const TELEGRAM_CHAT_IDS = ['8119329733'];
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 1800000; // 30 minutes

function isOverSerbia(lat, lng) {
    return lat <= SERBIA_BOUNDS.north && 
           lat >= SERBIA_BOUNDS.south && 
           lng >= SERBIA_BOUNDS.west && 
           lng <= SERBIA_BOUNDS.east;
}

function sendTelegramNotification(lat, lng) {
    const currentTime = Date.now();
    if (currentTime - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        console.log('Notification cooldown not expired, skipping notification');
        return;
    }

    const options = {
        timeZone: 'Europe/Belgrade',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    const srbVreme = new Date().toLocaleString('sr-RS', options);
    
    const message = `🛸 ISS je iznad Srbije!\n` +
                   `⏰ Vreme ulaska: ${srbVreme}\n` +
                   `📍 Pozicija:\n` +
                   `   Geografska širina: ${lat.toFixed(3)}\n` +
                   `   Geografska dužina: ${lng.toFixed(3)}\n` +
                   `🌍 Proveri uživo na: https://msasalugare.github.io`;

    console.log('Sending Telegram notification...');
    TELEGRAM_CHAT_IDS.forEach(chatId => {
        fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: chatId,
                text: message
            })
        })
        .then(response => response.json())
        .then(data => {
            if (data.ok) {
                lastNotificationTime = currentTime;
                console.log('Telegram notification sent successfully');
            } else {
                console.log('Error sending Telegram notification:', data);
            }
        })
        .catch(error => console.error('Error sending Telegram notification:', error));
    });
}

function initMap() {
    console.log('Initializing map...');
    
    // Create map centered at [0, 0]
    map = L.map('map').setView([0, 0], 2);
    
    // Add OpenStreetMap tiles with HTTPS
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        subdomains: ['a', 'b', 'c']
    }).addTo(map);

    // Create custom ISS icon with HTTPS
    issIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/International_Space_Station.svg/32px-International_Space_Station.svg.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    // Create ISS marker
    issMarker = L.marker([0, 0], {icon: issIcon}).addTo(map);
    
    console.log('Map initialized successfully');
}

function trackISS() {
    console.log('Fetching ISS position...');
    
    // Using CORS Anywhere as a proxy
    fetch('https://cors-anywhere.herokuapp.com/https://api.wheretheiss.at/v1/satellites/25544')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received ISS data:', data);
            
            const position = {
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude)
            };

            console.log('Parsed position:', position);

            // Update marker position
            issMarker.setLatLng([position.lat, position.lng]);
            
            // Update info display
            document.getElementById('iss-lat').textContent = position.lat.toFixed(4);
            document.getElementById('iss-lng').textContent = position.lng.toFixed(4);

            // Check if ISS is over Serbia
            if (isOverSerbia(position.lat, position.lng)) {
                console.log('ISS is over Serbia!');
                sendTelegramNotification(position.lat, position.lng);
            }

            console.log('ISS position updated successfully');
        })
        .catch(error => {
            console.error('Error fetching ISS position:', error);
            setTimeout(trackISS, 5000);
        });
}

// Initialize when page loads
window.onload = function() {
    console.log('Page loaded, starting initialization...');
    initMap();
    trackISS(); // First immediate call
    setInterval(trackISS, 5000);
};
