let selectedLevel = null;
let selectedAvatar = 1;
const AVATAR_COUNT = 10;
const MAX_ACCOUNTS = 15;
let authMode = "new";

function toggleAuthMode() {
  authMode = authMode === "new" ? "existing" : "new";

  document.getElementById("newAccountBlock").style.display =
    authMode === "new" ? "block" : "none";

  document.getElementById("existingAccountBlock").style.display =
    authMode === "existing" ? "block" : "none";

  document.getElementById("authTitle").textContent =
    authMode === "new" ? "Новый аккаунт" : "Выберите аккаунт";

  document.querySelector(".link-btn").textContent =
    authMode === "new" ? "У меня уже есть аккаунт" : "Создать новый аккаунт";
    
  if (authMode === "existing") {
    renderAccountsList();
  }
}

function changeAuthAvatar() {
  const avatarImg = document.getElementById("authAvatar");

  if (avatarImg.style.pointerEvents === "none") return;

  selectedAvatar++;
  if (selectedAvatar > AVATAR_COUNT) selectedAvatar = 1;

  avatarImg.src = `avatars/${selectedAvatar}.jpg`;
}

function changeAvatar() {
  const name = localStorage.getItem("playerName");
  if (!name) return;

  let players = JSON.parse(localStorage.getItem("players") || "{}");
  if (!players[name]) return;

  const currentAvatar = players[name].avatar;
  const match = currentAvatar.match(/(\d+)\.jpg$/);
  let currentIndex = match ? parseInt(match[1]) : 1;

  currentIndex++;
  if (currentIndex > AVATAR_COUNT) currentIndex = 1;

  players[name].avatar = `avatars/${currentIndex}.jpg`;
  localStorage.setItem("players", JSON.stringify(players));

  renderUserAvatar();
}

function deleteAccount() {
  const name = localStorage.getItem("playerName");
  if (!name) return;

  if (!confirm(`Удалить аккаунт "${name}"? Все данные будут потеряны.`)) return;

  let players = JSON.parse(localStorage.getItem("players") || "{}");
  delete players[name];
  localStorage.setItem("players", JSON.stringify(players));

  let scores = JSON.parse(localStorage.getItem("playerScores") || "{}");
  delete scores[name];
  localStorage.setItem("playerScores", JSON.stringify(scores));

  localStorage.removeItem("playerName");
  location.reload();
}


function createAccount() {
  const name = document.getElementById("nameInput").value.trim();
  if (!name) return alert("Введите имя");

  if (name.length > 12) return alert("Имя не должно быть длиннее 12 символов");

  let players = JSON.parse(localStorage.getItem("players") || "{}");

  if (Object.keys(players).length >= MAX_ACCOUNTS) {
    return alert("Достигнуто максимальное количество аккаунтов (15)");
  }

  if (players[name]) {
    alert("Такой аккаунт уже существует");
    return;
  }

  players[name] = {
    avatar: `avatars/${selectedAvatar}.jpg`
  };

  localStorage.setItem("players", JSON.stringify(players));
  loginAs(name);
}

function loginAs(name) {
  localStorage.setItem("playerName", name);
  document.getElementById("authOverlay").style.display = "none";
  document.getElementById("userName").textContent = name;
  renderUserAvatar();
}

function renderAccountsList() {
  const list = document.getElementById("accountsList");
  list.innerHTML = "";

  const players = JSON.parse(localStorage.getItem("players") || "{}");

  if (Object.keys(players).length === 0) {
    list.innerHTML = "<p>Нет сохранённых аккаунтов</p>";
    return;
  }

  for (let name in players) {
    const div = document.createElement("div");
    div.className = "account-item";
    div.innerHTML = `
      <img src="${players[name].avatar}"  class="leader-avatar">
      <span>${name}</span>
    `;
    div.onclick = () => loginAs(name);
    list.appendChild(div);
  }
}

function renderUserAvatar() {
  const name = localStorage.getItem("playerName");
  if (!name) return;

  const players = JSON.parse(localStorage.getItem("players") || "{}");
  const avatar = players[name]?.avatar;

  if (!avatar) return;

  const img = document.getElementById("userAvatar");
  img.src = avatar;
}

function logout() {
  localStorage.removeItem("playerName");
  location.reload();
}

function chooseLevel(level) {
  selectedLevel = level;
  document.getElementById("difficultyModal").style.display = "flex";

  document.querySelectorAll(".diffBtn").forEach(btn => {
    const diff = btn.getAttribute("onclick")?.match(/\d/);

    if (!diff) return;

    const isAllowed = canStartDifficulty(level, diff[0]);

    btn.disabled = !isAllowed;
    btn.style.opacity = isAllowed ? "1" : "0.4";
    btn.style.cursor = isAllowed ? "pointer" : "not-allowed";
  });
}


function startGame(diff) {
  document.getElementById("difficultyModal").style.display = "none";

  const levelPaths = {
    1: { '1': '1level/easy/1e.html', '2': '1level/normal/1n.html', '3': '1level/hard/1h.html' },
    2: { '1': '2level/easy/2e.html', '2': '2level/normal/2n.html', '3': '2level/hard/2h.html' },
    3: { '1': '3level/easy/3e.html', '2': '3level/normal/3n.html', '3': '3level/hard/3h.html' }
  };

  location.href = levelPaths[selectedLevel][diff];
}

function closeDifficulty() {
  document.getElementById("difficultyModal").style.display = "none";
}

function savePlayerScore(playerName, level, difficulty, score) {
  let allScores = localStorage.getItem("playerScores")
    ? JSON.parse(localStorage.getItem("playerScores"))
    : {};

  if (!allScores[playerName]) allScores[playerName] = {};

  const key = `${level}lvl${difficulty}`;
  allScores[playerName][key] = score;

  localStorage.setItem("playerScores", JSON.stringify(allScores));
}

function renderLeaderboard(level) {
  const tableBody = document.querySelector("#leaderboard tbody");
  tableBody.innerHTML = "";

  const scoresStr = localStorage.getItem("playerScores");
  const playersStr = localStorage.getItem("players");

  if (!scoresStr || !playersStr) return;

  const scores = JSON.parse(scoresStr);
  const playersData = JSON.parse(playersStr);

  const playersArr = Object.entries(scores).map(([player, playerScore]) => {
    const easy = playerScore[`${level}lvle`] || 0;
    const normal = playerScore[`${level}lvln`] || 0;
    const hard = playerScore[`${level}lvlh`] || 0;
    const total = easy + normal + hard;
    const avatar = playersData[player]?.avatar || "avatars/1.jpg";
    return { player, easy, normal, hard, total, avatar };
  });

  playersArr.sort((a, b) => b.total - a.total);

  playersArr.slice(0, 5).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="player-cell">
        <img src="${p.avatar}" class="leader-avatar">
        <span>${p.player}</span>
      </td>
      <td>${p.easy}</td>
      <td>${p.normal}</td>
      <td>${p.hard}</td>
    `;
    tableBody.appendChild(tr);
  });
}


window.onload = () => {
  const name = localStorage.getItem("playerName");
  if (!name) {
    document.getElementById("authOverlay").style.display = "flex";
  } else {
    document.getElementById("authOverlay").style.display = "none";
    document.getElementById("userName").textContent = name;
    renderUserAvatar();
  }

  const levelSelect = document.getElementById("leaderLevel");

  renderLeaderboard(levelSelect.value);

  levelSelect.addEventListener("change", () => {
    renderLeaderboard(levelSelect.value);
  });

};

function canStartDifficulty(level, diff) {
  const playerName = localStorage.getItem("playerName");
  if (!playerName) return false;

  const allScores = JSON.parse(localStorage.getItem("playerScores") || "{}");
  const playerScores = allScores[playerName] || {};

  if (diff === '1') return true;

  if (diff === '2') {
    return (playerScores[`${level}lvle`] || 0) > 0;
  }

  if (diff === '3') {
    return (playerScores[`${level}lvln`] || 0) > 0;
  }

  return false;
}

function openSettings() {
  document.getElementById("settingsModal").style.display = "flex";
}

function closeSettings() {
  document.getElementById("settingsModal").style.display = "none";
}

function resetRating() {
  if (!confirm("Сбросить рейтинг всех игроков?")) return;
  localStorage.removeItem("playerScores");
  alert("Рейтинг сброшен");
  location.reload();
}

function unlockAll() {
  if (!confirm("Разблокировать все режимы? Ваши баллы будут обнулены")) return;
  const playerName = localStorage.getItem("playerName");
  if (!playerName) return;

  let allScores = JSON.parse(localStorage.getItem("playerScores") || "{}");
  if (!allScores[playerName]) allScores[playerName] = {};

  for (let lvl = 1; lvl <= 3; lvl++) {
    allScores[playerName][`${lvl}lvle`] = 1;
    allScores[playerName][`${lvl}lvln`] = 1;
    allScores[playerName][`${lvl}lvlh`] = 1;
  }

  localStorage.setItem("playerScores", JSON.stringify(allScores));
  alert("Все режимы разблокированы");
  location.reload();
}

function initHeartsBackground() {
  const container = document.getElementById('heartsBackground');
  if (!container) return;

  container.innerHTML = "";

  const stepX = 90;
  const stepY = 70;

  const cols = Math.ceil(window.innerWidth / stepX);
  const rows = Math.ceil(window.innerHeight / stepY);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {

      const heart = document.createElement('div');
      heart.className = 'heart-item';

      const rowOffset = (y % 2 === 0) ? 0 : stepX / 2;

      heart.style.left = (x * stepX + rowOffset) + "px";
      heart.style.top = (y * stepY) + "px";

      const flipper = document.createElement('div');
      flipper.className = 'heart-flipper';

      const front = document.createElement('div');
      front.className = 'heart-side heart-front';

      const back = document.createElement('div');
      back.className = 'heart-side heart-back';

      flipper.append(front, back);
      heart.appendChild(flipper);
      container.appendChild(heart);

      heart.addEventListener('mouseenter', () => {
        flipper.classList.toggle('flipped');
      });
    }
  }
}

window.addEventListener("resize", () => {
  initHeartsBackground();
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initHeartsBackground);
} else {
  initHeartsBackground();
}