// fan.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, doc, getDoc, setDoc, updateDoc,
  collection, getDocs, query, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

// ✅ Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyB2J7vJquGsw2U4bgxL_7XvVWijT78wEpw",
  authDomain: "infinity-koraa.firebaseapp.com",
  projectId: "infinity-koraa",
  storageBucket: "infinity-koraa.appspot.com",
  messagingSenderId: "232347807276",
  appId: "1:232347807276:web:ecdc01b341a2ace0cceb89"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ✅ UI Elements
const usernameEl = document.getElementById("username");
const watchedEl = document.getElementById("videos-watched");
const votesEl = document.getElementById("correct-votes");
const pointsEl = document.getElementById("total-points");
const matchInfo = document.getElementById("match-info");
const votePopup = document.getElementById("vote-popup");
const voteOptions = document.getElementById("vote-options");
const closeBtn = document.querySelector(".close-popup");
const profileIcon = document.getElementById("user-avatar");
const dropdownMenu = document.querySelector(".dropdown-menu");
const navLinks = document.querySelectorAll(".nav-link");

// ✅ Toggle dropdown
profileIcon.addEventListener("click", () => {
  dropdownMenu.classList.toggle("hidden");
});

// ✅ Nav highlight
navLinks.forEach(link => {
  link.addEventListener("click", () => {
    navLinks.forEach(l => l.classList.remove("active"));
    link.classList.add("active");
  });
});

// ✅ Auth and user stats
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      usernameEl.textContent = data.fullName || 0;
      watchedEl.textContent = data.videowatched || 0;
      votesEl.textContent = data.correctVotes || 0;
      pointsEl.textContent = data.totalpoints || 0;
    } else {
      await setDoc(userRef, {
        videosWatched: 0,
        correctVotes: 0,
        totalPoints: 0,
        role: "fan"
      });
    }

    loadNextMatch(user.uid);
  } else {
    window.location.href = "index.html";
  }
});

// ✅ Load latest next match (first document in 'next match')
async function loadNextMatch(userId) {
  const matchQuery = query(collection(db, "next match"), limit(1));
  const querySnapshot = await getDocs(matchQuery);

  if (querySnapshot.empty) {
    matchInfo.innerHTML = "<p style='color:white;'>No match scheduled.</p>";
    return;
  }

  const matchDoc = querySnapshot.docs[0];
  const match = matchDoc.data();
  const matchId = matchDoc.id;

  const matchTime = match["match date"].toDate();
  const countdown = convertTime(matchTime - new Date());

  matchInfo.innerHTML = `
    <div class="teams">
      <div>
        <img src="${match.Team1Logo}" class="team-logo" />
        <div class="team-name">${match["Team 1"]}</div>
      </div>
      <div class="vs">VS</div>
      <div>
        <img src="${match.Team2Logo}" class="team-logo" />
        <div class="team-name">${match["Team 2"]}</div>
      </div>
    </div>
    <div class="match-info">
      <p>${match.Location}</p>
      <p>${matchTime.toLocaleString()}</p>
    </div>
    <div class="countdown">${countdown}</div>
    <div class="remaining">remaining</div>
    <button class="vote-btn">Vote Now</button>
  `;

  // Handle vote click
  document.querySelector(".vote-btn").addEventListener("click", () => {
    openVotePopup(match, userId, matchId);
  });

  setInterval(() => {
    const updated = convertTime(match["match date"].toDate() - new Date());
    document.querySelector(".countdown").textContent = updated;
  }, 1000);
}

// ✅ Convert milliseconds to hh:mm:ss
function convertTime(ms) {
  if (ms <= 0) return "00:00:00";
  const s = Math.floor(ms / 1000);
  const h = String(Math.floor(s / 3600)).padStart(2, "0");
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${h}:${m}:${sec}`;
}

// ✅ Show voting popup
function openVotePopup(match, userId, matchId) {
  votePopup.classList.remove("hidden");

  voteOptions.innerHTML = `
    <div class="vote-team" data-team="${match["Team 1"]}">
      <img src="${match.Team1Logo}" />
      <p>${match["Team 1"]}</p>
    </div>
    <div class="vote-team" data-team="${match["Team 2"]}">
      <img src="${match.Team2Logo}" />
      <p>${match["Team 2"]}</p>
    </div>
  `;

  document.querySelectorAll(".vote-team").forEach(el => {
    el.addEventListener("click", async () => {
      const team = el.dataset.team;
      const voteId = `${userId}_${matchId}`;

      await setDoc(doc(db, "votes", voteId), {
        userId,
        matchId,
        votedTeam: team
      });

      votePopup.innerHTML = `
        <div class="popup-content">
          <span class="close-popup">&times;</span>
          <h3 style="color: #c6ff00;">You voted for ${team}</h3>
        </div>
      `;

      document.querySelector(".close-popup").addEventListener("click", () => {
        votePopup.classList.add("hidden");
      });
    });
  });
}

// ✅ Close popup
closeBtn.addEventListener("click", () => {
  votePopup.classList.add("hidden");
});
