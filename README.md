# K.T.A International - ktair.net

אתר הזמנת טיסות מתל אביב ליוון וקפריסין, כולל שילוב Vista Mare ותשלום Tranzila.
Flight booking website: Tel Aviv to Greece & Cyprus, with Vista Mare stays and Tranzila checkout.

## מבנה התיקיות / Folder structure

```
kta-website/
├── index.html              דף האתר הראשי / Main page
├── 404.html                דף שגיאה / Not-found page
├── robots.txt              הנחיות למנועי חיפוש / Search engines
├── sitemap.xml             מפת אתר / Sitemap
├── site.webmanifest        הגדרות אפליקציה / App manifest
├── assets/
│   ├── css/styles.css      עיצוב / Styles
│   ├── images/logo.png     לוגו / Logo
│   └── js/
│       ├── config.js       נתונים: טיסות, יעדים, חדרים / Static data
│       ├── utils.js        פונקציות אבטחה / Security helpers
│       ├── store.js        מצב ושמירה מקומית / State & storage
│       ├── booking.js      חיפוש, הזמנה, תשלום, כרטיס עלייה / Booking flow
│       ├── auth.js         התחברות והרשמה / Login & signup
│       ├── admin.js        פאנל ניהול / Admin console
│       ├── content.js      יעדים וחלונות מידע / Destinations & modals
│       ├── db.js           חיבור עתידי למסד נתונים / Database adapter
│       └── main.js         הפעלת האתר / Boot
└── .github/workflows/deploy.yml   העלאה אוטומטית ל-GitHub Pages
```

סדר טעינת קבצי ה-JS ב-index.html חשוב - לא לשנות אותו.
The JS load order in index.html matters - keep it as is.

## הרצה מקומית / Run locally

```
python3 -m http.server 8000
```
ואז לפתוח / then open: http://localhost:8000

## העלאה לאוויר / Deploy

**GitHub Pages:** Settings > Pages > Source: GitHub Actions. כל push ל-main מעלה את האתר אוטומטית.
לדומיין ktair.net: להוסיף קובץ `CNAME` עם השורה `ktair.net` ולהגדיר DNS אצל רשם הדומיין.

**Netlify / Vercel:** לחבר את ה-repository, בלי build command, תיקיית פרסום: `/`.

## לפני עלייה לאוויר / Before going live

- התשלום כרגע **מדומה** - בלי `endpoint` של שרת, האתר מאשר כל כרטיס ומנפיק PNR. יש לחבר את Tranzila דרך iframe מאובטח של Tranzila או שרת backend.
- ההתחברות והנתונים נשמרים בדפדפן בלבד (localStorage). סיסמת המנהל כתובה בקוד (`config.js`) - יש להחליף ולהעביר לשרת אמיתי (למשל Supabase Auth).
- Tailwind נטען מ-CDN - מתאים לאתר קטן; לביצועים מקסימליים אפשר בעתיד לבנות קובץ CSS מקומי.
