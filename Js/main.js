// ====== FIREBASE IMPORTS ======
import { auth, db } from "../firebase/firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  setDoc,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ====== NAVBAR SCROLL BG TOGGLE ======
window.addEventListener("scroll", () => {
  const navbar = document.getElementById("navbar");
  if (window.scrollY > 50) {
    navbar.classList.add("scrolled");
    navbar.style.padding = "10px 20px";
  } else {
    navbar.classList.remove("scrolled");
    navbar.style.padding = "15px 30px";
  }
});


// ====== SMOOTH SCROLL + ACTIVE NAV LINK ======
const navLinks = document.querySelectorAll(".nav-link");
navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    navLinks.forEach((link) => link.classList.remove("active"));
    link.classList.add("active");
    const target = document.getElementById(link.getAttribute("href").substring(1));
    if (target) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  });
});

// ====== MODAL OPEN/CLOSE HANDLING ======
const getStartedBtn = document.getElementById("getStartedBtn");
const loginModal = document.getElementById("loginModal");
const signupModal = document.getElementById("signupModal");

if (getStartedBtn) {
  getStartedBtn.addEventListener("click", () => {
    if (loginModal) loginModal.classList.remove("hidden");
  });
}
if (loginModal) {
  loginModal.classList.remove("hidden");
  loginModal.scrollIntoView({ behavior: "smooth" });
}

window.closeModal = function (modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add("hidden");
};

window.openModal = function (modalId) {
  if (loginModal) loginModal.classList.add("hidden");
  if (signupModal) signupModal.classList.add("hidden");
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove("hidden");
};

// ====== LOGIN FUNCTION ======
window.loginUser = async function () {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const message = document.getElementById("loginMessage");

  if (!email || !password) {
    message.style.color = "red";
    message.innerText = "All fields are required.";
    return;
  }

  message.style.color = "#C6FF00";
  message.innerText = "Checking credentials...";

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const role = docSnap.data().role;

      message.style.color = "green";
      message.innerText = "✅ Login successful! Redirecting...";

      setTimeout(() => {
        if (role === "player") {
          window.location.href = "player-home.html";
        } else if (role === "fan") {
          window.location.href = "fan-home.html";
        } else if (role === "admin") {
          window.location.href = "admin-dashboard.html";
        } else {
          message.style.color = "red";
          message.innerText = "Unknown user role.";
        }
      }, 1000);
    } else {
      message.style.color = "red";
      message.innerText = "User data not found.";
    }
  } catch (error) {
    message.style.color = "red";
    message.innerText = "Incorrect email or password.";
  }
};

// ====== SIGN UP FUNCTION ======
window.signupUser = async function () {
  const name = document.getElementById("signupName").value.trim();
  const age = document.getElementById("signupAge").value.trim();
  const city = document.getElementById("signupCity").value;
  const email = document.getElementById("signupEmail").value.trim();
  const phone = document.getElementById("signupPhone").value.trim();
  const pass = document.getElementById("signupPassword").value;
  const confirm = document.getElementById("signupConfirm").value;
  const role = document.getElementById("signupRole").value;
  const message = document.getElementById("signupMessage");

  if (!name || !age || !city || !email || !phone || !pass || !confirm || !role) {
    message.style.color = "red";
    message.innerText = "All fields are required.";
    return;
  }

  if (phone.length !== 11 || isNaN(phone)) {
    message.style.color = "red";
    message.innerText = "Phone number must be 11 digits.";
    return;
  }

  if (pass.length < 6) {
    message.style.color = "red";
    message.innerText = "Password must be at least 6 characters.";
    return;
  }

  if (pass !== confirm) {
    message.style.color = "red";
    message.innerText = "Passwords do not match.";
    return;
  }

  message.style.color = "#C6FF00";
  message.innerText = "Creating account... ⏳";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const uid = userCredential.user.uid;

    await setDoc(doc(db, "users", uid), {
      fullName: name,
      age: age,
      city: city,
      email: email,
      phone: phone,
      role: role,
      points: 0,
      teammates: []
    });

    message.style.color = "green";
    message.innerText = "✅ Account created successfully!";
    
    setTimeout(() => {
      closeModal('signupModal');
      openModal('loginModal');
    }, 1500);
  } catch (error) {
    console.error("Signup error:", error);
    message.style.color = "red";
    message.innerText = "❌ " + error.message;
  }
};
window.addEventListener("orientationchange", () => {
  document.body.style.height = window.innerHeight + "px";
});
