## 🚀 HeartWave - Quick Start Guide

### What Changed?
Your HeartWave dating app now has a completely modern, Tinder-style UI with:
- Dark theme with pink gradient accents
- Phone frame mockup design
- Modern animations and effects
- Improved user experience

### Testing the App

#### 1. **Login Page** (index.html)
- Start at the login page
- Can use existing credentials or create new account
- Modern dark design with centered card

#### 2. **Sign Up** (signup.html)
- Create new account with email & password
- Select your gender (Male/Female)
- Password strength indicator shown
- Auto-redirects to login after signup

#### 3. **Dashboard** (dashboard.html)
- Shows your profile with avatar
- Displays stats: Likes, Matches, Messages
- Click profile picture to upload new photo
- Three action cards to navigate to features
- Bottom navigation for quick access

#### 4. **Find Matches** (matches.html)
- Browse profiles of opposite gender
- See name, age, location, bio, interests
- Three actions: Pass (X), Message (💬), Like (❤️)
- Swipe through profiles until you find matches
- Bottom nav to return home or messages

#### 5. **Messages** (messages.html)
- View all conversations
- Click to open chat
- Send text messages
- Attach and send images, audio, videos
- Real-time message updates
- Back button to return to conversations list

#### 6. **Edit Profile** (edit-profile.html)
- Update your name, age, bio, location
- Add interests (comma-separated)
- Profile picture upload
- Changes sync to Firebase

### Key Features

✅ **Authentication**
- Email/password signup and login
- Gender-based filtering
- Secure Firebase authentication

✅ **Matching System**
- Discover opposite-gender profiles
- Like/Pass on profiles
- Mutual likes = Match!
- Real-time match notifications

✅ **Messaging**
- Real-time conversations
- Text, image, audio, video support
- Timestamp on messages
- Online status indicators

✅ **Profile Management**
- Edit profile information
- Upload profile picture
- View profile statistics
- See likes and matches count

### Keyboard Shortcuts

- **In Chat**: Enter to send, Shift+Enter for new line
- **Anywhere**: Use bottom navigation for quick access

### Firebase Setup (Already Configured)

The app uses Firebase with:
- **Project ID**: heartwave-86494
- **Collections**: users, conversations, messages, matches
- **Storage**: Profile pictures and message media
- **Rules**: Already configured for security

### Common Tasks

#### Upload Profile Picture
1. Go to Dashboard
2. Click the circular profile picture
3. Select image file
4. Auto-uploads and saves

#### Send a Message
1. Go to Matches
2. Like or Message a profile
3. Go to Messages
4. Select conversation
5. Type and press Enter
6. Use paperclip to attach files

#### Find Matches
1. Go to Dashboard → Find Matches
2. View profile cards
3. Click Like (❤️) to express interest
4. Match alert when mutual like occurs

#### Update Profile
1. Click pencil icon in header or use action card
2. Fill in your details
3. Submit form
4. Changes save to Firebase

### Troubleshooting

**Profile picture not showing?**
- Ensure file is under 5MB
- Wait a few seconds for upload
- Refresh page to see update

**Messages not loading?**
- Check Firebase internet connection
- Ensure both users are authenticated
- Wait for real-time sync (usually instant)

**Can't find matches?**
- Check your gender selection
- Ensure opposite gender profiles exist
- Clear browser cache and try again

**Can't send message?**
- Ensure you've matched first (or message directly)
- Check file size if uploading media (max 50MB)
- Verify internet connection

### Mobile Experience

The app is fully responsive! On mobile:
- Phone frame removes extra borders
- Touch-friendly buttons and navigation
- Full-screen utilization
- Swipe-friendly interface

### Color Scheme

- **Dark Background**: #0a0a0a
- **Accent Color**: #ff4d6d to #ff758f (Pink gradient)
- **Text**: White and grays
- **Borders**: Subtle pink outlines

Enjoy your modern HeartWave experience! 💖
