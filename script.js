// JavaScript for interactivity can be added here

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
    north: 46.190,  // Najsevernija tačka Srbije
    south: 41.856,  // Najjužnija tačka
    east: 23.006,   // Najistočnija tačka
    west: 18.817    // Najzapadnija tačka
};

// Telegram configuration
const TELEGRAM_BOT_TOKEN = '7836069749:AAEuFKlrLCtfVh30vNUqwfJgWox1cA2jDec';
const TELEGRAM_CHAT_ID = '8119329733';
let lastNotificationTime = 0;
const NOTIFICATION_COOLDOWN = 1800000; // 30 minuta u milisekundama

function isOverSerbia(lat, lng) {
    return lat <= SERBIA_BOUNDS.north && 
           lat >= SERBIA_BOUNDS.south && 
           lng >= SERBIA_BOUNDS.west && 
           lng <= SERBIA_BOUNDS.east;
}

function sendTelegramNotification(lat, lng) {
    const currentTime = Date.now();
    if (currentTime - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        return; // Preskači ako je prošlo manje od 30 minuta od poslednje notifikacije
    }

    // Formatiranje srpskog vremena
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
    
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            chat_id: TELEGRAM_CHAT_ID,
            text: message
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.ok) {
            lastNotificationTime = currentTime;
            console.log('Telegram notifikacija poslata!');
        }
    })
    .catch(error => console.error('Greška pri slanju Telegram notifikacije:', error));
}

function initMap() {
    // Create map centered at [0, 0]
    map = L.map('map').setView([0, 0], 2);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Create custom ISS icon
    issIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/International_Space_Station.svg/32px-International_Space_Station.svg.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });

    // Create ISS marker
    issMarker = L.marker([0, 0], {icon: issIcon}).addTo(map);

    // Start tracking
    trackISS();
}

function trackISS() {
    fetch('http://api.open-notify.org/iss-now.json')
        .then(response => response.json())
        .then(data => {
            const position = {
                lat: parseFloat(data.iss_position.latitude),
                lng: parseFloat(data.iss_position.longitude)
            };

            // Update marker position
            issMarker.setLatLng([position.lat, position.lng]);
            map.setView([position.lat, position.lng]);

            // Update info display
            document.getElementById('iss-lat').textContent = position.lat.toFixed(4);
            document.getElementById('iss-lng').textContent = position.lng.toFixed(4);

            // Check if ISS is over Serbia and send notification
            if (isOverSerbia(position.lat, position.lng)) {
                sendTelegramNotification(position.lat, position.lng);
            }
        })
        .catch(error => console.error('Error fetching ISS position:', error));
}

// Initialize map when page loads
window.onload = function() {
    initMap();
    // Update ISS position every 5 seconds
    setInterval(trackISS, 5000);
};
