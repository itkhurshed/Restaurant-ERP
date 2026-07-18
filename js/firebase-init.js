// Initializes Firebase (compat SDK, loaded via CDN in each page's <head>)
// and exposes shared handles other page scripts use.
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Restaurant-wide settings a real deployment would probably load from
// Firestore (a "settings/general" doc) instead of hardcoding. Kept here
// as constants to keep the demo simple.
const TAX_RATE = 0; // percent, applied at checkout if the restaurant is VAT-registered
const CURRENCY = "KWD";

function formatMoney(n) {
  return Number(n || 0).toFixed(3) + " " + CURRENCY;
}
