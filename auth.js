// Firebase configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Login function
function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Uspešna prijava!');
        })
        .catch((error) => {
            console.error('Greška pri prijavi:', error.message);
            alert('Greška pri prijavi: ' + error.message);
        });
}

// Register function
function register() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            console.log('Uspešna registracija!');
        })
        .catch((error) => {
            console.error('Greška pri registraciji:', error.message);
            alert('Greška pri registraciji: ' + error.message);
        });
}

// Logout function
function logout() {
    auth.signOut()
        .then(() => {
            console.log('Uspešna odjava!');
        })
        .catch((error) => {
            console.error('Greška pri odjavi:', error.message);
        });
}

// Auth state observer
auth.onAuthStateChanged((user) => {
    const loginForm = document.getElementById('loginForm');
    const userInfo = document.getElementById('userInfo');
    const userEmail = document.getElementById('userEmail');

    if (user) {
        // User is signed in
        loginForm.style.display = 'none';
        userInfo.style.display = 'block';
        userEmail.textContent = user.email;
    } else {
        // User is signed out
        loginForm.style.display = 'block';
        userInfo.style.display = 'none';
        userEmail.textContent = '';
    }
});
