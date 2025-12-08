# הוראות הגדרת Google Drive Export

## שלב 1: יצירת Google Cloud Project ✅ (כבר עשית)

## שלב 2: הפעלת Google Drive API

1. לך ל-[Google Cloud Console](https://console.cloud.google.com/)
2. בחר את הפרויקט שלך
3. בתפריט השמאלי, לך ל-**APIs & Services** → **Library**
4. חפש "Google Drive API"
5. לחץ על "Google Drive API" ולחץ "Enable"

## שלב 3: יצירת OAuth Credentials ✅ (כבר יש לך)

**הפרטים שלך:**
- Client ID: `YOUR_CLIENT_ID_HERE`
- Client Secret: `YOUR_CLIENT_SECRET_HERE`

## שלב 4: קבלת Refresh Token (זה מה שצריך עכשיו!)

### שיטה 1: באמצעות OAuth Playground (הכי פשוט) ⭐

1. לך ל-[OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. לחץ על האייקון ⚙️ (Settings) בפינה הימנית העליונה
3. סמן ✅ "Use your own OAuth credentials"
4. הדבק:
   - **OAuth Client ID**: `YOUR_CLIENT_ID_HERE`
   - **OAuth Client secret**: `YOUR_CLIENT_SECRET_HERE`
5. לחץ "Close"
6. בתפריט השמאלי, גלול למטה למצוא **"Drive API v3"**
7. הרחב את "Drive API v3" וסמן ✅ את:
   - `https://www.googleapis.com/auth/drive.file`
8. לחץ על **"Authorize APIs"** (כפתור כחול למעלה)
9. התחבר עם החשבון Google שלך
10. אם תראה אזהרה על "אפליקציה לא מאומתת" - לחץ **"Advanced"** ואז **"Go to [שם הפרויקט] (unsafe)"**
11. אשר את ההרשאות
12. חזור ל-OAuth Playground ותראה קוד הרשאה
13. לחץ על **"Exchange authorization code for tokens"** (כפתור כחול)
14. העתק את ה-**Refresh token** (השורה הארוכה מתחת ל-"Refresh token")

### שיטה 2: באמצעות קוד Node.js

צור קובץ `get-refresh-token.js`:

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const oauth2Client = new google.auth.OAuth2(
  'YOUR_CLIENT_ID_HERE',
  'YOUR_CLIENT_SECRET_HERE',
  'http://localhost:3000'
);

const scopes = ['https://www.googleapis.com/auth/drive.file'];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: scopes,
});

console.log('Authorize this app by visiting this url:', authUrl);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the code from that page here: ', (code) => {
  rl.close();
  oauth2Client.getToken(code, (err, token) => {
    if (err) return console.error('Error retrieving access token', err);
    console.log('Refresh Token:', token.refresh_token);
  });
});
```

הרץ: `node get-refresh-token.js`

## שלב 5: הוספת משתני סביבה

הוסף לקובץ `.env.local`:

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REFRESH_TOKEN=YOUR_REFRESH_TOKEN_HERE
```

## שלב 6: בדיקה

1. הפעל את השרת מחדש: `npm run dev`
2. לך לדף הדוחות: `http://localhost:3001/trainer/reports`
3. לחץ על "ייצא ל-Google Drive"
4. הקובץ אמור להופיע ב-Google Drive שלך!

## הערות חשובות

- **Refresh Token** תקף עד שתבטל את ההרשאה. אם תבטל, תצטרך ליצור חדש.
- הקבצים נשמרים ישירות ב-Google Drive שלך (לא בתיקייה ספציפית).
- הקבצים נשמרים עם שם ייחודי לפי תאריך.

## פתרון בעיות

### שגיאה: "Google Drive credentials לא מוגדרים"
- ודא שהוספת את כל 3 המשתנים ל-`.env.local`
- ודא שהשרת רץ מחדש אחרי הוספת המשתנים

### שגיאה: "לא ניתן לקבל access token"
- ודא שה-Refresh Token תקף
- נסה ליצור Refresh Token חדש

### שגיאה: "Insufficient permissions"
- ודא שהוספת את ה-scope הנכון: `https://www.googleapis.com/auth/drive.file`
- ודא שהאימייל שלך ברשימת Test Users (אם האפליקציה ב-Testing mode)

### שגיאה: "App not verified" / "אפליקציה לא מאומתת"
- זה נורמלי אם האפליקציה ב-Testing mode
- לחץ "Advanced" → "Go to [שם הפרויקט] (unsafe)"
- זה בטוח כי זה האפליקציה שלך
