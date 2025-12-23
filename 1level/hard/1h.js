const bottom = document.getElementById("bottom");
const peg = document.getElementById("peg");
const shuffleBtn = document.getElementById("shuffle");
const timerDisplay = document.getElementById("timerDisplay");
const overlay = document.getElementById("overlay");
const modalTitle = document.getElementById("modalTitle");
const modalText = document.getElementById("modalText");
const startOverlay = document.getElementById("startOverlay");
const startBtn = document.getElementById("startBtn");
const playfield = document.getElementById("playfield")


let DEFAULT_SCORE = 10; 
let score = 0;
const scoreDisplay = document.getElementById("scoreDisplay");

let started = false; 
let baseSizes = [160,145,130,115,100,85,70,55];
const color = '#f87171';
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

let ringsData = [];
let totalRings = 0;
let TIME_SEC = 60;
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

function scaleSizes(){
  const zoneWidth = Math.max(300, bottom.clientWidth);
  const total = baseSizes.reduce((a,b)=>a+b,0) + (baseSizes.length-1)*10;
  let k = total > zoneWidth ? zoneWidth / total : 1;
  return baseSizes.map(s => Math.round(s * k));
}

function shuffleArray(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }

function renderRings(){
  bottom.innerHTML = "";
  peg.innerHTML = "";

  const sizes = scaleSizes();
  const idx = sizes.map((_,i)=>i);
  shuffleArray(idx);

  ringsData = idx.map(i => ({ id:i, size:sizes[i], color:color }));
  totalRings = ringsData.length;

  ringsData.forEach(r=>{
    const d = document.createElement("div");
    d.className="ring";
    d.style.width = r.size + "px";
    d.style.height = r.size + "px";
    d.style.background = r.color;
    d.dataset.rid = r.id;

    
    const areaW = playfield.clientWidth - r.size;
    const areaH = playfield.clientHeight - r.size;
    const x = Math.random() * areaW;
    const y = Math.random() * areaH;

    d.style.position = "absolute";
    d.style.left = x + "px";
    d.style.top = y + "px";

    d.addEventListener('click',()=>placeOnPeg(r));
    bottom.appendChild(d);

    animateRing(d);
});
}

function placeOnPeg(r){
  const stack = Array.from(peg.children).map(el=>Number(el.dataset.size));
  const topSize = stack.length ? stack[0] : Infinity;
  if(r.size > topSize){ shake(r); return; }

  const dom = Array.from(bottom.children).find(c=>Number(c.dataset.rid)===r.id);
  if (dom) {
    dom._stopAnim = true; 
    dom.remove();
  }

  const bar = document.createElement('div');
  bar.className='stack-item';
  bar.style.width=r.size+"px";
  bar.style.background=r.color;
  bar.dataset.size=r.size;
  bar.dataset.rid=r.id;
  bar.addEventListener('click',()=>{ if(bar===peg.firstElementChild) removeFromPeg(r,bar); });

  peg.prepend(bar);

  const multiplier = 1 + (timeLeft / TIME_SEC);
  const points = Math.floor(DEFAULT_SCORE * multiplier);
  score += points;
  scoreDisplay.textContent = score;

  setTimeout(checkVictory,50);
}

function removeFromPeg(r, bar){
  bar.remove();

  const d = document.createElement('div');
  d.className = 'ring';
  d.style.width = r.size + "px";
  d.style.height = r.size + "px";
  d.style.background = r.color;
  d.textContent = r.id + 1;
  d.dataset.rid = r.id;

  
  const areaW = bottom.clientWidth - r.size;
  const areaH = bottom.clientHeight - r.size;
  const x = Math.random() * areaW;
  const y = Math.random() * areaH;

  d.style.position = "absolute";
  d.style.left = x + "px";
  d.style.top = y + "px";

  d.addEventListener('click', ()=>placeOnPeg(r));
  bottom.appendChild(d);

  animateRing(d);

  score -= DEFAULT_SCORE * 2;
  if(score < 0) score = 0;
  scoreDisplay.textContent = score;
}

function shake(r){
  const dom = Array.from(bottom.children).find(c=>Number(c.dataset.rid)===r.id);
  if(!dom) return;
  dom.animate([
    {transform:'translateX(0)'},
    {transform:'translateX(-8px)'},
    {transform:'translateX(8px)'},
    {transform:'translateX(0)'}
  ],{duration:260});
}

function checkVictory(){
  const els = Array.from(peg.children);
  if (els.length !== totalRings) return;

  clearInterval(timerInterval);
  timerInterval = null;

  const playerName = localStorage.getItem("playerName");
  savePlayerScore(playerName, 1, "h", score);

  showModal(
    "Игра пройдена",
    `Башня собрана!<br>Очки: ${score}<br>Оставшееся время: ${timeLeft} сек`
  );

  playVictoryAnimation()
}

function showModal(title,text){
  modalTitle.textContent = title;
  modalText.innerHTML = text;
  overlay.classList.add('show');
}

function hideModal(){
  overlay.classList.remove('show');
}


shuffleBtn.addEventListener('click', ()=>{
  renderRings();
  scoreDisplay.textContent = 0;
});

function backToMenu(){ location.href='../../index.html'; }


startOverlay.style.display = "flex";
startBtn.addEventListener("click", () => {
  startOverlay.style.display = "none";
  if (!started) {
    started = true;
    renderRings();
    startTimer();
  }
});

function animateRing(dom) {
    dom._stopAnim = false;

    function move() {
        if (dom._stopAnim) return;

        const size = dom.offsetWidth;
        const areaW = playfield.clientWidth - size;
        const areaH = playfield.clientHeight - size;

        const x = Math.random() * areaW;
        const y = Math.random() * areaH;

        dom.style.transition = "left 1s linear, top 1s linear";
        dom.style.left = x + "px";
        dom.style.top = y + "px";

        setTimeout(move, 1000);
    }
    move();
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
