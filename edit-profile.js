import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyC21Bg3pgOsoV7uHExVVuEwOaQA5zC1X80",
  authDomain: "heartwave-86494.firebaseapp.com",
  projectId: "heartwave-86494",
  storageBucket: "heartwave-86494.firebasestorage.app",
  messagingSenderId: "614851991644",
  appId: "1:614851991644:web:bdefba8600e13ed0c62e99",
  measurementId: "G-ESQ0RLFFFD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const profileForm = document.getElementById("profileForm");
const errorBox = document.getElementById("error");
const successBox = document.getElementById("success");
const bioCount = document.getElementById("bioCount");

// Character counter for bio - only if element exists
const bioElement = document.getElementById("bio");
if (bioElement && bioCount) {
  bioElement.addEventListener("input", (e) => {
    bioCount.innerText = `${e.target.value.length}/500`;
  });
}

// 🔐 Check if user is authenticated
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    // Load existing profile data
    try {
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        document.getElementById("fullName").value = data.fullName || "";
        document.getElementById("age").value = data.age || "";
        document.getElementById("bio").value = data.bio || "";
        document.getElementById("location").value = data.location || "";
        document.getElementById("interests").value = data.interests || "";
        if (data.profilePicture) {
          profilePreview.src = data.profilePicture;
        }
        bioCount.innerText = `${(data.bio || "").length}/500`;
      }
    } catch (err) {
      console.error("Error loading profile:", err);
    }
  }
});

// 💾 Save profile
profileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  errorBox.innerText = "";
  successBox.innerText = "";

  const user = auth.currentUser;
  if (!user) {
    errorBox.innerText = "User not authenticated";
    return;
  }

  const fullName = document.getElementById("fullName").value;
  const age = document.getElementById("age").value;
  const bio = document.getElementById("bio").value;
  const location = document.getElementById("location").value;
  const interests = document.getElementById("interests").value;

  try {
    const updateData = {
      email: user.email,
      fullName,
      age: age ? parseInt(age) : null,
      bio,
      location,
      interests,
      updatedAt: new Date()
    };

    await setDoc(doc(db, "users", user.uid), updateData, { merge: true });

    successBox.innerText = "✅ Profile saved successfully!";
    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1500);
  } catch (err) {
    console.error("Full error:", err);
    errorBox.innerText = "Error saving profile: " + err.message;
  }
});
