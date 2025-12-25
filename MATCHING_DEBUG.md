## HeartWave Matching Debug Guide

### Problem: Seeing the same "User" profile repeatedly

If you're seeing the same profile across all accounts, here's what to check:

### 1. **Check User Gender Settings**

Go to Firebase Console:
- Project: heartwave-86494
- Firestore Database → Collection: "users"
- Check each user document for the "gender" field
- Make sure you have:
  - At least one user with `gender: "male"`
  - At least one user with `gender: "female"`
  - The genders should be DIFFERENT for matching to work

### 2. **Check Profile Completion**

Each user profile should have:
- ✅ `email` - From signup
- ✅ `gender` - Selected during signup
- ✅ `fullName` - Should be auto-filled with email prefix, OR fill in Edit Profile
- ✅ `location` - Set to "Not specified" by default, OR fill in Edit Profile
- ✅ `age` - Fill in Edit Profile (optional but recommended)
- ✅ `bio` - Fill in Edit Profile (optional)
- ✅ `interests` - Fill in Edit Profile (optional)

### 3. **How Matching Works**

```
Male user → sees Female profiles
Female user → sees Male profiles

Example:
- Account A (male) → Should see all female accounts
- Account B (female) → Should see all male accounts
- Account C (male) → Should see all female accounts
```

### 4. **Step-by-Step Testing**

**Create 2 test accounts:**
1. Sign up Account A:
   - Email: `alex@test.com`
   - Password: `Test1234`
   - Gender: **Male**
   - After signup → Auto-redirects to Edit Profile
   - Fill in: Name, Location, Age
   - Click Save

2. Sign up Account B:
   - Email: `sam@test.com`
   - Password: `Test1234`
   - Gender: **Female**
   - After signup → Auto-redirects to Edit Profile
   - Fill in: Name, Location, Age
   - Click Save

3. Log in with Account A:
   - Go to Matches
   - Should see Account B profile with proper name and location

4. Log in with Account B:
   - Go to Matches
   - Should see Account A profile with proper name and location

### 5. **Debug Console Output**

When on the Matches page, open Developer Tools (F12) → Console tab.

You should see messages like:
```
Current user gender: male
Profile found: user_id_2 {gender: "female", fullName: "Sam", location: "NYC", ...}
Total profiles found: 1
Displaying profile: {gender: "female", fullName: "Sam", ...}
```

If you see "Total profiles found: 0", then the gender filter isn't matching any profiles.

### 6. **Common Issues**

**Issue**: All accounts show same user
- **Cause**: All accounts have same gender
- **Fix**: Create accounts with different genders

**Issue**: See "User" with "Unknown" location
- **Cause**: Profile not filled in after signup
- **Fix**: Complete profile in Edit Profile page

**Issue**: No profiles showing
- **Cause**: No opposite gender profile exists
- **Fix**: Create at least one profile with opposite gender

**Issue**: Gender doesn't save
- **Cause**: Not selected during signup
- **Fix**: Make sure to select Male or Female before signing up

### 7. **Direct Firestore Check**

In Firebase Console:
1. Go to Firestore Database
2. Click "users" collection
3. Check each user document:

```json
{
  "email": "alex@test.com",
  "gender": "male",           // ← Must be "male" or "female"
  "fullName": "Alex",         // ← Must be set (auto-filled or edited)
  "location": "NYC",          // ← Must be set (default: "Not specified")
  "age": 25,                  // ← Optional but good to have
  "bio": "Love hiking!",      // ← Optional
  "interests": "hiking,coffee" // ← Optional
}
```

### 8. **Reset & Test Fresh**

If still having issues:
1. Delete all test user documents from Firestore
2. Create 2 brand new accounts (male and female)
3. Fill in all profile fields properly
4. Test matching

### 9. **Expected Behavior After Fix**

✅ Male account logs in → Sees all female profiles with full info
✅ Female account logs in → Sees all male profiles with full info
✅ Each profile shows: Name, Age, Location, Bio, Interests
✅ Can Like/Pass/Message profiles
✅ Mutual likes create matches

---

If still having issues after this, the console logs will help identify what's wrong!
