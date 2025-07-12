
import { auth, db } from "../firebase/firebase-config.js";
import {
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  updateDoc,
  arrayUnion,
  where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

let currentUser = null;
const teammatesList = document.getElementById("teammatesList");

// ================= AUTH + PROFILE + RANK =================
onAuthStateChanged(auth, async (user) => {
  if (!user) return (location.href = "index.html");
  currentUser = user;

  const uid = user.uid;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return;

  const userData = userSnap.data();
  document.getElementById("playerName").textContent = userData.fullName || "Player";
  document.getElementById("playerPoints").textContent = parseInt(userData.points || 0);

  const rankQuery = query(collection(db, "users"), orderBy("points", "desc"));
  const rankSnap = await getDocs(rankQuery);
  let rank = "#--";
  rankSnap.docs.forEach((docSnap, index) => {
    if (docSnap.id === uid) rank = `#${index + 1}`;
  });
  document.getElementById("playerRank").textContent = rank;

  await loadTeammates(userData);
  loadNextMatch();
});

// ============== LOAD TEAMMATES ==================
async function loadTeammates(userData) {
  teammatesList.innerHTML = "";

  // Current user block
  teammatesList.innerHTML += `
    <div class="teammate main-user">
      <img src="${userData.profile || 'images/user-placeholder.png'}" />
      <span>${userData.fullName}</span>
    </div>
  `;

  const teammates = userData.teammates || [];
  for (const teammateId of teammates) {
    const teammateRef = doc(db, "users", teammateId);
    const snap = await getDoc(teammateRef);
    if (snap.exists()) {
      const t = snap.data();
      teammatesList.innerHTML += `
        <div class="teammate">
          <img src="${t.profile || 'images/user-placeholder.png'}" />
          <span>${t.fullName}</span>
        </div>
      `;
    }
  }

  // Add Member Circle
  teammatesList.innerHTML += `
    <div class="teammate add-member" onclick="openAddTeammatePopup()">
      <div class="add-circle">+</div>
      <span class="add-label">Add Member</span>
    </div>
  `;
}

// ============== ADD TEAMMATE LOGIC ==================
window.openAddTeammatePopup = function () {
  document.getElementById("addTeammateModal").classList.remove("hidden");
};
window.closeTeammateModal = function () {
  document.getElementById("addTeammateModal").classList.add("hidden");
};

window.addTeammate = async function () {
  const input = document.getElementById("teammateInput").value.trim();
  const message = document.getElementById("teammateMessage");
  message.style.color = "white";
  message.textContent = "Checking...";

  if (!input) {
    message.style.color = "red";
    message.textContent = "Please enter an email or phone number.";
    return;
  }

  try {
    const q = query(collection(db, "users"), where("email", "==", input));
    const snap = await getDocs(q);

    if (snap.empty) {
      message.style.color = "red";
      message.textContent = "User not found.";
      return;
    }

    const teammateDoc = snap.docs[0];
    const teammateId = teammateDoc.id;
    const teammateName = teammateDoc.data().fullName;

    // Update current user
    await updateDoc(doc(db, "users", auth.currentUser.uid), {
      teammates: arrayUnion(teammateId),
    });

    // Update teammate user
    await updateDoc(doc(db, "users", teammateId), {
      teammates: arrayUnion(auth.currentUser.uid),
    });

    message.style.color = "green";
    message.textContent = "✅ Member added successfully!";
    setTimeout(() => {
      closeTeammateModal();
      loadTeammates({ ...auth.currentUser, ...teammateDoc.data() });
    }, 1000);
  } catch (err) {
    console.error("Error adding teammate:", err);
    message.style.color = "red";
    message.textContent = "Error adding teammate.";
  }
};

// ============== NEXT MATCH ==================
async function loadNextMatch() {
  const matchBox = document.querySelector(".stat-card.match");

  try {
    const q = query(collection(db, "next match"), orderBy("match date", "asc"), limit(1));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const m = snap.docs[0].data();
      const date = m["match date"].toDate();

      matchBox.innerHTML = `
        <h3>Next Match</h3>
        <div class="match-info">
          <p><strong>${m["Team 1"]}</strong> 🆚 <strong>${m["Team 2"]}</strong></p>
          <p>🗓️ ${date.toLocaleDateString()} - ${date.toLocaleTimeString()}</p>
          <p>📍 ${m["Location"]}</p>
          <p class="countdown" id="countdown">Loading countdown...</p>
        </div>
      `;
      startCountdown(date);
    } else {
      matchBox.innerHTML = `<h3>Next Match</h3><p>No upcoming match found.</p>`;
    }
  } catch (error) {
    console.error("Error loading match:", error);
    matchBox.innerHTML = `<h3>Next Match</h3><p>Error loading match.</p>`;
  }
}

function startCountdown(matchDate) {
  const countdownEl = document.getElementById("countdown");

  function updateCountdown() {
    const now = new Date().getTime();
    const dist = matchDate.getTime() - now;

    if (dist <= 0) {
      countdownEl.textContent = "🟢 It's Match Time!";
      return;
    }

    const d = Math.floor(dist / (1000 * 60 * 60 * 24));
    const h = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const m = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));

    countdownEl.textContent = `⏳ ${d}d ${h}h ${m}m remaining`;
  }

  updateCountdown();
  setInterval(updateCountdown, 60000);
}
// Open & Close Team Popup
window.openTeamPopup = function () {
  document.getElementById('teamPopup').classList.remove('hidden');
  loadTeamPopupData(); // Optional: to show existing data
};

function closeTeamPopup() {
  document.getElementById('teamPopup').classList.add('hidden');
}

// Logo preview
document.getElementById('teamLogoInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (event) {
      document.getElementById('teamLogoPreview').src = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Save team data to Firestore
async function saveTeamData() {
  const teamName = document.getElementById('teamNameInput').value.trim();
  const logoFile = document.getElementById('teamLogoInput').files[0];
  const user = firebase.auth().currentUser;
  const messageBox = document.getElementById('teamMessage');

  if (!user || !teamName) {
    messageBox.textContent = 'Please enter team name.';
    return;
  }

  const docRef = firebase.firestore().collection('teams').doc(user.uid);
  let teamLogoURL = '';

  if (logoFile) {
    const storageRef = firebase.storage().ref(`team_logos/${user.uid}`);
    await storageRef.put(logoFile);
    teamLogoURL = await storageRef.getDownloadURL();
  }

  await docRef.set(
    {
      teamName,
      teamLogo: teamLogoURL || document.getElementById('teamLogoPreview').src,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  messageBox.textContent = '✅ Team saved successfully!';
  setTimeout(() => {
    messageBox.textContent = '';
    closeTeamPopup();
  }, 1500);
}
