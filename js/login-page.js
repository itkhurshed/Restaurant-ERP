// login.html — toggles between the sign-in and create-account forms and
// wires them to auth.js's signUp()/logIn().

function redirectAfterAuth() {
  const target = new URLSearchParams(window.location.search).get("redirect") || "customer-dashboard.html";
  window.location.href = target;
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("showSignupBtn").addEventListener("click", () => {
    document.getElementById("loginPanel").classList.add("d-none");
    document.getElementById("signupPanel").classList.remove("d-none");
  });
  document.getElementById("showLoginBtn").addEventListener("click", () => {
    document.getElementById("signupPanel").classList.add("d-none");
    document.getElementById("loginPanel").classList.remove("d-none");
  });

  document.getElementById("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("loginMsg");
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;
    logIn(email, password).then(redirectAfterAuth).catch(err => {
      msg.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
    });
  });

  document.getElementById("signupForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const msg = document.getElementById("signupMsg");
    const name = document.getElementById("signupName").value;
    const phone = document.getElementById("signupPhone").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    signUp(email, password, name, phone).then(redirectAfterAuth).catch(err => {
      msg.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
    });
  });
});
