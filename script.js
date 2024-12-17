// Globalne varijable za mapu i marker
let map;
let issMarker;
let issIcon;
let lastNotificationTime = 0; // Za praćenje vremena poslednje notifikacije

// Telegram bot konfiguracija
const TELEGRAM_BOT_TOKEN = '6674290773:AAGz4hIRhQVzGJVxgJhOHGPTZBPHxwWNxAY';
const TELEGRAM_CHAT_ID = '1007755197';
const NOTIFICATION_COOLDOWN = 5 * 60 * 1000; // 5 minuta u milisekundama

// Funkcija za proveru da li je ISS iznad Srbije
function isOverSerbia(lat, lng) {
    return lat >= 42.2 && lat <= 46.2 && lng >= 19.0 && lng <= 23.0;
}

// Funkcija za slanje Telegram notifikacije
function sendTelegramNotification(lat, lng) {
    const currentTime = Date.now();
    if (currentTime - lastNotificationTime < NOTIFICATION_COOLDOWN) {
        console.log('Notification cooldown active, skipping...');
        return;
    }

    const message = `🛸 ISS je trenutno iznad Srbije!\nŠirina: ${lat.toFixed(4)}°\nDužina: ${lng.toFixed(4)}°\nVreme: ${new Date().toLocaleString('sr-RS')}`;
    
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
            console.log('Telegram notification sent successfully');
            lastNotificationTime = currentTime;
        } else {
            console.error('Failed to send Telegram notification:', data);
        }
    })
    .catch(error => {
        console.error('Error sending Telegram notification:', error);
    });
}

// Inicijalizacija mape
function initMap() {
    console.log('Initializing map...');
    
    // Kreiranje mape centrirane na Srbiju
    map = L.map('map').setView([44.0165, 21.0059], 4);
    
    // Dodavanje OpenStreetMap layer-a
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Kreiranje custom ikone za ISS
    issIcon = L.icon({
        iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/International_Space_Station.svg',
        iconSize: [50, 30],
        iconAnchor: [25, 15]
    });
    
    // Kreiranje markera za ISS
    issMarker = L.marker([0, 0], { icon: issIcon }).addTo(map);
    
    console.log('Map initialized successfully');
}

// Funkcija za praćenje ISS-a
function trackISS() {
    console.log('Fetching ISS position...');
    
    fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(response => {
            console.log('Response status:', response.status);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Received ISS data:', data);
            
            // Provera validnosti podataka
            if (!data.latitude || !data.longitude || !data.velocity || !data.altitude) {
                throw new Error('Invalid data format');
            }

            const position = {
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude)
            };

            // Validacija koordinata
            if (isNaN(position.lat) || isNaN(position.lng)) {
                throw new Error('Invalid coordinates');
            }

            console.log('Parsed position:', position);

            // Update pozicije markera
            issMarker.setLatLng([position.lat, position.lng]);
            
            // Update informacija o ISS-u
            document.getElementById('iss-lat').textContent = position.lat.toFixed(4);
            document.getElementById('iss-lng').textContent = position.lng.toFixed(4);
            document.getElementById('iss-velocity').textContent = (data.velocity * 3.6).toFixed(2); // Konverzija u km/h
            document.getElementById('iss-altitude').textContent = data.altitude.toFixed(2);

            // Provera da li je ISS iznad Srbije
            if (isOverSerbia(position.lat, position.lng)) {
                sendTelegramNotification(position.lat, position.lng);
            }

            console.log('ISS position updated successfully');
            
            // Update ponovo za 5 sekundi
            setTimeout(trackISS, 5000);
        })
        .catch(error => {
            console.error('Error fetching ISS position:', error);
            // Pokušaj ponovo za 5 sekundi ako dođe do greške
            setTimeout(trackISS, 5000);
        });
}

// Smooth scroll za navigaciju
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Inicijalizacija kada se stranica učita
window.onload = function() {
    console.log('Page loaded, starting initialization...');
    initMap();
    trackISS();
};
