// reservation.html — books a table by writing a "reservations" doc.

function submitReservation(e) {
  e.preventDefault();
  const msg = document.getElementById("reservationMsg");
  const user = auth.currentUser;

  const doc = {
    customerId: user ? user.uid : null,
    name: document.getElementById("resName").value,
    phone: document.getElementById("resPhone").value,
    date: document.getElementById("resDate").value,
    time: document.getElementById("resTime").value,
    guests: parseInt(document.getElementById("resGuests").value || 1),
    seating: document.getElementById("resSeating").value,
    vipRoom: document.getElementById("resVip").checked,
    occasion: document.getElementById("resOccasion").value,
    specialRequest: document.getElementById("resRequest").value,
    status: "PENDING",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  document.getElementById("reservationSubmitBtn").disabled = true;
  db.collection("reservations").add(doc).then(() => {
    msg.innerHTML = '<div class="alert alert-success">Reservation request sent! We will confirm by phone shortly.</div>';
    document.getElementById("reservationForm").reset();
    document.getElementById("reservationSubmitBtn").disabled = false;
  }).catch(err => {
    msg.innerHTML = '<div class="alert alert-danger">' + err.message + '</div>';
    document.getElementById("reservationSubmitBtn").disabled = false;
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("reservationForm").addEventListener("submit", submitReservation);
  auth.onAuthStateChanged(user => {
    if (user) {
      db.collection("customers").doc(user.uid).get().then(doc => {
        if (doc.exists) {
          document.getElementById("resName").value = doc.data().name || "";
          document.getElementById("resPhone").value = doc.data().phone || "";
        }
      });
    }
  });
});
