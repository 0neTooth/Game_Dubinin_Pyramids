const bottom = document.getElementById("bottom");
const peg = document.getElementById("peg");
const shuffleBtn = document.getElementById("shuffle");
const timerDisplay = document.getElementById("timerDisplay");
const overlay = document.getElementById("overlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const sideRingsBox = document.getElementById("sideRings");


let score = 0;
const scoreDisplay = document.getElementById("scoreDisplay");


let started = false; 
let baseSizes = [250, 230, 210, 190, 170, 150, 130, 110, 90, 70, 50, 30];
let missingIndexes = []; 
const colors = [
  '#f9a8d4',
  '#f472b6',
  '#e879f9',
  '#c084fc',
  '#a78bfa',
  '#7dd3fc',
  '#38bdf8',
  '#6ee7b7',
  '#34d399',
  '#fcd34d',
  '#fb923c',
  '#f87171'
];


let PLACEHOLDERS = 5;
let TIME_SEC = 120;
let timeLeft = TIME_SEC;
let timerInterval = null;

function formatTime(s){
  const mm = Math.floor(s/60).toString().padStart(2,'0');
  const ss = (s%60).toString().padStart(2,'0');
  return `${mm}:${ss}`;
}

function startTimer(){
  if (timerInterval) return;

  timerInterval = setInterval(() => {
    timeLeft--;

    timerDisplay.textContent = formatTime(timeLeft);

    const percent = timeLeft / TIME_SEC;
    timerBar.style.width = (percent * 100) + "%";

    const hue = percent * 120;
    timerBar.style.background = `hsl(${hue}, 100%, 50%)`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      timerBar.style.width = "0%";
      showModal(
        "Игра окончена",
        `Время вышло!<br>Ваши очки: ${score}`
      );
    }
  }, 1000);
}

function generateMissingIndexes() {
  missingIndexes = [];

  while (missingIndexes.length < PLACEHOLDERS) {
    const i = Math.floor(Math.random() * baseSizes.length);
    if (!missingIndexes.includes(i)) {
      missingIndexes.push(i);
    }
  }
}

function renderSideRings() {
  sideRingsBox.innerHTML = "";

  missingIndexes.forEach(index => {
    const placeholder = peg.querySelector(
      `.stack-placeholder[data-index="${index}"]`
    );
    if (!placeholder) return;

    const ring = document.createElement("div");
    ring.className = "side-ring";
    ring.style.background = colors[index];
    ring.dataset.index = index;
    ring.style.top = placeholder.offsetTop + "px";
    ring.style.left = "50%";
    ring.style.transform = "translateX(-50%)";
    ring.style.width = baseSizes[index] + "px";

    
    sideRingsBox.appendChild(ring);
  });
}



function enableMove() {
  const sideRings = Array.from(document.querySelectorAll(".side-ring"))
    .sort((a, b) => a.offsetTop - b.offsetTop);

  let selectedIndex = 0;
  let currentLefts = sideRings.map(() => 0);
  let moveInterval = null;
  let moveDirection = 0;

  const highlightSelected = () => {
    sideRings.forEach((ring, i) => {
      ring.style.outline = i === selectedIndex ? "2px solid #000000ff" : "none";
    });
  };
  highlightSelected();

  const updatePosition = () => {
  if (moveDirection === 0) return;

  const ring = sideRings[selectedIndex];
  const field = document.querySelector(".playfield");

  const fieldRect = field.getBoundingClientRect();
  const ringRect = ring.getBoundingClientRect();

  const speed = 2;
  let nextOffset = currentLefts[selectedIndex] + moveDirection * speed;

  const futureLeft =
    ringRect.left + moveDirection * speed;
  const futureRight =
    ringRect.right + moveDirection * speed;

  if (futureLeft < fieldRect.left) {
    nextOffset = currentLefts[selectedIndex];
  }

  if (futureRight > fieldRect.right) {
    nextOffset = currentLefts[selectedIndex];
  }

  currentLefts[selectedIndex] = nextOffset;

  ring.style.transform =
    `translateX(calc(-50% + ${currentLefts[selectedIndex]}px))`;
};


  document.addEventListener("keydown", (e) => {
    const ring = sideRings[selectedIndex];
    if (!ring) return;

    if (e.key === "ArrowUp") {
      selectedIndex = (selectedIndex - 1 + sideRings.length) % sideRings.length;
      highlightSelected();
      moveDirection = 0;
      return;
    }

    if (e.key === "ArrowDown") {
      selectedIndex = (selectedIndex + 1) % sideRings.length;
      highlightSelected();
      moveDirection = 0;
      return;
    }

    if (e.key === "ArrowRight") moveDirection = 1;
    if (e.key === "ArrowLeft") moveDirection = -1;

    if (!moveInterval && moveDirection !== 0) {
      moveInterval = setInterval(updatePosition, 20);
    }
  });

  document.addEventListener("keyup", (e) => {
    if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
      moveDirection = 0;
      clearInterval(moveInterval);
      moveInterval = null;
    }
  });
}



function fillPeg() {
  peg.innerHTML = "";

  baseSizes.forEach((size, i) => {

    if (missingIndexes.includes(i)) {
      const placeholder = document.createElement("div");
      placeholder.className = "stack-placeholder";
      placeholder.style.width = size + "px";
      placeholder.dataset.size = size;
      placeholder.dataset.index = i;
      peg.prepend(placeholder);
      return;
    }

    const bar = document.createElement("div");
    bar.className = "stack-item";
    bar.style.width = size + "px";
    bar.style.background = colors[i];
    bar.dataset.size = size;
    bar.dataset.index = i;

    peg.prepend(bar);
  });
}

function calculateAccuracy() {
  const sideRings = Array.from(document.querySelectorAll(".side-ring"));
  if (!sideRings.length) return 0;

  let totalPercent = 0;
  const tolerance = 5;

  sideRings.forEach((ring, i) => {
    const placeholder = peg.querySelector(`.stack-placeholder[data-index="${missingIndexes[i]}"]`);
    if (!placeholder) return;

    const placeholderCenter = placeholder.offsetLeft + placeholder.offsetWidth / 2;

    const ringRect = ring.getBoundingClientRect();
    const pegRect = peg.getBoundingClientRect();
    const ringCenter = ringRect.left - pegRect.left + ring.offsetWidth / 2;

    const deviation = Math.abs(ringCenter - placeholderCenter);

    let percent;
    if (deviation <= tolerance) {
      percent = 100;
    } else {
      percent = Math.max(100 - ((deviation - tolerance) / placeholder.offsetWidth * 100), 0);
    }

    totalPercent += percent;
  });

  return (totalPercent / sideRings.length).toFixed(0);
}


document.getElementById("finishBtn").addEventListener("click", () => {
  const accuracy = calculateAccuracy();
  const timeBonus = Math.max(timeLeft, 0);
  const score = Math.round((accuracy / 100) * Math.sqrt(timeBonus / TIME_SEC) * 100);

  showModal(
    "Результат",
    `
    Точность: ${accuracy}%<br>
    Осталось времени: ${timeBonus} сек<br><br>
    <b>Очки: ${score}</b>
    `
  );

  const playerName = localStorage.getItem("playerName");
  savePlayerScore(playerName, 3, "e", score);
  
  clearInterval(timerInterval);
  timerInterval = null;
  if (score > 0) {
    const nextLevelBtn = document.createElement("button");
    nextLevelBtn.textContent = "Следующая сложность";
    nextLevelBtn.style.marginTop = "12px";
    nextLevelBtn.addEventListener("click", () => {
    location.href = "../normal/3n.html";
    });

    const rulesButtonsDiv = overlay.querySelector(".rules-buttons");
    rulesButtonsDiv.appendChild(nextLevelBtn);
  }
});



function showModal(title,text){
  modalTitle.textContent = title;
  modalText.innerHTML = text;
  overlay.classList.add('show');
}

function hideModal(){
  overlay.classList.remove('show');
}


function backToMenu(){ location.href='../../index.html'; }


startOverlay.style.display = "flex";
startBtn.addEventListener("click", () => {
  startOverlay.style.display = "none";
  generateMissingIndexes();
  fillPeg();
  renderSideRings();
  enableMove();
  if (!started) {
    started = true;
    startTimer();
  }
});

function savePlayerScore(playerName, level, difficulty, score) {
  let allScores = localStorage.getItem("playerScores")
    ? JSON.parse(localStorage.getItem("playerScores"))
    : {};

  if (!allScores[playerName]) {
    allScores[playerName] = {};
  }

  const key = `${level}lvl${difficulty}`;

  if (!allScores[playerName][key]) {
    allScores[playerName][key] = score;
  } 
  
  else if (score > allScores[playerName][key]) {
    allScores[playerName][key] = score;
  }

  localStorage.setItem("playerScores", JSON.stringify(allScores));
}
