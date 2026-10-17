// Firebase Configuration & Initialization
const firebaseConfig = {
  apiKey: "AIzaSyAwC8AQha8QXlEfn6Kk1vAsznRBnbMd2EI",
  authDomain: "modelmun.firebaseapp.com",
  projectId: "modelmun",
  storageBucket: "modelmun.firebasestorage.app",
  messagingSenderId: "360732989449",
  appId: "1:360732989449:web:cc161392232d3cabd140d8",
  measurementId: "G-H7Q00M640X"
};

if (typeof firebase !== 'undefined' && !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

window.firebaseAuth = (typeof firebase !== 'undefined' && firebase.auth) ? firebase.auth() : null;
window.firebaseDb = (typeof firebase !== 'undefined' && firebase.firestore) ? firebase.firestore() : null;
