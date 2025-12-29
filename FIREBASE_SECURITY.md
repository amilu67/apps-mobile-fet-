# Firebase Security Guide - Apps Mobile FET

## ⚠️ Important: Firebase API Keys Are Public

**This is normal and expected behavior.** Firebase API keys are not secret credentials and are designed to be included in client-side code.

### Why API Keys Are Visible

1. **Frontend apps need them** - The browser/mobile app must know which Firebase project to connect to
2. **Firebase's security model** - Protection comes from Database Rules, NOT from hiding API keys
3. **Industry standard** - All Firebase apps (Google, major companies) have visible API keys

**Example:** You can see Firebase credentials in apps like:
- Google's own Firebase documentation examples
- Major production apps using Firebase
- Open source projects on GitHub

## 🔒 Real Security: Database Rules

Your security comes from properly configured **Firebase Realtime Database Rules**, not from hiding credentials.

### Implemented Rules (Authentication Required) ✅

```json
{
  "rules": {
    "orario": {
      ".read": true,
      ".write": "auth != null"
    },
    "sostituzioni": {
      ".read": true,
      ".write": "auth != null",
      "$sostituzioneId": {
        ".validate": "!newData.exists() || newData.hasChildren(['data', 'classe', 'ora_inizio', 'ora_fine'])"
      }
    },
    "classi_assenti": {
      ".read": true,
      ".write": "auth != null",
      "$date": {
        ".validate": "!newData.exists() || newData.hasChildren(['classi', 'timestamp'])"
      }
    }
  }
}
```

**✅ Security:** Only authenticated users can write data!

### Recommended Rules (Production Security) ✅

```json
{
  "rules": {
    "orario": {
      ".read": true,
      ".write": "auth != null"  // Only authenticated users
    },
    "sostituzioni": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true"  // Only admins
    },
    "classi_assenti": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true"  // Only admins
    }
  }
}
```

## ✅ Authentication Already Implemented

**Good news!** Firebase Authentication is already fully integrated in the Staff and Converter apps.

### What's Included

#### 1. Staff App (`staff-app/`)
- ✅ Professional login page (`login.html`)
- ✅ Email/Password authentication
- ✅ Auto-redirect to login if not authenticated
- ✅ "Remember me" option
- ✅ Logout button in all pages
- ✅ Auth state sync between parent window and iframes

#### 2. Converter App (`converter-app/`)
- ✅ Login page (`login.html`)
- ✅ Authentication required to upload schedules
- ✅ Auto-redirect to login if not authenticated

#### 3. AuthManager (in `firebase-config.js`)
```javascript
window.AuthManager = {
  async login(email, password) { ... },
  async logout() { ... },
  isLoggedIn() { ... },
  getCurrentUser() { ... },
  onAuthStateChanged(callback) { ... }
};
```

### Setup Instructions

**Step 1:** Enable Authentication in Firebase Console
1. Go to Firebase Console > Authentication
2. Click "Get Started"
3. Enable "Email/Password" provider

**Step 2:** Create Staff Users
1. In Firebase Console > Authentication > Users
2. Click "Add User"
3. Enter email and password for each staff member

**Step 3:** Set Database Rules
1. Go to Firebase Console > Realtime Database > Rules
2. Copy the rules shown above
3. Click "Publish"

**That's it!** The authentication is already coded and ready to use.

### Step 4: Set Custom Claims for Admin Users

Use Firebase Admin SDK or Firebase Console:

```javascript
// Using Firebase Admin SDK (Node.js)
admin.auth().setCustomUserClaims(uid, { admin: true });
```

Or via Firebase CLI:
```bash
firebase auth:import users.json --hash-algo=bcrypt
```

## 🎯 Security Levels

### Level 1: Basic ⚠️
- ✅ Anyone can read data
- ⚠️ Anyone can write sostituzioni/classi_assenti
- **Use for**: Testing, internal networks only
- **Status**: NOT RECOMMENDED

### Level 2: Authentication Required (CURRENT) ✅
- ✅ Anyone can read data
- ✅ Only authenticated users can write
- **Use for**: Small schools with trusted staff
- **Status**: ✅ IMPLEMENTED

### Level 3: Role-Based (Recommended) 🔒
- ✅ Anyone can read data
- ✅ Only admins can write
- ✅ Different permissions for different roles
- **Use for**: Production environments

### Level 4: Advanced Security 🛡️
Add IP restrictions, rate limiting, and more:

```json
{
  "rules": {
    "orario": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true"
    },
    "sostituzioni": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true",
      ".validate": "newData.hasChildren(['data', 'classe', 'ora'])"
    },
    "classi_assenti": {
      ".read": true,
      ".write": "auth != null && auth.token.admin === true"
    }
  }
}
```

## 🔐 Additional Security Measures

### 1. App Check (Optional)
Verify requests come from your genuine app, not bots:

```javascript
// Enable App Check
const appCheck = firebase.appCheck();
appCheck.activate('RECAPTCHA_V3_SITE_KEY');
```

### 2. Domain Restrictions
In Firebase Console > Project Settings > Authorized domains:
- Add only your production domains
- Remove localhost for production

### 3. API Key Restrictions
In Google Cloud Console:
- Go to API & Services > Credentials
- Edit your Firebase API key
- Add HTTP referrer restrictions (your domain)

### 4. Rate Limiting
Prevent abuse with Firebase Security Rules:

```json
{
  "rules": {
    "sostituzioni": {
      ".write": "auth != null && 
                 !root.child('rate_limit/' + auth.uid).exists() ||
                 root.child('rate_limit/' + auth.uid).val() < now - 60000"
    }
  }
}
```

## 📊 Monitoring & Alerts

### 1. Enable Firebase Monitoring
- Firebase Console > Performance Monitoring
- Track API usage
- Set up alerts for unusual activity

### 2. Review Security Rules Regularly
```bash
firebase database:get /
firebase database:profile
```

### 3. Audit Authentication
- Review user list regularly
- Remove inactive accounts
- Monitor sign-in activity

## ❓ FAQ

### Q: Should I hide my API key in environment variables?
**A:** No. Firebase API keys are not secret. They're designed to be in client code.

### Q: Someone can see my API key in the browser. Are they hacking me?
**A:** No. This is normal. Your data is protected by Database Rules, not by hiding the API key.

### Q: Can someone abuse my Firebase quota with my API key?
**A:** Possible but unlikely. Mitigate with:
- Proper Database Rules
- App Check
- Domain restrictions
- Monitoring and alerts

### Q: Should I use different Firebase projects for dev/prod?
**A:** Yes! Best practice:
- `project-dev` for testing (relaxed rules)
- `project-prod` for production (strict rules)

### Q: What if I accidentally commit firebase-config.js to GitHub?
**A:** 
1. It's annoying but not catastrophic
2. Update your Database Rules immediately
3. Consider rotating your API key (create new web app in Firebase)
4. Add proper `.gitignore` to prevent future commits

## 🎓 Learn More

- [Firebase Security Rules Documentation](https://firebase.google.com/docs/rules)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase App Check](https://firebase.google.com/docs/app-check)
- [Is it safe to expose Firebase apiKey to the public?](https://stackoverflow.com/questions/37482366/is-it-safe-to-expose-firebase-apikey-to-the-public) (Stack Overflow)

## ✅ Action Items

**For Testing/Development:**
- [x] Use current rules (already implemented)
- [x] Test on internal network only

**For Production:**
- [x] Enable Firebase Authentication ✅
- [x] Update Database Rules to require authentication ✅
- [ ] Create admin users (via Firebase Console)
- [x] Add login screen to Staff App ✅
- [x] Add login screen to Converter App ✅
- [ ] Test thoroughly
- [ ] Add domain restrictions (optional)
- [ ] Enable monitoring (optional)

---

**Remember:** Firebase API keys are public by design. Your security comes from properly configured Database Rules and Authentication. 🔒
