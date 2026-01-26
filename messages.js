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
let conversationListeners = [];
let notificationsEnabled = false;
let notificationShown = new Set(); // Track shown notifications

// Request notification permission on page load
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationsEnabled = true;
    console.log("Notifications already enabled");
    return true;
  } else if (Notification.permission === 'denied') {
    console.log("Notifications denied by user");
    return false;
  } else {
    try {
      const permission = await Notification.requestPermission();
      notificationsEnabled = permission === 'granted';
      console.log("Notification permission:", permission);
      return notificationsEnabled;
    } catch (err) {
      console.error("Error requesting notification permission:", err);
      return false;
    }
  }
}

// Show notification for new message
async function showMessageNotification(senderName, messagePreview, messageId) {
  if (!notificationsEnabled || !('Notification' in window)) {
    console.log("Notifications not enabled or not supported");
    return;
  }

  // Don't show duplicate notifications
  if (notificationShown.has(messageId)) {
    return;
  }

  try {
    const notification = new Notification("💖 HeartWave", {
      body: `${senderName}: ${messagePreview}`,
      icon: "/logo.svg",
      badge: "/logo.svg",
      tag: `heartwave-msg-${messageId}`,
      requireInteraction: false,
      silent: false
    });

    notificationShown.add(messageId);

    notification.onclick = function() {
      window.focus();
      notification.close();
    };

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    console.log("Notification shown:", senderName);
  } catch (err) {
    console.error("Error showing notification:", err);
  }
}

// Monitor all conversations for new messages
async function monitorConversationsForNotifications() {
  if (!currentUser) return;

  try {
    const q = query(
      collection(db, "conversations"),
      where("users", "array-contains", currentUser.uid)
    );

    const querySnapshot = await getDocs(q);

    for (const convDoc of querySnapshot.docs) {
      const conversationId = convDoc.id;
      const conv = convDoc.data();
      const otherUserId = conv.users.find(id => id !== currentUser.uid);

      // Listen to messages in this conversation
      const messagesQuery = query(
        collection(db, "conversations", conversationId, "messages"),
        orderBy("timestamp", "desc")
      );

      const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "added") {
            const msg = change.doc.data();
            const msgId = change.doc.id;

            // Only notify if:
            // 1. Message is not from current user
            // 2. Conversation is not currently open
            // 3. Message hasn't been shown before
            if (msg.sender !== currentUser.uid && 
                conversationId !== currentConversationId &&
                !notificationShown.has(msgId)) {
              
              // Get sender info
              const senderDoc = await getDoc(doc(db, "users", msg.sender));
              const senderName = senderDoc.data()?.fullName || "Someone";
              
              const messagePreview = msg.text || 
                                    (msg.type === "image" ? "📷 Image" : 
                                     msg.type === "audio" ? "🎵 Audio" : 
                                     msg.type === "video" ? "🎬 Video" : "New message");

              showMessageNotification(senderName, messagePreview, msgId);
            }
          }
        });
      });

      conversationListeners.push(unsubscribe);
    }
  } catch (err) {
    console.error("Error monitoring conversations:", err);
  }
}

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
    let lastMessageSender = null;
    let lastMessageText = "";

    querySnapshot.forEach((doc, index) => {
      const msg = doc.data();
      const isOwn = msg.sender === currentUser.uid;

      // Track last message info for notification
      if (index === querySnapshot.size - 1 && !isOwn) {
        lastMessageSender = msg.sender;
        lastMessageText = msg.text || (msg.type === "image" ? "📷 Image" : msg.type === "audio" ? "🎵 Audio" : msg.type === "video" ? "🎬 Video" : "Message");
      }

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

      // Mark message as read if it's not from current user
      if (!isOwn && (!msg.readBy || !msg.readBy.includes(currentUser.uid))) {
        markMessageAsRead(currentConversationId, doc.id);
      }
    });

    // Show notification for new incoming message
    if (lastMessageSender && lastMessageSender !== currentUser.uid) {
      (async () => {
        const senderDoc = await getDoc(doc(db, "users", lastMessageSender));
        const senderName = senderDoc.data()?.fullName || "Someone";
        showMessageNotification(senderName, lastMessageText.substring(0, 50), currentUser.uid);
      })();
    }

    // Scroll to bottom
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  });
};

// Mark message as read
async function markMessageAsRead(conversationId, messageId) {
  try {
    const msgRef = doc(db, "conversations", conversationId, "messages", messageId);
    const msgDoc = await getDoc(msgRef);
    if (msgDoc.exists()) {
      const msg = msgDoc.data();
      const readBy = msg.readBy || [];
      if (!readBy.includes(currentUser.uid)) {
        readBy.push(currentUser.uid);
        await setDoc(msgRef, { readBy }, { merge: true });
      }
    }
  } catch (err) {
    console.error("Error marking message as read:", err);
  }

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
      timestamp: new Date(),
      readBy: [currentUser.uid]  // Message read by sender immediately
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
      timestamp: new Date(),
      readBy: [currentUser.uid]  // Message read by sender immediately
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
    
    // Request notification permission on page load
    const permissionGranted = await requestNotificationPermission();
    
    if (permissionGranted) {
      console.log("Starting notification monitoring...");
      // Start monitoring conversations for new messages
      await monitorConversationsForNotifications();
    }
    
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
