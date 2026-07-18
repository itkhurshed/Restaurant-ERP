# ProServe Restaurant — Customer Website (Firebase + JS)

The customer-facing half of ProServe, built exactly to the second spec you shared: **HTML5, CSS3, JavaScript, Bootstrap 5, Chart.js-ready, Firebase Authentication, Firestore, Storage, and Hosting.** It's a separate project from the HTML/CSS/Java admin-and-POS system delivered earlier — this one is for customers browsing a full multi-cuisine menu (Western, Asian, and Arabic/Middle Eastern dishes), ordering, and booking tables online.

## Pages included

| Page | What it does |
|---|---|
| `index.html` | Landing page — hero, links to menu/reservations |
| `menu.html` | Browse/search/filter the full menu (reads Firestore); cards fade/slide into view as you scroll |
| `food-details.html?id=<docId>` | Sizes, toppings, spice level, notes, add to cart |
| `cart.html` | View/edit cart (stored in `localStorage` until checkout) |
| `checkout.html` | Order type, address, coupon code, payment method, places the order |
| `track-order.html?order=<docId>` | Order status timeline, or look up by order number |
| `reservation.html` | Table booking form |
| `login.html` | Firebase Auth sign-in / create account |
| `customer-dashboard.html` | Loyalty points, order history, reservation history (requires login) |
| `admin-seed.html` | **Dev-only.** One-click button to populate the full sample menu (categories, dishes across every cuisine) and a coupon code so the site has something to show. Delete before going live. |

This intentionally does **not** duplicate the admin dashboard, POS, kitchen display, inventory, accounting, etc. from the other spec — that's the Java project.

## The menu

`admin-seed.html` seeds 10 categories and 36 dishes covering a wide range of cuisines:

- **Breakfast**, **Main Dishes** — house classics
- **Burgers** — Chicken Burger, Beef Burger, Double Smash Burger
- **Pizza** — Margherita, Pepperoni, Four Cheese
- **Starters** — French Fries, Chicken Wings, Mozzarella Sticks
- **Asian** — Chicken Fried Rice, Beef Chow Mein, Pad Thai, California Roll, Chicken Teriyaki, Kung Pao Chicken, Thai Green Curry, Vegetable Spring Rolls
- **Arabic & Middle Eastern** — Chicken Shawarma Plate, Beef Shawarma Wrap, Mixed Grill Platter, Chicken Kabsa, Falafel Plate, Hummus with Pita, Mutabbal, Fattoush Salad, Manakish Zaatar, Kunafa
- **Salads & Soups** — Caesar Salad, Greek Salad, Lentil Soup
- **Desserts** — Chocolate Lava Cake, Cheesecake Slice, Baklava
- **Drinks** — Fresh Orange Juice, Arabic Coffee, Mint Lemonade

`menu.html` reveals each dish card with a scroll-triggered fade/slide-up animation (`js/menu.js` uses `IntersectionObserver`, styled in `css/style.css` under "Menu scroll-reveal animation"), staggered slightly per card so a full grid doesn't all pop in at once. This respects `prefers-reduced-motion` for users who've asked their OS to minimize motion.

## Setup — do this before anything will work

1. **Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com).
2. **Add a Web app** to it (the `</>` icon on the project overview page). Copy the `firebaseConfig` object it gives you.
3. **Paste that config into `js/firebase-config.js`**, replacing the placeholder values.
4. In the Firebase console, enable:
   - **Authentication** → Sign-in method → Email/Password.
   - **Firestore Database** → Create database (start in test mode for local development, then apply `firestore.rules` — see below).
   - **Storage** (only needed once you start uploading real food photos instead of placeholder images).
5. **Deploy the security rules**: either paste the contents of `firestore.rules` into the console's Rules tab, or (if you have the Firebase CLI) run `firebase deploy --only firestore:rules`.
6. **Run the site locally** — any static file server works, e.g.:
   ```bash
   npx serve .
   # or
   python3 -m http.server 8080
   ```
   Open `admin-seed.html` once and click "Seed Sample Data" to populate the full menu and a `WELCOME10` coupon so `menu.html` has something to display. Then delete or lock down `admin-seed.html`.
7. **Deploy for real** with Firebase Hosting:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init hosting   # point it at this folder, it already has firebase.json
   firebase deploy
   ```

## What's genuinely working vs. what needs more wiring

**Working once you've done the setup above:**
account creation/login, browsing a Firestore-backed multi-cuisine menu with search/category filters and scroll-in animation, configuring a dish (size/toppings/spice/notes) and adding to a `localStorage` cart, applying a coupon code, placing an order (writes to Firestore), tracking an order by link or order number, and a customer dashboard showing order/reservation history and loyalty points.

**Deliberately stubbed, needs a real integration to go further:**
- **Payments.** KNET/Visa/Mastercard/Apple Pay/Google Pay are offered as *selections* at checkout, and the order is marked `UNPAID` — actually charging a card needs a real payment gateway (KNET's own API, Stripe, etc.), which almost always needs a small backend to hold the secret key. That backend doesn't exist here; wiring one in (e.g. a Cloud Function) is the next step for real payments.
- **WhatsApp order notifications.** The WhatsApp link in the footer is just a `wa.me` deep link; automated WhatsApp messages need the WhatsApp Business API (Meta) or a service like Twilio, both of which require their own account setup.
- **Loyalty points and order status changes.** `loyaltyPoints` and order `status` fields exist in the data model, but nothing currently writes to them after an order is placed — in a full build that's typically done by a Cloud Function that triggers when an order document is created/updated, or by a staff-facing admin app.
- **Multi-language / RTL Arabic, multi-currency.** The data model and layout don't fight either of these, and the menu now includes Arabic/Middle Eastern dishes by name, but no translation strings or currency-conversion logic are wired up yet.

## Data model (Firestore collections)

- `categories` — `{ name, order }`
- `menuItems` — `{ name, categoryId, description, price, available, sizes: [{name, priceDelta}], toppings: [{name, price}], calories, allergyInfo, imageUrl }`
- `coupons` — `{ code, type: "PERCENT"|"FIXED", value, active }`
- `customers` — `{ name, phone, email, loyaltyPoints, category, createdAt }` (doc ID = Firebase Auth UID)
- `orders` — `{ orderNumber, customerId, customerName, customerPhone, orderType, address, items: [...], subtotal, discount, deliveryCharge, tax, total, paymentMethod, paymentStatus, status, createdAt }`
- `reservations` — `{ customerId, name, phone, date, time, guests, seating, vipRoom, occasion, specialRequest, status, createdAt }`

## Known limitations

- `firestore.rules` allows public read on `orders` so a guest can track an order by number without logging in — fine for a demo, but means anyone who guesses/finds an order ID could look at it. Tighten this (e.g. require a matching phone number, or move tracking behind a Cloud Function) before a real launch.
- There's no admin write path for `menuItems`/`categories` other than the Firebase console or `admin-seed.html`.
- No automated tests; this was verified by serving the folder with a headless DOM (jsdom) and confirming every remaining page loads, its scripts resolve, the menu renders the expected categories/dishes, and the scroll-reveal animation attaches correctly. The actual Firebase calls (login, Firestore reads/writes) can only be exercised against a real Firebase project, which wasn't available in the environment this was built in.
