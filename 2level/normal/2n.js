const bottom = document.getElementById("bottom");
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


let started = false;
let baseSizes = [160,145,130,115,100,85,70,55];
const color = '#f87171';

let dragging = null;
let dragOffsetX = 0;
let dragOffsetY = 0;

let ringsData = [];
let totalRings = 0;
let TIME_SEC = 60;
let timeLeft = TIME_SEC;
let timerInterval = null;

let FALL_SPEED_MIN = 4;
let FALL_SPEED_MAX = 8;

function formatTime(s) {
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

function startTimer() {
  if (timerInterval) return;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = formatTime(timeLeft);
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      showModal("Игра окончена", "Время вышло.");
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


function renderRings() {
  const playfield = document.getElementById("playfield");
  const existingRings = playfield.querySelectorAll('.ring');
  existingRings.forEach(r => r.remove());

  const floatingRings = document.querySelectorAll('body > .ring');
  floatingRings.forEach(r => r.remove());
  const sizes = scaleSizes();
  const idx = sizes.map((_, i) => i);

  ringsData = idx.map(i => ({
    id: i,
    size: sizes[i],
    color: color
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

    resetRing(d, r);
    enableDrag(d, r);

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

  d.style.position = "absolute";
  d.style.zIndex = 1;

  if (!playfield.contains(d)) {
    playfield.appendChild(d);
  }

  const left = Math.random() * (playfield.clientWidth - r.size);
  d.style.left = left + "px";


  const top = -r.size - Math.random() * 150; 
  d.style.top = top + "px";

  d._stopFallFlag = false;
}



function enableDrag(d, r) {
  d.addEventListener("mousedown", (e) => {

    dragging = { el: d, ring: r, fromPeg: false };


    d._stopFallFlag = true;


    const rect = d.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left;
    dragOffsetY = e.clientY - rect.top;

    d.style.position = 'fixed';
    d.style.left = (rect.left) + 'px';
    d.style.top = (rect.top) + 'px';
    d.style.zIndex = 3000;
    d.style.pointerEvents = 'auto';

    e.preventDefault();
  });
}

function enablePegDrag(bar, r) {
  bar.addEventListener("mousedown", (e) => {
    if (bar !== peg.firstElementChild) return;


    bar.remove();

    const d = document.createElement('div');
    d.className = 'ring';
    d.style.width = r.size + 'px';
    d.style.height = r.size + 'px';
    d.style.background = r.color;
    d.dataset.rid = r.id;

    d.style.position = 'fixed';
    d.style.left = (e.clientX - r.size/2) + 'px';
    d.style.top = (e.clientY - r.size/2) + 'px';
    d.style.zIndex = 3000;

    document.body.appendChild(d);

    dragging = { el: d, ring: r, fromPeg: true };

    dragOffsetX = r.size/2;
    dragOffsetY = r.size/2;

    e.preventDefault();
  });
}


document.addEventListener("mousemove", (e) => {
  if (!dragging) return;

  const el = dragging.el;
  const x = e.clientX - dragOffsetX;
  const y = e.clientY - dragOffsetY;

  el.style.left = x + "px";
  el.style.top = y + "px";
});


document.addEventListener("mouseup", (e) => {
  if (!dragging) return;

  const el = dragging.el;
  const r = dragging.ring;
  const fromPeg = dragging.fromPeg;
  dragging = null;

  if (isOverPeg(el)) {
    const stack = Array.from(peg.children).map(el => Number(el.dataset.size));
    const topSize = stack.length ? stack[0] : Infinity;

    if (r.size <= topSize) {
      if (el.parentNode) el.parentNode.removeChild(el);

      placeOnPeg(r);
      return;
    } else {
      el._stopFallFlag = false;
      return;
    }
  }

  if (fromPeg) {
    const playfield = document.getElementById("playfield");
    const rect = playfield.getBoundingClientRect();

    const left = e.clientX - rect.left - dragOffsetX + 450;
    const top = e.clientY - rect.top - dragOffsetY;

    playfield.appendChild(el);

    el.style.position = "fixed";
    el.style.zIndex = 1;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;

    el._stopFallFlag = false;
    startFalling(el, r);
    enableDrag(el, r);

    score -= DEFAULT_SCORE * 2;
    if(score < 0) score = 0;
    scoreDisplay.textContent = score;

    return;
  }

  el._stopFallFlag = false;
});



function isOverPeg(el) {
  const pegRect = peg.getBoundingClientRect();
  const elRect = el.getBoundingClientRect();

  return !(
    elRect.right < pegRect.left ||
    elRect.left > pegRect.right ||
    elRect.bottom < pegRect.top ||
    elRect.top > pegRect.bottom
  );
}


function placeOnPeg(r) {
  const stack = Array.from(peg.children).map(el => Number(el.dataset.size));
  const topSize = stack.length ? stack[0] : Infinity;
  if (r.size > topSize) return;

  const bar = document.createElement("div");
  bar.className = "stack-item";
  bar.style.width = r.size + "px";
  bar.style.background = r.color;
  bar.dataset.size = r.size;
  bar.dataset.rid = r.id;

  peg.prepend(bar);

  enablePegDrag(bar, r);

  const multiplier = 1 + (timeLeft / TIME_SEC);
  const points = Math.floor(DEFAULT_SCORE * multiplier);
  score += points;
  scoreDisplay.textContent = score;

  setTimeout(checkVictory, 50);
}



function checkVictory() {
  const els = Array.from(peg.children);
  if (els.length !== totalRings) return;

  const playerName = localStorage.getItem("playerName");
  savePlayerScore(playerName, 2, "n", score);

  showModal("Игра пройдена", "Башня собрана!");
  clearInterval(timerInterval);
  timerInterval = null;

  const nextLevelBtn = document.createElement("button");
  nextLevelBtn.textContent = "Следующая сложность";
  nextLevelBtn.style.marginTop = "12px";
  nextLevelBtn.addEventListener("click", () => {
    location.href = "../hard/2h.html";
  });

  const rulesButtonsDiv = overlay.querySelector(".rules-buttons");
  rulesButtonsDiv.appendChild(nextLevelBtn);
}




function showModal(title, text) {
  modalTitle.textContent = title;
  modalText.textContent = text;
  overlay.classList.add('show');
}

function hideModal() {
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
