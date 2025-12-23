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

    sideRingsBox.appendChild(ring);
  });
}

function enableGrowOnHold() {
  const sideRings = document.querySelectorAll(".side-ring");
  isGrowing = false;
  isShrinking = false;
  sideRings.forEach(ring => {
    
    let interval = null;
    
    let currentWidth = ring.offsetWidth;
    let currentLeft = parseFloat(ring.style.left) || 0;
    
    const startGrowing = () => {
      if (isShrinking) return;
      isGrowing = true;
      document.body.style.userSelect = "none";
      interval = setInterval(() => {
          if (currentWidth < 300) {
          currentWidth += 1;
          currentLeft -= 0.5;
          ring.style.width = currentWidth + "px";
          ring.style.left = currentLeft + "px";
        }
      }, 20);
    };

    const startShrinking = () => {
      if (isGrowing) return;
      isShrinking = true;
      document.body.style.userSelect = "none";
      interval = setInterval(() => {
        if (currentWidth > 10) {
          currentWidth -= 1;
          currentLeft += 0.5;
          ring.style.width = currentWidth + "px";
          ring.style.left = currentLeft + "px";
        }
      }, 20);
    };

    const stop = () => {
      clearInterval(interval);
      interval = null;
      isGrowing = false;
      isShrinking = false;
    };

    ring.addEventListener("mousedown", (e) => {
      if (e.button === 0) startGrowing();
      if (e.button === 2) startShrinking();
    });
    ring.addEventListener("mouseup", stop);
    ring.addEventListener("mouseleave", stop);
    

    ring.addEventListener("contextmenu", (e) => e.preventDefault());
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
  const sideRings = document.querySelectorAll(".side-ring");
  if (!sideRings.length) return 0;

  let totalPercent = 0;
  const tolerance = 5;

  sideRings.forEach((ring, i) => {
    const index = missingIndexes[i];
    const idealWidth = baseSizes[index];
    const currentWidth = ring.offsetWidth;

    const deviation = Math.abs(currentWidth - idealWidth);
    let percent;

    if (deviation <= tolerance) {
      percent = 100;
    } else {
      percent = Math.max(100 - ((deviation - tolerance) / idealWidth * 100), 0);
    }

    totalPercent += percent;
  });

  return (totalPercent / sideRings.length).toFixed(0);
}

document.getElementById("finishBtn").addEventListener("click", () => {
  const accuracy = calculateAccuracy();
  const timeBonus = Math.max(timeLeft, 0);
  const score = Math.round((accuracy / 100) * Math.sqrt(timeBonus / TIME_SEC) * 100);

  const playerName = localStorage.getItem("playerName");
  savePlayerScore(playerName, 3, "n", score);

  showModal(
    "Результат",
    `
    Точность: ${accuracy}%<br>
    Осталось времени: ${timeBonus} сек<br><br>
    <b>Очки: ${score}</b>
    `
  );


  
  clearInterval(timerInterval);
  timerInterval = null;
  if (score > 0) {
    const nextLevelBtn = document.createElement("button");
    nextLevelBtn.textContent = "Следующая сложность";
    nextLevelBtn.style.marginTop = "12px";
    nextLevelBtn.addEventListener("click", () => {
    location.href = "../hard/3h.html";
    });

    const rulesButtonsDiv = overlay.querySelector(".rules-buttons");
    rulesButtonsDiv.appendChild(nextLevelBtn);

    playVictoryAnimation();
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
  enableGrowOnHold();
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

function playVictoryAnimation() {
  let rollingContainer = document.getElementById('rollingRingsContainer');
  if (!rollingContainer) {
    rollingContainer = document.createElement('div');
    rollingContainer.id = 'rollingRingsContainer';
    rollingContainer.className = 'victory-anim';
    document.body.appendChild(rollingContainer);
  }
  rollingContainer.innerHTML = '';

  const rollingSizes = [160,145,130,115,100,85,70,55];
  rollingSizes.forEach((size, i) => {
    const ring = document.createElement("div");
    ring.className = "ring rolling-ring";
    ring.style.width = size + "px";
    ring.style.height = size + "px";
    ring.style.background = colors[i % colors.length];
    ring.style.bottom = "20px";
    rollingContainer.appendChild(ring);
    animateRollingRing(ring, 1.5 + Math.random() * 1);
  });

  const modal = overlay.querySelector('.modal-result');
  if (!modal) return;

  modal.querySelectorAll('.pyramid').forEach(el => el.remove());


  let contentWrap = modal.querySelector('.victory-content-wrap');
  if (!contentWrap) {
    contentWrap = document.createElement('div');
    contentWrap.className = 'victory-content-wrap';
    contentWrap.style.textAlign = 'center';
    contentWrap.style.zIndex = '10';
    contentWrap.style.display = 'flex';
    contentWrap.style.flexDirection = 'column';
    contentWrap.style.alignItems = 'center';
    contentWrap.style.flexShrink = '0';
    
    while (modal.firstChild) {
      contentWrap.appendChild(modal.firstChild);
    }
    modal.appendChild(contentWrap);
  }
  const leftPyramid = createVictoryPyramidSmall("left");
  const rightPyramid = createVictoryPyramidSmall("right");

  modal.style.display = 'flex';
  modal.style.justifyContent = 'center';
  modal.style.alignItems = 'flex-end';
  modal.style.gap = '24px';
  modal.style.padding = '20px';
  modal.style.position = 'relative';

  modal.insertBefore(leftPyramid, contentWrap);
  modal.appendChild(rightPyramid);
}


function animateRollingRing(ring, speed) {
  let dir = 1;
  let x = 0;
  let angle = 0;

  const step = () => {
    const maxX = window.innerWidth - ring.offsetWidth - 10;

    x += dir * speed;
    angle += dir * speed;

    if (x >= maxX) dir = -1;
    if (x <= 0) dir = 1;

    ring.style.left = x + "px";
    ring.style.transform = `rotate(${angle}deg)`;

    requestAnimationFrame(step);
  };

  step();
}


function createVictoryPyramidSmall(side) {
  const pyramid = document.createElement("div");
  pyramid.className = `pyramid victory-pyramid-${side}`;
  pyramid.style.position = 'relative';
  pyramid.style.width = '120px';
  pyramid.style.height = '300px';
  pyramid.style.display = 'flex';
  pyramid.style.flexDirection = 'column-reverse';
  pyramid.style.alignItems = 'center';
  pyramid.style.justifyContent = 'flex-start';
  pyramid.style.flexShrink = '0';

  const peg = document.createElement("div");
  peg.className = "pyramid-peg";
  peg.style.position = 'absolute';
  peg.style.bottom = '0';
  peg.style.width = '10px';
  peg.style.height = '120px';
  peg.style.background = '#9ca3af';
  peg.style.borderRadius = '4px';
  peg.style.zIndex = '1';
  pyramid.appendChild(peg);

  const numRings = 8;
  const maxWidth = 120;
  const minWidth = 40;
  for (let i = 0; i < numRings; i++) {
    const ring = document.createElement("div");
    ring.className = "pyramid-ring";

    const width = maxWidth - i * ((maxWidth - minWidth) / (numRings - 1));
    ring.style.width = width + "px";
    ring.style.height = "12px";
    ring.style.borderRadius = "6px";
    ring.style.background = colors[i % colors.length];
    ring.style.marginTop = "2px";
    ring.style.zIndex = '2';
    ring.style.position = 'relative';
    
    ring.style.setProperty("--jump", (5 + i*2) + "px");
    ring.style.animation = `jump 1.2s ease-in-out ${i*0.08}s infinite`;

    pyramid.appendChild(ring);
  }

  return pyramid;
}