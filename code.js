// Lista de ~50 palabras (puedes personalizar)
const WORDS = [
  'apple','train','car','monkey','painting','house','cat','robot','beach','clock',
  'star','park','tree','key','map','lake','song','television','book','bridge',
  'gun','mountain','window','dog','coffee','boat','telephone','light','cloud','fire',
  'piano','distopyan','city','money','chair','circuit board','ice cream','paper','rain','shadow',
  'jacket','perfume','door','cup','mirror','rope','sandal','museum','flight','cake'
];

const players = [];
let assignments = null; // array of {name, role, word}
let revealIndex = 0;

const $playersList = document.getElementById('playersList');
const $playerName = document.getElementById('playerName');
const $addBtn = document.getElementById('addBtn');
const $clearBtn = document.getElementById('clearBtn');
const $startBtn = document.getElementById('startBtn');
const $screenContent = document.getElementById('screenContent');
const $impostorCount = document.getElementById('impostorCount');

function renderPlayers(){
  $playersList.innerHTML = '';
  players.forEach((p, idx)=>{
    const li = document.createElement('li');
    li.className = 'player';
    li.innerHTML = `<span>${idx+1}. ${escapeHtml(p)}</span><div><button class="small-btn ghost" data-idx="${idx}">Delete</button></div>`;
    $playersList.appendChild(li);
  });
  // wire delete
  $playersList.querySelectorAll('button[data-idx]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const i = Number(btn.dataset.idx);
      players.splice(i,1);
      renderPlayers();
    });
  });
}

function escapeHtml(s){return s.replace(/[&<>"']/g, (c)=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);}

$addBtn.addEventListener('click', ()=>{
  const name = $playerName.value.trim();
  if(!name) return alert('Add a name');
  if(players.length >= 20) return alert('20 players is the limit');
  players.push(name);
  $playerName.value='';
  renderPlayers();
});

$clearBtn.addEventListener('click', ()=>{
  if(!confirm('Delete all players?')) return;
  players.length=0; renderPlayers();
});

// Start game logic
$startBtn.addEventListener('click', ()=>{
  if(players.length < 3) return alert('It is needed at least 3 players to start a game');

  // decidir cantidad de impostores: por defecto 1, si hay 6+ -> 2
  let impostors = players.length >= 6 ? 2 : 1;
  // pero en partidas pequeñas no puede haber 2 impostores
  if(players.length < 4) impostors = 1;

  $impostorCount.textContent = impostors;

  // asignaciones: elegir impostores aleatoriamente
  const indices = shuffle(Array.from({length:players.length}, (_,i)=>i));
  const impostorIndices = new Set(indices.slice(0, impostors));

  // elegir palabra para la partida (la misma para todos los 'no impostores')
  const word = WORDS[Math.floor(Math.random()*WORDS.length)];

  assignments = players.map((name, i)=>({name, role: impostorIndices.has(i) ? 'IMPOSTER' : 'CREW MEMBER', word}));
  // mezclar el orden de revelado para que no sea siempre el mismo? usare el orden creado
  revealIndex = 0;

  showPassDevice();
});

function showPassDevice(){
  const current = assignments[revealIndex];
  $screenContent.innerHTML = `
    <div style="text-align:center">
      <div class="hint">Pass the cellphone to</div>
      <div class="big">${escapeHtml(current.name)}</div>
      <div style="height:10px"></div>
      <button id="revealBtn">Show role</button>
    </div>
  `;
  document.getElementById('revealBtn').addEventListener('click', ()=>revealForCurrent());
}

function revealForCurrent(){
  const current = assignments[revealIndex];
  if(current.role === 'IMPOSTER'){
    $screenContent.innerHTML = `
      <div style="text-align:center">
        <div class="role impostor">IMPOSTER</div>
        <div class="small">You have to guess the word!</div>
        <div style="height:12px"></div>
        <button id="okBtn">OK</button>
      </div>
    `;
    document.getElementById('okBtn').addEventListener('click', ()=>nextReveal());
  } else {
    $screenContent.innerHTML = `
      <div style="text-align:center">
        <div class="small">Your role is</div>
        <div class="role">CREW MEMBER</div>
        <div style="height:8px"></div>
        <div class="small">Word:</div>
        <div class="word">${escapeHtml(current.word)}</div>
        <div style="height:12px"></div>
        <button id="okBtn">OK</button>
      </div>
    `;
    document.getElementById('okBtn').addEventListener('click', ()=>nextReveal());
  }
}

function nextReveal(){
  revealIndex++;
  if(revealIndex >= assignments.length){
    // todos vieron
    $screenContent.innerHTML = `
      <div style="text-align:center">
        <div class="big">Game ready</div>
        <div class="small">All players have received their roles. ${players[Math.floor(Math.random() * players.length)]} starts.</div>
        <div style="height:12px"></div>
        <div class="row center">
          <button id="restartBtn">Reset</button>
          <button id="showSummary" class="ghost">Show results</button>
        </div>
      </div>
    `;
    document.getElementById('restartBtn').addEventListener('click', ()=>{
      assignments = null; revealIndex = 0; $screenContent.innerHTML = `<div class="hint">Add at least 3 players to start a game.</div>`;
    });
    document.getElementById('showSummary').addEventListener('click', ()=>showSummary());
  } else {
    showPassDevice();
  }
}

function showSummary(){
  const rows = assignments.map(a=>`<li class="player">${escapeHtml(a.name)} <strong>${a.role==='IMPOSTER'? '<span style="color:var(--danger)">IMPOSTER</span>' : '<span style="color:var(--accent)">CREW MEMBER</span>'}</strong></li>`).join('');
  $screenContent.innerHTML = `
    <div style="width:100%">
      <div class="small">Summary</div>
      <ul style="padding:0;margin-top:8px">${rows}</ul>
      <div style="height:10px"></div>
      <div class="row center"><button id="backBtn" class="ghost">Back</button></div>
    </div>
  `;
  document.getElementById('backBtn').addEventListener('click', ()=>{
    $screenContent.innerHTML = `
      <div style="text-align:center">
        <div class="big">Game ready</div>
        <div class="small">All players have received their roles. ${players[Math.floor(Math.random() * players.length)]} starts..</div>
        <div style="height:12px"></div>
        <div class="row center">
          <button id="restartBtn">Reset</button>
          <button id="showSummary" class="ghost">Show results</button>
        </div>
      </div>
    `;
    document.getElementById('restartBtn').addEventListener('click', ()=>{
      assignments = null; revealIndex = 0; $screenContent.innerHTML = `<div class="hint">Add at least 3 players to start a game.</div>`;
    });
    document.getElementById('showSummary').addEventListener('click', ()=>showSummary());
  });
}

// Utilities
function shuffle(a){
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// keyboard: enter to add
$playerName.addEventListener('keydown', (e)=>{ if(e.key==='Enter') $addBtn.click(); });

// initial render
renderPlayers();
