// Shared auth helpers + nav state, used on every page (login.html has the
// actual sign-in/sign-up forms; every other page just needs to know
// whether someone is logged in, to show "My Account" vs "Log In").

function signUp(email, password, name, phone) {
  return auth.createUserWithEmailAndPassword(email, password).then(cred => {
    return db.collection("customers").doc(cred.user.uid).set({
      name: name,
      phone: phone,
      email: email,
      loyaltyPoints: 0,
      category: "REGULAR",
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => cred);
  });
}

function logIn(email, password) {
  return auth.signInWithEmailAndPassword(email, password);
}

function logOut() {
  return auth.signOut();
}

function updateAuthNav(user) {
  const loggedOutEl = document.getElementById("navLoggedOut");
  const loggedInEl = document.getElementById("navLoggedIn");
  const nameEl = document.getElementById("navUserName");
  if (loggedOutEl) loggedOutEl.classList.toggle("d-none", !!user);
  if (loggedInEl) loggedInEl.classList.toggle("d-none", !user);
  if (nameEl && user) nameEl.textContent = user.displayName || user.email;
}

document.addEventListener("DOMContentLoaded", () => {
  auth.onAuthStateChanged(updateAuthNav);
  const logoutBtn = document.getElementById("navLogoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (e) => {
      e.preventDefault();
      logOut().then(() => window.location.href = "index.html");
    });
  }
});
