let selectedLevel = null;


function login() {
  const nameInput = document.getElementById("nameInput");
  const name = nameInput.value.trim();
  if (!name) return alert("Введите имя!");
  
  localStorage.setItem("playerName", name);
  document.getElementById("authOverlay").style.display = "none";
  document.getElementById("userName").textContent = name;
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

  localStorage.setItem("selectedLevel", selectedLevel);
  localStorage.setItem("selectedDifficulty", diff);

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

  const dataStr = localStorage.getItem("playerScores");
  if (!dataStr) return;

  const scores = JSON.parse(dataStr);

  const playersArr = Object.entries(scores).map(([player, playerScore]) => {
    const easy = playerScore[`${level}lvle`] || 0;
    const normal = playerScore[`${level}lvln`] || 0;
    const hard = playerScore[`${level}lvlh`] || 0;
    const total = easy + normal + hard;
    return { player, easy, normal, hard, total };
  });

  playersArr.sort((a, b) => b.total - a.total);

  playersArr.slice(0, 5).forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${p.player}</td>
                    <td>${p.easy}</td>
                    <td>${p.normal}</td>
                    <td>${p.hard}</td>`;
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