// Firebase v9 (MODULAR)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC21Bg3pgOsoV7uHExVVuEwOaQA5zC1X80",
  authDomain: "heartwave-86494.firebaseapp.com",
  projectId: "heartwave-86494",
  storageBucket: "heartwave-86494.firebasestorage.app",
  messagingSenderId: "614851991644",
  appId: "1:614851991644:web:bdefba8600e13ed0c62e99",
  measurementId: "G-ESQ0RLFFFD"
};

// Init Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
