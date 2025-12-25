import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc,
  arrayUnion,
  addDoc
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

const profileContainer = document.getElementById("profilesContainer");
const loadingMessage = document.getElementById("loadingState");
const noProfiles = document.getElementById("emptyState");

let currentProfiles = [];
let currentIndex = 0;
let currentUser = null;

// Load and display profiles
async function loadProfiles() {
  try {
    const user = auth.currentUser;
    if (!user) return;

    currentUser = user;

    // Get current user's gender
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      loadingMessage.style.display = "none";
      noProfiles.style.display = "flex";
      console.error("User document does not exist");
      return;
    }

    const userData = userDoc.data();
    const userGender = userData.gender;

    console.log("Current user gender:", userGender);

    // Determine opposite gender
    const oppositeGender = userGender === "male" ? "female" : "male";

    // Query profiles with opposite gender and not hidden
    const q = query(
      collection(db, "users"),
      where("gender", "==", oppositeGender)
    );

    const querySnapshot = await getDocs(q);
    currentProfiles = [];

    querySnapshot.forEach((doc) => {
      if (doc.id !== user.uid) {
        const profileData = doc.data();
        // Exclude hidden profiles (profileHidden = true)
        if (profileData.profileHidden !== true) {
          console.log("Profile found:", doc.id, profileData);
          currentProfiles.push({
            id: doc.id,
            ...profileData
          });
        }
      }
    });

    console.log("Total profiles found:", currentProfiles.length);

    loadingMessage.style.display = "none";

    if (currentProfiles.length === 0) {
      noProfiles.style.display = "flex";
      console.warn("No profiles found for opposite gender");
    } else {
      currentIndex = 0;
      displayProfile();
    }
  } catch (err) {
    console.error("Error loading profiles:", err);
    loadingMessage.innerHTML = "<p>Error loading profiles</p>";
  }
}

// Display current profile
function displayProfile() {
  profileContainer.innerHTML = "";

  if (currentIndex >= currentProfiles.length) {
    loadingMessage.style.display = "none";
    profileContainer.style.display = "none";
    noProfiles.style.display = "flex";
    return;
  }

  noProfiles.style.display = "none";
  profileContainer.style.display = "block";

  const profile = currentProfiles[currentIndex];
  console.log("Displaying profile:", profile);
  console.log("fullName:", profile.fullName);
  console.log("name:", profile.name);
  console.log("All keys:", Object.keys(profile));

  const fullName = profile.fullName || profile.name || "User";
  const age = profile.age ? `, ${profile.age}` : "";
  const location = profile.location || "Unknown";
  const bio = profile.bio || "";
  const interests = profile.interests ? profile.interests.split(",").map(i => i.trim()) : [];

  const card = document.createElement("div");
  card.className = "profile-card";
  
  const interestTags = interests.map(tag => `<span class="tag">${tag}</span>`).join("");

  card.innerHTML = `
    <img src="${profile.profilePicture || 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22400%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%23333%22/%3E%3Ctext x=%2250%22 y=%2250%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2240%22 fill=%22%23666%22%3E👤%3C/text%3E%3C/svg%3E'}" alt="Profile" class="profile-image" />
    <div class="profile-info">
      <div>
        <div class="profile-header">
          <div>
            <h2 class="profile-name">${fullName}${age}</h2>
            <p class="profile-location"><i class="bi bi-geo-alt"></i> ${location}</p>
          </div>
        </div>
        ${bio ? `<p class="profile-bio">"${bio}"</p>` : ""}
        ${interests.length > 0 ? `<div class="profile-tags">${interestTags}</div>` : ""}
      </div>
    </div>
  `;

  profileContainer.appendChild(card);
}

// Like profile
window.likeProfile = async function() {
  if (currentIndex >= currentProfiles.length) return;

  const profileId = currentProfiles[currentIndex].id;

  try {
    // Add to current user's likes
    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        likes: arrayUnion(profileId)
      },
      { merge: true }
    );

    // Check for mutual like (match)
    const likedUserRef = doc(db, "users", profileId);
    const likedUserDoc = await getDoc(likedUserRef);

    if (likedUserDoc.exists()) {
      const likedUserData = likedUserDoc.data();
      if (likedUserData.likes && likedUserData.likes.includes(currentUser.uid)) {
        // It's a match!
        alert("🎉 It's a match! You can now message each other.");

        // Create match record
        const matchId = [currentUser.uid, profileId].sort().join("-");
        await setDoc(doc(db, "matches", matchId), {
          users: [currentUser.uid, profileId],
          createdAt: new Date()
        });

        // Create conversation
        const conversationId = [currentUser.uid, profileId].sort().join("-");
        await setDoc(doc(db, "conversations", conversationId), {
          users: [currentUser.uid, profileId],
          createdAt: new Date(),
          lastMessage: ""
        });
      }
    }

    currentIndex++;
    displayProfile();
  } catch (err) {
    console.error("Error liking profile:", err);
    alert("Error: " + err.message);
  }
};

// Pass profile
window.passProfile = function() {
  currentIndex++;
  displayProfile();
};

// Message profile
window.messageProfile = async function() {
  if (currentIndex >= currentProfiles.length) return;

  const userId = currentProfiles[currentIndex].id;
  const userName = currentProfiles[currentIndex].fullName || "User";

  try {
    // Create conversation if it doesn't exist
    const conversationId = [currentUser.uid, userId].sort().join("-");
    
    await setDoc(doc(db, "conversations", conversationId), {
      users: [currentUser.uid, userId],
      createdAt: new Date(),
      lastMessage: ""
    }, { merge: true });

    // Store the conversation ID and redirect
    localStorage.setItem("selectedConversation", conversationId);
    window.location.href = "messages.html";
  } catch (err) {
    console.error("Error starting conversation:", err);
    alert("Error: " + err.message);
  }
};

// 🔐 Protect page and load profiles
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    loadProfiles();
  }
});
