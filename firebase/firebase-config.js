// firebase/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// Your actual Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB2J7vJquGsw2U4bgxL_7XvVWijT78wEpw",
  authDomain: "infinity-koraa.firebaseapp.com",
  databaseURL: "https://infinity-koraa-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "infinity-koraa",
  storageBucket: "infinity-koraa.firebasestorage.app",
  messagingSenderId: "232347807276",
  appId: "1:232347807276:web:ecdc01b341a2ace0cceb89"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Export Auth and Database
export const auth = getAuth(app);
export const db = getDatabase(app);
