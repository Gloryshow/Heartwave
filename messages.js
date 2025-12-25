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
  addDoc,
  onSnapshot,
  orderBy
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

const conversationsList = document.getElementById("conversationsList");
const noConversations = document.getElementById("noConversations");
const selectConversation = document.getElementById("selectConversation");
const chatArea = document.getElementById("chatArea");
const chatHeader = document.getElementById("chatHeader");
const messagesContainer = document.getElementById("messages");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const fileInput = document.getElementById("fileInput");
const attachBtn = document.getElementById("attachBtn");

let currentUser = null;
let currentConversationId = null;
let messageUnsubscribe = null;

// Load conversations
async function loadConversations() {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, "conversations"),
      where("users", "array-contains", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);
    conversationsList.innerHTML = "";

    if (querySnapshot.empty) {
      noConversations.style.display = "block";
      return;
    }

    noConversations.style.display = "none";

    for (const docSnapshot of querySnapshot.docs) {
      const conv = docSnapshot.data();
      const otherUserId = conv.users.find(id => id !== currentUser.uid);

      // Get other user's profile
      const otherUserRef = doc(db, "users", otherUserId);
      const otherUserDoc = await getDoc(otherUserRef);
      const otherUserData = otherUserDoc.data();

      const convItem = document.createElement("div");
      convItem.className = "conversation-item";
      convItem.dataset.conversationId = docSnapshot.id;
      convItem.onclick = () => window.selectConversation(docSnapshot.id, otherUserData.fullName || "User");

      const lastMessage = conv.lastMessage || "Say hello!";

      convItem.innerHTML = `
        <p class="conversation-name">${otherUserData.fullName || "User"}</p>
        <p class="conversation-preview">${lastMessage}</p>
      `;

      conversationsList.appendChild(convItem);
    }
  } catch (err) {
    console.error("Error loading conversations:", err);
  }
}

// Select conversation
window.selectConversation = function(conversationId, userName) {
  currentConversationId = conversationId;
  
  // Update UI
  document.querySelectorAll(".conversation-item").forEach(item => {
    item.classList.remove("active");
  });
  
  // Find and mark the current conversation as active
  const convItems = document.querySelectorAll(".conversation-item");
  convItems.forEach(item => {
    if (item.dataset.conversationId === conversationId) {
      item.classList.add("active");
    }
  });

  selectConversation.style.display = "none";
  chatArea.style.display = "flex";
  chatHeader.innerHTML = userName;
  messagesContainer.innerHTML = "";

  // Unsubscribe from previous listener
  if (messageUnsubscribe) messageUnsubscribe();

  // Load messages in real-time
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("timestamp", "asc")
  );

  messageUnsubscribe = onSnapshot(q, (querySnapshot) => {
    messagesContainer.innerHTML = "";
    querySnapshot.forEach((doc) => {
      const msg = doc.data();
      const isOwn = msg.sender === currentUser.uid;

      const msgEl = document.createElement("div");
      msgEl.className = `message ${isOwn ? "own" : "other"}`;
      
      // Format timestamp properly
      let timeString = "...";
      if (msg.timestamp) {
        try {
          const timestamp = msg.timestamp.toDate ? msg.timestamp.toDate() : new Date(msg.timestamp);
          timeString = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (err) {
          timeString = "now";
        }
      }

      // Render different message types
      let contentHTML = "";
      if (msg.type === "image") {
        contentHTML = `<img src="${msg.mediaUrl}" style="max-width: 200px; border-radius: 12px; margin-bottom: 0.5rem;" />`;
      } else if (msg.type === "audio") {
        contentHTML = `<audio controls style="max-width: 200px; margin-bottom: 0.5rem;"><source src="${msg.mediaUrl}" type="audio/mpeg"></audio>`;
      } else if (msg.type === "video") {
        contentHTML = `<video controls style="max-width: 200px; border-radius: 12px; margin-bottom: 0.5rem;"><source src="${msg.mediaUrl}" type="video/mp4"></video>`;
      } else {
        contentHTML = `<div class="message-bubble">${msg.text}</div>`;
      }
      
      msgEl.innerHTML = `
        <div>
          ${contentHTML}
          <div class="message-time">${timeString}</div>
        </div>
      `;

      messagesContainer.appendChild(msgEl);
    });

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
};

// Send message
sendBtn.addEventListener("click", async () => {
  const text = messageInput.value.trim();
  if (!text || !currentConversationId) return;

  try {
    await addDoc(collection(db, "conversations", currentConversationId, "messages"), {
      text,
      sender: currentUser.uid,
      type: "text",
      timestamp: new Date()
    });

    // Update last message in conversation
    await setDoc(
      doc(db, "conversations", currentConversationId),
      { lastMessage: text },
      { merge: true }
    );

    messageInput.value = "";
  } catch (err) {
    console.error("Error sending message:", err);
    alert("Error sending message: " + err.message);
  }
});

// Attach file
attachBtn.addEventListener("click", () => {
  fileInput.click();
});

// Handle file selection
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file || !currentConversationId) return;

  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    alert("File size must be less than 50MB");
    return;
  }

  try {
    attachBtn.style.opacity = "0.5";
    attachBtn.disabled = true;

    // Determine file type
    let fileType = "text";
    if (file.type.startsWith("image/")) fileType = "image";
    else if (file.type.startsWith("audio/")) fileType = "audio";
    else if (file.type.startsWith("video/")) fileType = "video";

    // Upload to Firebase Storage
    const storageRef = ref(storage, `messages/${currentConversationId}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const mediaUrl = await getDownloadURL(storageRef);

    // Save message
    await addDoc(collection(db, "conversations", currentConversationId, "messages"), {
      type: fileType,
      mediaUrl,
      sender: currentUser.uid,
      timestamp: new Date()
    });

    // Update last message
    const preview = fileType === "text" ? "File" : fileType.charAt(0).toUpperCase() + fileType.slice(1);
    await setDoc(
      doc(db, "conversations", currentConversationId),
      { lastMessage: `📎 ${preview}` },
      { merge: true }
    );

    // Reset file input
    fileInput.value = "";
    attachBtn.style.opacity = "1";
    attachBtn.disabled = false;
  } catch (err) {
    console.error("Error uploading file:", err);
    alert("Error uploading file: " + err.message);
    attachBtn.style.opacity = "1";
    attachBtn.disabled = false;
  }
});

// Send message on Enter
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// 🔐 Protect page
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "index.html";
  } else {
    currentUser = user;
    await loadConversations();

    // Check if a conversation was selected
    const selectedConvId = localStorage.getItem("selectedConversation");
    if (selectedConvId) {
      localStorage.removeItem("selectedConversation");
      
      // Give DOM time to render conversations
      setTimeout(async () => {
        try {
          const convRef = doc(db, "conversations", selectedConvId);
          const convDoc = await getDoc(convRef);
          
          if (convDoc.exists()) {
            const conv = convDoc.data();
            const otherUserId = conv.users.find(id => id !== currentUser.uid);
            
            const otherUserRef = doc(db, "users", otherUserId);
            const otherUserDoc = await getDoc(otherUserRef);
            const otherUserData = otherUserDoc.data();
            
            // Use the global selectConversation function
            window.selectConversation(selectedConvId, otherUserData.fullName || "User");
          }
        } catch (err) {
          console.error("Error auto-opening conversation:", err);
        }
      }, 500);
    }
  }
});
