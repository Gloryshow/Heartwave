import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// LOGIN
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    const errorBox = document.getElementById("errorMsg");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      window.location.href = "dashboard.html";
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      console.error("Login error:", err);
    }
  });
}

// SIGNUP
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const gender = document.getElementById("signupGender").value;
    const fullName = document.getElementById("signupFullName").value.trim();
    const age = document.getElementById("signupAge").value;
    const location = document.getElementById("signupLocation").value.trim();
    const bio = document.getElementById("signupBio").value.trim();
    const interests = document.getElementById("signupInterests").value.trim();
    const errorBox = document.getElementById("errorMsg");

    // Validation
    if (!gender) {
      errorBox.textContent = "Please select a gender";
      errorBox.classList.add("show");
      return;
    }

    if (!fullName) {
      errorBox.textContent = "Please enter your full name";
      errorBox.classList.add("show");
      return;
    }

    if (!age || age < 18 || age > 100) {
      errorBox.textContent = "Please enter a valid age (18-100)";
      errorBox.classList.add("show");
      return;
    }

    if (!location) {
      errorBox.textContent = "Please enter your location";
      errorBox.classList.add("show");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save complete user profile to Firestore
      const db = getFirestore();
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        gender: gender,
        fullName: fullName,
        age: parseInt(age),
        location: location,
        bio: bio,
        interests: interests,
        profilePicture: null,
        likes: [],
        createdAt: new Date(),
        profileHidden: false,
        showOnlineStatus: true,
        notificationsEnabled: true
      });

      console.log("User created successfully:", user.uid);
      alert("Account created! Welcome to HeartWave! 💖");
      window.location.href = "dashboard.html";
    } catch (err) {
      errorBox.textContent = err.message;
      errorBox.classList.add("show");
      console.error("Signup error:", err);
    }
  });
}
