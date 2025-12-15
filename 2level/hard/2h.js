const peg = document.getElementById("peg");
const timerDisplay = document.getElementById("timerDisplay");
const overlay = document.getElementById("overlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");

let DEFAULT_SCORE = 10; 
let score = 0;
const scoreDisplay = document.getElementById("scoreDisplay");
const activeNumbers = new Set();

let started = false;
let baseSizes = [160,145,130,115,100,85,70,55];
const colors = [
  '#f87171',
  '#fb923c',
  '#fde047',
  '#4ade80',
  '#67e8f9',
  '#60a5fa',
  '#a78bfa',
  '#f472b6'
];

let dragging = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let ringsData = [];
let totalRings = 0;
let TIME_SEC = 60;
let timeLeft = TIME_SEC;
let timerInterval = null;

let FALL_SPEED_MIN = 2;
let FALL_SPEED_MAX = FALL_SPEED_MIN + 2;

function formatTime(s) {
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
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

function scaleSizes() {
  const playfield = document.getElementById('playfield');
  const zoneWidth = Math.max(400, playfield.clientWidth);

  const total = baseSizes.reduce((a,b)=>a+b,0) + (baseSizes.length-1)*10;
  let k = total > zoneWidth ? zoneWidth / total : 1;
  k = k * 1.25;

  return baseSizes.map(s => Math.round(s * k));
}

function getUniqueNumber() {
  const pool = [];

  for (let i = 1; i <= 9; i++) {
    if (!activeNumbers.has(i)) pool.push(i);
  }

  if (pool.length === 0) return null;

  const num = pool[Math.floor(Math.random() * pool.length)];
  activeNumbers.add(num);
  return num;
}


function renderRings() {
  const playfield = document.getElementById("playfield");
  const existingRings = playfield.querySelectorAll('.ring');
  existingRings.forEach(r => r.remove());

  const floatingRings = document.querySelectorAll('body > .ring');
  floatingRings.forEach(r => r.remove());
  const sizes = scaleSizes();
  const idx = sizes.map((_, i) => i);
  const numbers = [...Array(baseSizes.length).keys()]
  .map(n => n + 1)
  .sort(() => Math.random() - 0.5);
  
  ringsData = idx.map((i, index) => ({
    id: i,
    size: sizes[i],
    color: colors[i],
    number: numbers[index]
  }));

  totalRings = ringsData.length;

  ringsData.forEach(r => {
    const d = document.createElement("div");
    d.className = "ring";
    d.style.width = r.size + "px";
    d.style.height = r.size + "px";
    d.style.background = r.color;
    d.dataset.rid = r.id;
    d.style.position = "absolute";
    const label = document.createElement("span");
    label.className = "ring-number";
    const number = getUniqueNumber();
    if (number === null) return;

    label.textContent = number;
    d.appendChild(label);

    resetRing(d, r);

    d._stopFallFlag = false;

    playfield.appendChild(d);

    let fallSpeed = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);

    function fall() {
  if (!d._stopFallFlag) {
    let pos = parseFloat(d.style.top);
    pos += fallSpeed;
    d.style.top = pos + "px";

    const bottomLimit = playfield.clientHeight;

    if (pos >= bottomLimit) {
      resetRing(d, r);
    }
  }

  requestAnimationFrame(fall);
  }

  requestAnimationFrame(fall);

  });
}

function resetRing(d, r) {
  const playfield = document.getElementById("playfield");

  const oldNumEl = d.querySelector(".ring-number");
  if (oldNumEl) {
    activeNumbers.delete(Number(oldNumEl.textContent));
  }

  d.style.position = "absolute";
  d.style.zIndex = 1;

  if (!playfield.contains(d)) {
    playfield.appendChild(d);
  }

  const left = Math.random() * (playfield.clientWidth - r.size);
  d.style.left = left + "px";

  const top = -r.size - Math.random() * 150;
  d.style.top = top + "px";

  const newNum = getUniqueNumber();
  if (newNum !== null) {
    oldNumEl.textContent = newNum;
  }

  d._stopFallFlag = false;
}


function addRingToPeg(domRing, r) {
  const stack = Array.from(peg.children).map(el => Number(el.dataset.size));
  const topSize = stack.length ? stack[0] : Infinity;

  if (r.size >= topSize) return;

  domRing.remove();

  const bar = document.createElement("div");
  bar.className = "stack-item";
  bar.style.width = r.size + "px";
  bar.style.background = r.color;
  bar.dataset.size = r.size;
  bar.dataset.rid = r.id;

  peg.prepend(bar);

  checkVictory();
}


function removeTopRing() {
  const top = peg.firstElementChild;
  if (!top) return;

  top.remove();

  score -= DEFAULT_SCORE * 2;
  if(score < 0) score = 0;
  scoreDisplay.textContent = score;
}


function addRingByNumber(num) {
  const playfield = document.getElementById("playfield");

  const ring = Array.from(playfield.querySelectorAll(".ring"))
    .find(r => r.querySelector(".ring-number")?.textContent == num);

  if (!ring) return;

  const rid = Number(ring.dataset.rid);
  const r = ringsData.find(x => x.id === rid);
  if (!r) return;

  const multiplier = 1 + (timeLeft / TIME_SEC);
  const points = Math.floor(DEFAULT_SCORE * multiplier);
  score += points;
  scoreDisplay.textContent = score;
  addRingToPeg(ring, r);
}

document.addEventListener("keydown", (e) => {
  if (!started) return;

  const key = e.key;

  if (key === "0") {
    removeTopRing();
    return;
  }

  if (!/^[1-9]$/.test(key)) return;

  addRingByNumber(Number(key));
});

function checkVictory() {
  const els = Array.from(peg.children);
  if (els.length !== totalRings) return;

  const playerName = localStorage.getItem("playerName") || "Игрок";
  savePlayerScore(playerName, 2, "h", score)

  showModal(
    "Игра пройдена",
    `Башня собрана!<br>Очки: ${score}<br>Оставшееся время: ${timeLeft} сек`
  );
  clearInterval(timerInterval);
  timerInterval = null;
}


function showModal(title,text){
  modalTitle.textContent = title;
  modalText.innerHTML = text;
  overlay.classList.add('show');
}

function hideModal(){
  overlay.classList.remove('show');
}

function backToMenu() {
  location.href = '../../index.html';
}



startOverlay.style.display = "flex";
startBtn.addEventListener("click", () => {
  startOverlay.style.display = "none";
  if (!started) {
    started = true;
    renderRings();
    startTimer();
  }
});

function startFalling(el, r) {
  let playfield = document.getElementById("playfield");
  let fallSpeed = FALL_SPEED_MIN + Math.random() * (FALL_SPEED_MAX - FALL_SPEED_MIN);


  function fall() {
    if (!el._stopFallFlag) {
      let pos = parseFloat(el.style.top);
      pos += fallSpeed;
      el.style.top = pos + "px";

      const bottomLimit = playfield.clientHeight;

      if (pos >= bottomLimit) {
        resetRing(el, r);
      }
    }
    requestAnimationFrame(fall);
  }

  requestAnimationFrame(fall);
}

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
