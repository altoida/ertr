// Client State
let token = localStorage.getItem('jwt_token') || null;
let ws = null;
let username = '';
let currentClass = 'swordsman';
let inventory = [];
let equipped = {};
let selectedItem = null;
let partyMembers = [];
let enemies = [];
let currentFloor = 1;
let highestFloor = 1;
let quests = [];
let otherCityPlayers = [];
let otherStands = [];

// Map & Zones
const CITY_WIDTH = 3200;
const CITY_HEIGHT = 2400;

let localPlayer = {
  x: 400, y: 1800, speed: 2.6, dir: 'down',
  hp: 100, maxHp: 100, mana: 100, maxMana: 100,
  gold: 0, resourceGears: 0, level: 1, xp: 0,
  action: 'none', actionTimer: 0, zone: 'city'
};
let potions = { hp: 0, mp: 0 }; // Player potion inventory
let currentBiome = 'grassland';  // Current floor biome
let aoeWarnings = [];            // Active AoE red zones
let floorAnnounce = null;        // { text, timer } for big floor text

const NPCs = {
  forge:        { name: 'Forge Master',    x: 800,  y: 800,  r: 60, modal: 'modal-forge', color: { body: '#ff4444', gear: '#883333' } },
  merchant:     { name: 'Merchant',        x: 600,  y: 1200, r: 60, modal: 'modal-merchant', color: { body: '#dfb257', gear: '#bf3dff' } },
  pawn:         { name: 'Pawn Shop',       x: 1000, y: 1200, r: 60, modal: 'modal-pawn', color: { body: '#2ecc71', gear: '#225522' } },
  blacksmith:   { name: 'Blacksmith',      x: 1400, y: 1200, r: 60, modal: 'modal-blacksmith', color: { body: '#ff6600', gear: '#333333' } },
  tinker:       { name: 'Amulet Tinker',   x: 600,  y: 1600, r: 60, modal: 'modal-tinker', color: { body: '#00f0ff', gear: '#0055aa' } },
  potions:      { name: 'Potion Vendor',   x: 1000, y: 1600, r: 60, modal: 'modal-potions', color: { body: '#bf3dff', gear: '#3399ff' } },
  relics:       { name: 'Relic Dealer',    x: 1400, y: 1600, r: 60, modal: 'modal-relics', color: { body: '#a39ca9', gear: '#ffffff' } },
  quests:       { name: 'Quest Board',     x: 1000, y: 800,  r: 60, modal: 'modal-quests', color: null },
  transmuter:   { name: 'Transmuter',      x: 1400, y: 800,  r: 60, modal: 'modal-transmuter', color: { body: '#ffffff', gear: '#00f0ff' } },
  tower:        { name: 'Clockwork Tower', x: 2700, y: 580,  r: 80, modal: null }
};

// Tower interior pads (set inside the tower lobby)
const TOWER_PADS = {
  party_A: { label: 'Party A',   x: 400,  y: 600, color: '#00f0ff' },
  party_B: { label: 'Party B',   x: 800,  y: 600, color: '#00f0ff' },
  party_C: { label: 'Party C',   x: 1200, y: 600, color: '#00f0ff' },
  quick:   { label: 'Solo Run',  x: 800,  y: 400, color: '#ff3366' }
};

// SVG Assets
const SVG_TEMPLATES = {
  sword: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M12 1h3v3h-3zm-2 2h3v3h-3zm-2 2h3v3H8zm-2 2h3v3H6zm-2 2h3v3H4zm-2 2h2v2H2zm-1 2h2v1H1zm0-2h1v1H1z" fill="#dfb257"/><path d="M2 14h2v2H2z" fill="#8d5c23"/></svg>`,
  bow: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M6 1h4v2H6zm3 2h3v2H9zm1 2h2v6h-2zm-1 6h3v2H9zm-3 2h4v2H6zm-3-8h2v2H3zm0 4h2v2H3z" fill="#2ecc71"/><path d="M7 8h4v1H7z" fill="#fff"/></svg>`,
  staff: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M12 1h3v3h-3zm-1 3h2v2h-2zM3 12h2v2H3zm-2 2h2v2H1z" fill="#bf3dff"/><path d="M4 11l7-7 1 1-7 7z" fill="#8d5c23"/></svg>`,
  healer_staff: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M6 2h4v2H6zm-2 2h8v2H4zm3 2h2v8H7z" fill="#2ecc71"/><path d="M3 1h1v1H3zm9 0h1v1h-1z" fill="#fff"/></svg>`,
  armor: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M2 2h12v4c0 4-3 7-6 8-3-1-6-4-6-8z" fill="#8e9eab"/><path d="M4 4h8v2H4z" fill="#58636d"/></svg>`,
  head: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M3 4h10v4c0 3-2 5-5 5S3 11 3 8z" fill="#8e9eab"/><path d="M5 6h6v2H5z" fill="#58636d"/></svg>`,
  legs: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M4 2h8v4H4zm0 4h3v8H4zm5 0h3v8H9z" fill="#8e9eab"/></svg>`,
  boots: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M3 8h4v6H3zm6 0h4v6H9z" fill="#58636d"/><path d="M2 14h5v2H2zm7 0h5v2H9z" fill="#333"/></svg>`,
  accessory: `<svg viewBox="0 0 16 16" width="100%" height="100%"><path d="M5 5h6v6H5z" fill="#dfb257"/><path d="M7 7h2v2H7z" fill="#00f0ff"/><path d="M4 4h1v1H4zm7 0h1v1h-1zm0 7h1v1h-1zm-7 0h1v1H4z" fill="#dfb257"/></svg>`
};
const canvas = document.getElementById('combat-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

function resizeCanvas() { canvas.width = canvas.parentElement.clientWidth; canvas.height = canvas.parentElement.clientHeight; }
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function toggleInventory() {
  const modal = document.getElementById('inventory-modal');
  if (modal.style.display === 'none') {
    modal.style.display = 'block';
  } else {
    modal.style.display = 'none';
  }
}

document.getElementById('btn-toggle-inventory').addEventListener('click', toggleInventory);
document.getElementById('btn-close-inventory').addEventListener('click', () => { document.getElementById('inventory-modal').style.display = 'none'; });

const keys = {};
let spacePressed = false;

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
    keys[key] = true;
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) e.preventDefault();
  }
  if (e.key === ' ') {
    e.preventDefault();
    if (!spacePressed) handleInteraction();
    spacePressed = true;
  }
  if (e.key === '1') castSkill(0);
  if (e.key === '2') castSkill(1);
  if (e.key === '3') castSkill(2);
  // E = parry attempt
  if (e.key === 'e' || e.key === 'E') {
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'parry_attempt' }));
  }
  // Q = health potion, R = mana potion
  if (e.key === 'q' || e.key === 'Q') usePotion('hp');
  if (e.key === 'r' || e.key === 'R') usePotion('mp');
  // I = inventory toggle
  if (e.key === 'i' || e.key === 'I') toggleInventory();
});
window.addEventListener('keyup', e => { 
  keys[e.key.toLowerCase()] = false; 
  if (e.key === ' ') spacePressed = false;
});

// ═══════════════════════════════════════════════════════
// MOBILE CONTROLS — Virtual Joystick + Slash/Parry Buttons
// ═══════════════════════════════════════════════════════

// Prevent context menus and long-press selection on mobile
window.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('touchstart', e => {
  // Only prevent default on non-input elements to stop text selection / callout
  if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'SELECT') {
    e.preventDefault();
  }
}, { passive: false });
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

// Detect touch device and show mobile controls
function isTouchDevice() {
  return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
}
if (isTouchDevice()) {
  const mc = document.getElementById('mobile-controls');
  if (mc) mc.style.display = 'block';
}

// ── Joystick state ──
const joystick = {
  active: false,
  touchId: null,
  originX: 0,
  originY: 0,
  dx: 0,
  dy: 0,
  maxRadius: 44
};

const joystickBase = document.getElementById('joystick-base');
const joystickKnob = document.getElementById('joystick-knob');
const joystickZone = document.getElementById('joystick-zone');

function updateKnobPosition() {
  if (!joystickKnob) return;
  const clampedX = Math.max(-joystick.maxRadius, Math.min(joystick.maxRadius, joystick.dx));
  const clampedY = Math.max(-joystick.maxRadius, Math.min(joystick.maxRadius, joystick.dy));
  joystickKnob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;
  if (joystickBase) joystickBase.classList.toggle('active', joystick.active);
}

if (joystickZone) {
  joystickZone.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joystick.active) return;
    const t = e.changedTouches[0];
    const rect = joystickBase.getBoundingClientRect();
    joystick.active = true;
    joystick.touchId = t.identifier;
    joystick.originX = rect.left + rect.width / 2;
    joystick.originY = rect.top + rect.height / 2;
    joystick.dx = 0; joystick.dy = 0;
    updateKnobPosition();
  }, { passive: false });

  joystickZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      const t = e.changedTouches[i];
      if (t.identifier !== joystick.touchId) continue;
      joystick.dx = t.clientX - joystick.originX;
      joystick.dy = t.clientY - joystick.originY;
      updateKnobPosition();
    }
  }, { passive: false });

  const endJoystick = e => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joystick.touchId) {
        joystick.active = false;
        joystick.touchId = null;
        joystick.dx = 0; joystick.dy = 0;
        updateKnobPosition();
      }
    }
  };
  joystickZone.addEventListener('touchend', endJoystick, { passive: false });
  joystickZone.addEventListener('touchcancel', endJoystick, { passive: false });
}

// Inject joystick input into the existing keys system each game tick
function applyJoystickToKeys() {
  if (!joystick.active) return;
  const threshold = 10;
  keys['mobile_up']    = joystick.dy < -threshold;
  keys['mobile_down']  = joystick.dy >  threshold;
  keys['mobile_left']  = joystick.dx < -threshold;
  keys['mobile_right'] = joystick.dx >  threshold;
}

// ── Mobile Slash & Parry Buttons ──
const mobileSlashBtn = document.getElementById('mobile-slash-btn');
const mobileParryBtn = document.getElementById('mobile-parry-btn');

if (mobileSlashBtn) {
  mobileSlashBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'melee_attack' }));
    // Visual flash on canvas
    floatingTexts.push({ x: canvas.width * 0.7, y: canvas.height * 0.45, text: '⚔ SLASH!', color: '#ff6644', opacity: 1.5 });
  }, { passive: false });
}

if (mobileParryBtn) {
  mobileParryBtn.addEventListener('touchstart', e => {
    e.preventDefault();
    if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'parry_attempt' }));
  }, { passive: false });
}

// Helper to show/hide the mobile parry button (called from websocket parry_window event)
function showMobileParry(show) {
  if (!mobileParryBtn) return;
  mobileParryBtn.style.display = show ? 'flex' : 'none';
}

let particles = [];
let floatingTexts = [];
let walkTimer = 0;
let lastMoveSent = 0;
let cameraX = 0, cameraY = 0;
let canInteractWithNpc = null;
let recentlyChangedZone = false;
let prevHp = 100; // Track HP to detect incoming damage for flash effect
let damageFlash = 0; // Countdown for red screen flash on hit
let dropNotifs = []; // World-space coin drop animations
const ARENA_W = 800, ARENA_H = 600;

function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { 
  document.getElementById(id).style.display = 'none'; 
  if ((id === 'modal-lobby' || id === 'modal-quick') && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'leave_party' }));
  }
}

// Auth logic
const authScreen = document.getElementById('auth-screen');
const gameContainer = document.getElementById('game-container');
document.getElementById('toggle-to-register').onclick = () => { document.getElementById('login-form').style.display = 'none'; document.getElementById('register-form').style.display = 'block'; };
document.getElementById('toggle-to-login').onclick = () => { document.getElementById('register-form').style.display = 'none'; document.getElementById('login-form').style.display = 'block'; };

document.getElementById('btn-login-submit').onclick = async () => {
  const res = await fetch('https://thin-tables-nail.loca.lt/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: document.getElementById('login-username').value, password: document.getElementById('login-password').value }) });
  const data = await res.json();
  if (res.ok) { token = data.token; username = data.username; localStorage.setItem('jwt_token', token); connectWebSocket(); }
  else document.getElementById('auth-error-msg').textContent = data.error;
};

document.getElementById('btn-register-submit').onclick = async () => {
  const res = await fetch('https://thin-tables-nail.loca.lt/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: document.getElementById('reg-username').value, password: document.getElementById('reg-password').value, charClass: document.getElementById('reg-class').value }) });
  const data = await res.json();
  if (res.ok) { token = data.token; username = data.username; localStorage.setItem('jwt_token', token); connectWebSocket(); }
  else document.getElementById('auth-error-msg').textContent = data.error;
};

document.getElementById('btn-disconnect').onclick = () => {
  localStorage.removeItem('jwt_token'); token = null; username = '';
  if (ws) ws.close();
  gameContainer.classList.remove('active'); authScreen.style.opacity = '1'; authScreen.style.pointerEvents = 'all';
};

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  ws = new WebSocket(`wss://thin-tables-nail.loca.lt`);
  ws.onopen = () => ws.send(JSON.stringify({ type: 'auth', token }));
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    switch(msg.type) {
      case 'auth_success':
        authScreen.style.opacity = '0'; authScreen.style.pointerEvents = 'none';
        gameContainer.classList.add('active'); resizeCanvas();
        username = msg.player.username; currentClass = msg.player.class;
        Object.assign(localPlayer, msg.player);
        if (!localPlayer.zone) localPlayer.zone = 'city';
        quests = msg.quests || [];
        updateHUD(msg.player, msg.upgrades, msg.highestFloor, msg.xp);
        updateInventory(msg.inventory, msg.equipped);
        setupSkillBar(currentClass);
        renderQuests();
        break;

      case 'join_success':
        if (msg.partyId === 'quick') openModal('modal-quick');
        else openModal('modal-lobby');
        break;

      case 'party_lobby_update':
        if (msg.partyId === 'quick') return;
        const isHost = msg.host === username;
        document.getElementById('lobby-host-controls').style.display = isHost ? 'block' : 'none';
        document.getElementById('btn-lobby-climb-start').style.display = isHost ? 'block' : 'none';
        document.getElementById('lobby-waiting-msg').style.display = isHost ? 'none' : 'block';
        document.getElementById('lobby-guest-floor-display').style.display = isHost ? 'none' : 'block';
        
        if (!isHost) {
           document.getElementById('lobby-guest-floor').innerText = 'Floor ' + msg.floor;
        } else {
           document.getElementById('lobby-max-players').value = msg.maxPlayers;
        }

        const pList = document.getElementById('modal-party-list');
        pList.innerHTML = '';
        msg.players.forEach(p => {
          const div = document.createElement('div');
          div.className = 'party-member';
          div.innerHTML = `<span><span style="color:var(--cyan);">${p === msg.host ? '⭐ ' : ''}</span>${p}</span>`;
          pList.appendChild(div);
        });
        break;

      case 'party_update':
        currentFloor = msg.party.floor;
        partyMembers = msg.party.members;
        const me = partyMembers.find(m => m.username === username);
        if (me) {
          localPlayer.hp = me.hp; localPlayer.maxHp = me.maxHp;
          localPlayer.mana = me.mana; localPlayer.maxMana = me.maxMana;
          if (localPlayer.zone !== me.zone) {
            localPlayer.zone = me.zone;
            localPlayer.x = me.x || 400;
            localPlayer.y = me.y || 300;
          }
          updateBars();
        }
        updateFloorSelectors(highestFloor);
        if (msg.party.inCombat) {
          closeModal('modal-lobby'); closeModal('modal-quick');
          enableSkillButtons(true);
        } else {
          enableSkillButtons(false); enemies = [];
        }
        break;

      case 'city_tick':
        otherCityPlayers = msg.players.filter(p => p.username !== username);
        otherStands = msg.stands;
        break;

      case 'physics_tick':
        enemies = msg.enemies;
        msg.members.forEach(m => {
          if (m.username === username) {
            // Detect damage taken for screen flash
            if (m.hp < prevHp) {
              damageFlash = 12;
              const lostHp = prevHp - m.hp;
              // Floating "-X" on the local player in screen-space
              floatingTexts.push({ x: canvas.width / 2 + (Math.random()*30-15), y: canvas.height / 2 - 60, text: `-${Math.round(lostHp)}`, color: '#ff3366', opacity: 1 });
            }
            prevHp = m.hp;
            localPlayer.hp = m.hp; localPlayer.maxHp = m.maxHp;
            localPlayer.mana = m.mana; localPlayer.maxMana = m.maxMana;
            updateBars();
            if (m.action !== 'none') { localPlayer.action = m.action; localPlayer.actionTimer = 10; }
          } else {
            const match = partyMembers.find(p => p.username === m.username);
            if (match) { match.x = m.x; match.y = m.y; match.dir = m.dir; match.hp = m.hp; match.action = m.action; }
          }
        });
        // Spawn coin bursts on newly dead enemies
        msg.enemies.forEach(e => {
          if (e.hp <= 0) {
            const wasAlive = enemies.find(old => old.id === e.id && old.hp > 0);
            if (wasAlive) {
              // Burst gold/gear coins
              for (let i = 0; i < 10; i++) {
                const angle = (Math.PI * 2 / 10) * i;
                dropNotifs.push({ x: e.x, y: e.y, vx: Math.cos(angle) * 2.5, vy: Math.sin(angle) * 2.5 - 2, type: i % 3 === 0 ? 'gear' : 'gold', life: 40, maxLife: 40 });
              }
            }
          }
        });
        break;

      case 'combat_start':
        addLog(msg.log); enemies = msg.enemies; prevHp = localPlayer.hp; dropNotifs = [];
        if (msg.biome) currentBiome = msg.biome;
        const panel = document.getElementById('arena-panel');
        panel.classList.add('shake'); setTimeout(() => panel.classList.remove('shake'), 250);
        // Big floor announcement text
        floorAnnounce = { text: `FLOOR ${currentFloor}`, sub: msg.biome ? msg.biome.toUpperCase() : '', timer: 120 };
        break;

      case 'enemy_windup': {
        // Show parry hint
        const hint = document.getElementById('parry-hint');
        if (hint) { 
          hint.style.display = 'block'; 
          showMobileParry(true);
          setTimeout(() => { 
            hint.style.display = 'none'; 
            showMobileParry(false);
          }, 2200); 
        }
        break;
      }

      case 'aoe_warning':
        aoeWarnings.push({ x: msg.x, y: msg.y, r: msg.r || 90, timer: msg.delay || 40, maxTimer: msg.delay || 40 });
        break;

      case 'parry_success': {
        // Flash screen cyan + floating COUNTER!
        damageFlash = -8; // negative = cyan flash
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 70, text: '⚡ COUNTER!', color: '#00f0ff', opacity: 2 });
        document.getElementById('parry-hint').style.display = 'none';
        showMobileParry(false);
        break;
      }
      case 'combat_hit': addLog(msg.log); spawnCombatNumbers(msg); break;
      case 'combat_rewards':
        addLog(`Rewards: +${msg.gold}G, +${msg.gears} Gears, +${msg.xp} XP.`);
        if (msg.loot) addLog(`Loot: ${msg.loot.name}`);
        if (msg.potionDrops) {
          if (msg.potionDrops.hp) { potions.hp += msg.potionDrops.hp; addLog(`Found ${msg.potionDrops.hp} HP Potion(s)!`); }
          if (msg.potionDrops.mp) { potions.mp += msg.potionDrops.mp; addLog(`Found ${msg.potionDrops.mp} MP Potion(s)!`); }
        }
        updateInventory(msg.player.inventory, equipped);
        localPlayer.gold = msg.player.gold; localPlayer.level = msg.player.level; localPlayer.resourceGears = msg.player.resourceGears;
        quests = msg.player.quests; renderQuests();
        document.getElementById('header-gold').textContent = localPlayer.gold;
        document.getElementById('header-gears').textContent = localPlayer.resourceGears;
        document.getElementById('hud-level').textContent = `LV ${localPlayer.level}`;
        document.getElementById('hud-xp').textContent = `XP: ${msg.player.xp}/${localPlayer.level * 150}`;
        // Show reward banner as floating text
        floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 80, text: `+${msg.gold}G  +${msg.gears} ⚙  +${msg.xp}XP`, color: '#dfb257', opacity: 2 });
        if (msg.loot) floatingTexts.push({ x: canvas.width/2, y: canvas.height/2 - 52, text: `✦ ${msg.loot.name}`, color: '#bf3dff', opacity: 2 });
        break;
      case 'combat_end':
        addLog(msg.log);
        if (msg.result === 'victory') particles.push({ type: 'wave', x: canvas.width/2, y: canvas.height/2, r: 0, maxR: 500, color: 'rgba(223, 178, 87, 0.4)' });
        else { localPlayer.x = 400; localPlayer.y = 1800; localPlayer.zone = 'city'; addLog("Died! Sent back to the City Spawn."); recentlyChangedZone = true; setTimeout(()=>recentlyChangedZone=false, 1000); }
        break;
      case 'stats_update':
        localPlayer.gold = msg.player.gold; localPlayer.resourceGears = msg.player.resourceGears || 0;
        document.getElementById('header-gold').textContent = localPlayer.gold;
        document.getElementById('header-gears').textContent = localPlayer.resourceGears;
        updateHUD(msg.player); updateInventory(inventory, msg.equipped);
        break;
      case 'upgrade_success': addLog(`Upgrade Purchased!`); updateHUD(msg.player, msg.upgrades); break;
      case 'notification': addLog(msg.message); break;
      case 'error': addLog(`Error: ${msg.message}`); break;
    }
  };
}

function addLog(text) {
  const logBox = document.getElementById('log-box');
  if (!logBox) return; // Log panel removed — events shown as canvas floating numbers
  const div = document.createElement('div'); div.textContent = text;
  logBox.appendChild(div); logBox.scrollTop = logBox.scrollHeight;
}

function updateBars() {
  document.getElementById('hp-ratio').textContent = `${Math.floor(localPlayer.hp)}/${localPlayer.maxHp}`;
  document.getElementById('hp-bar-fill').style.width = `${(localPlayer.hp / localPlayer.maxHp) * 100}%`;
  if (currentClass === 'mage') {
    document.getElementById('mp-ratio').textContent = `${Math.floor(localPlayer.mana)}/${localPlayer.maxMana}`;
    document.getElementById('mp-bar-fill').style.width = `${(localPlayer.mana / localPlayer.maxMana) * 100}%`;
  }
}

function updateHUD(player, upgrades = {}, nextFloor = 1, xp = 0) {
  highestFloor = nextFloor || highestFloor;
  document.getElementById('hud-username').textContent = player.username;
  document.getElementById('hud-class').textContent = player.class;
  document.getElementById('header-gold').textContent = player.gold;
  document.getElementById('header-gears').textContent = player.resourceGears || 0;
  document.getElementById('stat-atk').textContent = player.atk;
  document.getElementById('stat-def').textContent = player.def;
  document.getElementById('stat-heal').textContent = player.class === 'healer' ? player.healing : (player.class === 'swordsman' ? '10% Parry' : 'N/A');
  document.getElementById('stat-maxfloor').textContent = highestFloor;
  document.getElementById('hud-level').textContent = `LV ${player.level || localPlayer.level}`;
  document.getElementById('hud-xp').textContent = `XP: ${xp}/${(player.level || localPlayer.level) * 150}`;
  if (currentClass === 'mage') document.getElementById('mana-container').style.display = 'block';
  updateBars();
  updateFloorSelectors(highestFloor);
}

function updateFloorSelectors(maxFloor) {
  const selectors = [document.getElementById('lobby-floor-select'), document.getElementById('quick-floor-select')];
  selectors.forEach(sel => {
    if (!sel) return;
    sel.innerHTML = '<option value="1">Floor 1</option>';
    for (let i = 10; i <= maxFloor; i += 10) { sel.innerHTML += `<option value="${i}">Floor ${i}</option>`; }
  });
}

function changeZone(newZone, rx, ry) {
  if (recentlyChangedZone) return;
  recentlyChangedZone = true;
  localPlayer.zone = newZone;
  localPlayer.x = rx;
  localPlayer.y = ry;
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'change_zone', targetZone: newZone, x: rx, y: ry }));
  }
  setTimeout(() => recentlyChangedZone = false, 1000);
}

function handleInteraction() {
  if (canInteractWithNpc && localPlayer.zone.startsWith('interior_')) {
    openModal(canInteractWithNpc.modal);
  }
}

function processSpatialTriggers() {
  canInteractWithNpc = null;
  if (localPlayer.zone === 'city') {
    // Detect shop/building doors
    Object.keys(NPCs).forEach(key => {
      const npc = NPCs[key];
      const dist = Math.hypot(localPlayer.x - npc.x, localPlayer.y - (npc.y + 10));
      if (dist < 50 && !recentlyChangedZone) {
        if (key === 'tower') {
          changeZone('interior_tower', 800, 1080);
        } else {
          changeZone('interior_' + key, 600, 780);
        }
      }
    });

  } else if (localPlayer.zone === 'interior_tower') {
    // Exit mat at bottom center (800, 1120) of 1600x1200 room
    if (localPlayer.y > 1080 && localPlayer.x > 720 && localPlayer.x < 880 && !recentlyChangedZone) {
      changeZone('city', NPCs.tower.x, NPCs.tower.y + 80);
    }
    // Tower pads — walk on them to open the lobby/quick modal
    Object.keys(TOWER_PADS).forEach(padId => {
      const pad = TOWER_PADS[padId];
      const dist = Math.hypot(localPlayer.x - pad.x, localPlayer.y - pad.y);
      if (dist < 48) {
        const modalId = padId === 'quick' ? 'modal-quick' : 'modal-lobby';
        if (document.getElementById(modalId).style.display !== 'flex') {
          if (ws && ws.readyState === WebSocket.OPEN)
            ws.send(JSON.stringify({ type: 'join_party_pad', padId: padId }));
        }
      }
    });

  } else if (localPlayer.zone.startsWith('interior_')) {
    const key = localPlayer.zone.replace('interior_', '');
    const npc = NPCs[key];
    if (!npc) return;

    // Exit mat at bottom center (600, 820) of 1200x900 room
    if (localPlayer.y > 780 && localPlayer.x > 520 && localPlayer.x < 680 && !recentlyChangedZone) {
      changeZone('city', npc.x, npc.y + 80);
      if (npc.modal) closeModal(npc.modal);
    }
    // NPC interaction zone (NPC stands at 600, 260 behind the counter)
    const distToNpc = Math.hypot(localPlayer.x - 600, localPlayer.y - 280);
    if (distToNpc < 120) {
      canInteractWithNpc = npc;
    } else {
      if (!canInteractWithNpc && npc.modal) closeModal(npc.modal);
      canInteractWithNpc = null;
    }
  }
}

// Button binders
document.getElementById('btn-lobby-climb-start').onclick = () => ws.send(JSON.stringify({ type: 'start_climb', floor: parseInt(document.getElementById('lobby-floor-select').value) }));
document.getElementById('btn-quick-climb-start').onclick = () => ws.send(JSON.stringify({ type: 'start_climb', floor: parseInt(document.getElementById('quick-floor-select').value) }));
document.getElementById('btn-pawn-execute').onclick = () => { if (selectedItem) { ws.send(JSON.stringify({ type: 'pawn_item', itemId: selectedItem.id })); document.getElementById('pawn-item-info').style.display = 'none'; selectedItem = null; } };
document.getElementById('btn-repair-execute').onclick = () => { if (selectedItem) { ws.send(JSON.stringify({ type: 'repair_item', itemId: selectedItem.id })); document.getElementById('repair-item-info').style.display = 'none'; } };
// Shop card click bindings (div-based cards)
document.getElementById('btn-buy-blacksmith').onclick = () => ws.send(JSON.stringify({ type: 'buy_blacksmith_weapon' }));
document.getElementById('btn-buy-relic').onclick = () => ws.send(JSON.stringify({ type: 'buy_relic' }));
document.getElementById('btn-craft-amulet-execute').onclick = () => ws.send(JSON.stringify({ type: 'craft_amulet' }));

document.getElementById('lobby-max-players').onchange = (e) => {
  ws.send(JSON.stringify({ type: 'update_party_settings', maxPlayers: parseInt(e.target.value) }));
};
document.getElementById('lobby-floor-select').onchange = (e) => {
  ws.send(JSON.stringify({ type: 'update_party_settings', floor: parseInt(e.target.value) }));
};

function renderQuests() {
  const list = document.getElementById('quest-list'); list.innerHTML = '';
  quests.forEach(q => {
    const card = document.createElement('div'); card.className = `quest-card ${q.done ? 'done' : ''}`;
    card.innerHTML = `<div style="font-size:0.8rem; color:var(--gold); margin-bottom:5px;">${q.desc}</div><div style="display:flex; justify-content:space-between; align-items:center;"><span style="color:#a39ca9;">${q.progress} / ${q.target}</span><button class="btn-action" ${q.done || q.progress < q.target ? 'disabled' : ''} onclick="ws.send(JSON.stringify({type:'claim_quest', questId:'${q.id}'}))">Claim Reward</button></div>`;
    list.appendChild(card);
  });
}

function setupSkillBar(charClass) { document.querySelectorAll('.skill-bar').forEach(b => b.style.display = 'none'); const activeBar = document.getElementById(`skills-${charClass}`); if (activeBar) activeBar.style.display = 'flex'; }
function enableSkillButtons(enabled) { document.querySelectorAll('.skill-btn').forEach(btn => btn.disabled = !enabled); }
function castSkill(idx) { const bar = document.getElementById(`skills-${currentClass}`); if (bar && bar.style.display !== 'none') { const btns = bar.querySelectorAll('.skill-btn'); if (btns[idx] && !btns[idx].disabled) btns[idx].click(); } }
document.querySelectorAll('.skill-btn').forEach(btn => btn.onclick = () => { if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'use_skill', skillId: btn.getAttribute('data-skill') })); });

// Inv filter buttons (new class)
document.querySelectorAll('.inv-filter-btn').forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll('.inv-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentTab = btn.getAttribute('data-tab');
    renderInventoryGrid();
  };
});
let currentTab = 'all';

const SLOT_EMOJIS = { weapon:'⚔️', armor:'🛡️', accessory:'💍', head:'⛑️', legs:'👖', boots:'👟', potion_hp:'❤️', potion_mp:'💧' };
const SLOT_ORDER = ['weapon','armor','accessory','head','legs','boots'];

function updateInventory(nInv, nEq) { inventory = nInv; equipped = nEq; renderInventoryGrid(); renderEquipDoll(); }

function renderEquipDoll() {
  SLOT_ORDER.forEach(slot => {
    const el = document.getElementById(`eslot-${slot}`);
    if (!el) return;
    const equippedId = equipped[slot];
    const item = equippedId ? inventory.find(i => i.id === equippedId) : null;
    el.innerHTML = '';
    const label = document.createElement('span'); label.className = 'slot-label';
    label.textContent = slot.toUpperCase().slice(0,4); el.appendChild(label);
    if (item) {
      el.className = `equip-slot filled rarity-${item.rarity}`;
      const ico = document.createElement('span'); ico.style.fontSize = '1.6rem';
      ico.textContent = SLOT_EMOJIS[slot] || SLOT_EMOJIS[item.type] || '?';
      el.appendChild(ico);
      el.onclick = () => showItemDetails(item);
    } else {
      el.className = 'equip-slot';
      el.onclick = null;
    }
  });
  // Update potion counts
  document.getElementById('pot-hp-count').textContent = potions.hp || 0;
  document.getElementById('pot-mp-count').textContent = potions.mp || 0;
}

function renderInventoryGrid() {
  const grid = document.getElementById('inventory-grid');
  grid.innerHTML = '';
  const filtered = inventory.filter(i => currentTab === 'all' || i.type === currentTab);
  filtered.forEach(item => {
    const slot = document.createElement('div');
    slot.className = `item-slot rarity-${item.rarity}`;
    if (selectedItem && selectedItem.id === item.id) slot.classList.add('selected');
    const isEq = Object.values(equipped).includes(item.id);
    if (isEq) { const dot = document.createElement('div'); dot.className = 'eq-dot'; slot.appendChild(dot); }
    const ico = document.createElement('span');
    ico.style.fontSize = '1.4rem';
    ico.textContent = SLOT_EMOJIS[item.type] || '?';
    slot.appendChild(ico);
    slot.onclick = () => { selectedItem = item; renderInventoryGrid(); showItemDetails(item); };
    grid.appendChild(slot);
  });
}

function showItemDetails(item) {
  const card = document.getElementById('item-details');
  card.classList.add('visible');
  document.getElementById('det-name').textContent = item.name;
  const rarEl = document.getElementById('det-rarity');
  rarEl.textContent = item.rarity.toUpperCase();
  rarEl.style.color = `var(--${item.rarity})`;
  const stats = item.stats || {};
  document.getElementById('det-stats').textContent =
    [stats.atk && `ATK +${stats.atk}`, stats.def && `DEF +${stats.def}`,
     stats.hp && `HP +${stats.hp}`, stats.healing && `MAG +${stats.healing}`].filter(Boolean).join('  ') || 'No stats';
  document.getElementById('det-durability').textContent = `Durability: ${item.durability ?? 100}/100`;

  const isEq = Object.values(equipped).includes(item.id);
  const equipBtn = document.getElementById('btn-equip-item');
  const unequipBtn = document.getElementById('btn-unequip-item');
  equipBtn.style.display = isEq ? 'none' : 'block';
  unequipBtn.style.display = isEq ? 'block' : 'none';

  // Fixed: use msgType as separate variable to avoid key collision
  equipBtn.onclick = () => {
    if (ws) ws.send(JSON.stringify({ type: 'equip_item', slot: item.type, itemId: item.id }));
    card.classList.remove('visible'); selectedItem = null;
  };
  unequipBtn.onclick = () => {
    if (ws) ws.send(JSON.stringify({ type: 'unequip_item', slot: item.type, itemId: item.id }));
    card.classList.remove('visible'); selectedItem = null;
  };

  if (document.getElementById('modal-forge') && document.getElementById('modal-forge').style.display === 'flex') {
    document.getElementById('repair-item-info').style.display = 'flex';
    document.getElementById('repair-item-name').textContent = item.name;
  }
  if (document.getElementById('modal-pawn') && document.getElementById('modal-pawn').style.display === 'flex') {
    document.getElementById('pawn-item-info').style.display = 'flex';
    document.getElementById('pawn-item-name').textContent = item.name;
  }
}

function usePotion(type) {
  if (type === 'hp' && potions.hp > 0 && localPlayer.hp < localPlayer.maxHp) {
    potions.hp--;
    if (ws) ws.send(JSON.stringify({ type: 'use_potion', potionType: 'hp' }));
    document.getElementById('pot-hp-count').textContent = potions.hp;
  } else if (type === 'mp' && potions.mp > 0 && localPlayer.mana < localPlayer.maxMana) {
    potions.mp--;
    if (ws) ws.send(JSON.stringify({ type: 'use_potion', potionType: 'mp' }));
    document.getElementById('pot-mp-count').textContent = potions.mp;
  }
}

function updateLoop() {
  let moved = false; let dx = 0; let dy = 0;
  applyJoystickToKeys();
  if (keys['w'] || keys['arrowup'] || keys['mobile_up']) { dy = -localPlayer.speed; localPlayer.dir = 'up'; moved = true; }
  if (keys['s'] || keys['arrowdown'] || keys['mobile_down']) { dy = localPlayer.speed; localPlayer.dir = 'down'; moved = true; }
  if (keys['a'] || keys['arrowleft'] || keys['mobile_left']) { dx = -localPlayer.speed; localPlayer.dir = 'left'; moved = true; }
  if (keys['d'] || keys['arrowright'] || keys['mobile_right']) { dx = localPlayer.speed; localPlayer.dir = 'right'; moved = true; }
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; }

  if (localPlayer.actionTimer > 0) localPlayer.actionTimer--;
  else if (!moved) localPlayer.action = 'none';

  if (moved && localPlayer.hp > 0) {
    if (localPlayer.zone === 'city') {
      localPlayer.x = Math.max(10, Math.min(CITY_WIDTH - 10, localPlayer.x + dx));
      localPlayer.y = Math.max(10, Math.min(CITY_HEIGHT - 10, localPlayer.y + dy));
    } else if (localPlayer.zone === 'interior_tower') {
      // Expanded Tower Lobby: 1600 x 1200
      localPlayer.x = Math.max(80, Math.min(1520, localPlayer.x + dx));
      localPlayer.y = Math.max(100, Math.min(1120, localPlayer.y + dy));
    } else if (localPlayer.zone.startsWith('interior_')) {
      // Expanded Shop Interior: 1200 x 900
      localPlayer.x = Math.max(80, Math.min(1120, localPlayer.x + dx));
      localPlayer.y = Math.max(100, Math.min(820, localPlayer.y + dy));
    } else {
      localPlayer.x = Math.max(20, Math.min(780, localPlayer.x + dx));
      localPlayer.y = Math.max(20, Math.min(580, localPlayer.y + dy));
    }
    
    // Only set to walk if we aren't currently playing a specialized action animation
    if (localPlayer.actionTimer <= 0) {
      localPlayer.action = 'walk';
    }
    walkTimer += 1; // increments each moved frame

    const now = Date.now();
    if (now - lastMoveSent > 40) {
      lastMoveSent = now;
      if (ws && ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'move', x: localPlayer.x, y: localPlayer.y, dir: localPlayer.dir, moving: true }));
    }
  } else {
    if (ws && ws.readyState === WebSocket.OPEN && Date.now() - lastMoveSent > 200) { ws.send(JSON.stringify({ type: 'move', x: localPlayer.x, y: localPlayer.y, dir: localPlayer.dir, moving: false })); lastMoveSent = Date.now(); }
  }
  
  processSpatialTriggers();
}

// ── Retro Pixel Animations (3-frame, rotation pivot stepping) ──
function drawLimbsHuman(ctx, x, y, charClass, dir, isDead, action, customColor) {
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(2, 2); // 2x scale inside save/restore - never compounds

  if (isDead) {
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(-10, -6, 20, 24);
    ctx.fillStyle = '#444';    ctx.fillRect(-6, -20, 12, 14);
    ctx.restore(); return;
  }

  // 3-frame walk cycle: frame ticks every 8 walkTimer units (very choppy/retro)
  // frame 0 = neutral, frame 1 = left-step (left leg forward, right leg back), frame 2 = right-step (opposite)
  const frame = Math.floor(walkTimer / 8) % 3;
  const swingAngle = 0.40; // max angle in radians for walking swing

  const isSide = (dir === 'left' || dir === 'right');
  
  let lLegA = 0, rLegA = 0;
  let lLegScaleY = 1.0, rLegScaleY = 1.0;
  let lArmScaleY = 1.0, rArmScaleY = 1.0;

  if (isSide) {
    lLegA = action === 'walk' ? (frame === 1 ? -swingAngle : frame === 2 ? swingAngle : 0) : 0;
    rLegA = action === 'walk' ? (frame === 1 ? swingAngle : frame === 2 ? -swingAngle : 0) : 0;
  } else {
    // Front/Back walking depth bobbing (Y-scale legs, Y-scale arms)
    if (action === 'walk') {
      if (frame === 1) {
        lLegScaleY = 0.7; rLegScaleY = 1.0;
        lArmScaleY = 0.7; rArmScaleY = 1.0;
      } else if (frame === 2) {
        lLegScaleY = 1.0; rLegScaleY = 0.7;
        lArmScaleY = 1.0; rArmScaleY = 0.7;
      }
    }
  }

  // Arms swing opposite to legs in side view
  let lArmA = isSide ? -lLegA : 0;
  let rArmA = isSide ? -rLegA : 0;

  // Action overrides for attacking/casting
  if (action === 'swing') {
    rArmA = -1.5; // swing sword forward/up
  } else if (action === 'shoot') {
    lArmA = -1.0; rArmA = -1.0; // hold bow/aim forward
  } else if (action === 'magic' || action === 'heal') {
    lArmA = -2.0; rArmA = -2.0; // hands raised high
  }

  // Armor color
  let armorColor = customColor && customColor.gear ? customColor.gear : '#251e36';
  let skinColor = customColor && customColor.body ? customColor.body : '#f0c294';
  let legColor = customColor && customColor.gear ? customColor.gear : '#302c38';
  let armColor = customColor && customColor.body ? customColor.body : '#f0c294';

  if (!customColor && equipped.armor) {
    const item = inventory.find(i => i.id === equipped.armor);
    if (item) {
      if      (item.rarity === 'common')    armorColor = '#8e9eab';
      else if (item.rarity === 'uncommon')  armorColor = '#2ecc71';
      else if (item.rarity === 'rare')      armorColor = '#00bcd4';
      else if (item.rarity === 'epic')      armorColor = '#bf3dff';
      else if (item.rarity === 'legendary') armorColor = '#ffaa00';
    }
  }

  // Define layout values based on orientation
  const torsoW = isSide ? 9 : 18;
  const torsoX = -torsoW / 2;
  const hipLX = isSide ? -2.5 : -4;
  const hipRX = isSide ? 2.5 : 4;
  const shoulderLX = isSide ? -3 : -11.5;
  const shoulderRX = isSide ? 3 : 11.5;

  // ─ Draw legs (pivot at left/right hip, rotate, extend down) ─
  // Left leg
  ctx.save();
  ctx.translate(hipLX, 6);
  ctx.scale(1, lLegScaleY);
  ctx.rotate(lLegA);
  ctx.fillStyle = legColor;
  ctx.fillRect(-3, 0, 6, 12);
  ctx.restore();

  // Right leg
  ctx.save();
  ctx.translate(hipRX, 6);
  ctx.scale(1, rLegScaleY);
  ctx.rotate(rLegA);
  ctx.fillStyle = legColor;
  ctx.fillRect(-3, 0, 6, 12);
  ctx.restore();

  // ─ Draw torso ─
  ctx.fillStyle = armorColor;
  ctx.fillRect(torsoX, -13, torsoW, 19);

  // ─ Draw head ─
  const headW = isSide ? 12 : 14;
  const headX = -headW / 2;
  ctx.fillStyle = skinColor; 
  ctx.fillRect(headX, -27, headW, 14);

  // Eyes and Hair
  if (dir === 'up') {
    // Back view hair (covers back of head)
    ctx.fillStyle = '#5a3d28';
    ctx.fillRect(-8, -28, 16, 16);
  } else if (dir === 'down') {
    // Front view eyes
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -21, 3, 3);
    ctx.fillRect(2, -21, 3, 3);
    // Front view hair
    ctx.fillStyle = '#5a3d28';
    ctx.fillRect(-8, -28, 16, 5); // top cap
    ctx.fillRect(-7, -23, 14, 3); // bangs
    ctx.fillRect(-8, -23, 2, 7);  // left sideburn
    ctx.fillRect(6, -23, 2, 7);   // right sideburn
  } else if (dir === 'left') {
    // Side view eye
    ctx.fillStyle = '#000';
    ctx.fillRect(-5, -21, 3, 3);
    // Left side hair
    ctx.fillStyle = '#5a3d28';
    ctx.fillRect(-7, -28, 14, 5); // top cap
    ctx.fillRect(2, -23, 5, 10);  // back hair
    ctx.fillRect(-7, -23, 3, 4);   // front bangs/sideburn
  } else if (dir === 'right') {
    // Side view eye
    ctx.fillStyle = '#000';
    ctx.fillRect(2, -21, 3, 3);
    // Right side hair
    ctx.fillStyle = '#5a3d28';
    ctx.fillRect(-7, -28, 14, 5); // top cap
    ctx.fillRect(-7, -23, 5, 10); // back hair
    ctx.fillRect(4, -23, 3, 4);   // front bangs/sideburn
  }

  // ─ Draw left arm (pivot at left shoulder) ─
  ctx.save();
  ctx.translate(shoulderLX, -9);
  ctx.scale(1, lArmScaleY);
  ctx.rotate(lArmA);
  ctx.fillStyle = armColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 12, 5, 4);
  ctx.restore();

  // ─ Draw right arm (pivot at right shoulder) ─
  ctx.save();
  ctx.translate(shoulderRX, -9);
  ctx.scale(1, rArmScaleY);
  ctx.rotate(rArmA);
  ctx.fillStyle = armColor;
  ctx.fillRect(-2.5, 0, 5, 12);
  ctx.fillStyle = skinColor;
  ctx.fillRect(-2.5, 12, 5, 4);

  // Weapon: anchored to right hand (center of hand is at x=0, y=15)
  let wColor = '#ddd';
  if (equipped.weapon) {
    const wi = inventory.find(i => i.id === equipped.weapon);
    if (wi) {
      if      (wi.rarity === 'legendary') wColor = '#ffaa00';
      else if (wi.rarity === 'epic')      wColor = '#bf3dff';
      else if (wi.rarity === 'rare')      wColor = '#00f0ff';
    }
  }
  const wx = 0;
  const wy = 14;
  if (charClass === 'archer') {
    ctx.fillStyle = '#4a7c3f';
    ctx.fillRect(wx, wy - 6, 2, 18);
    ctx.fillRect(wx - 3, wy - 6, 8, 2);
    ctx.fillRect(wx - 3, wy + 10, 8, 2);
  } else if (charClass === 'mage') {
    ctx.fillStyle = '#bf3dff';
    ctx.fillRect(wx, wy, 3, 18);
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(wx - 1, wy - 4, 5, 5);
  } else if (charClass === 'healer') {
    ctx.fillStyle = '#2ecc71';
    ctx.fillRect(wx, wy, 3, 18);
    ctx.fillStyle = '#fff';
    ctx.fillRect(wx - 2, wy - 2, 7, 3);
    ctx.fillRect(wx + 1, wy - 5, 3, 9);
  } else {
    ctx.fillStyle = wColor;
    ctx.fillRect(wx + 1, wy, 3, 14);
    ctx.fillStyle = '#8d5c23';
    ctx.fillRect(wx - 1, wy + 3, 7, 2);
  }
  ctx.restore();

  ctx.restore();
}

function drawPixelEnemy(ctx, x, y, isDead, action, enemyType, dir, walkTick, windingUp) {
  if (isDead) return;
  ctx.save();
  ctx.translate(Math.round(x), Math.round(y)); ctx.scale(2, 2);

  const frame = Math.floor((walkTick || 0) / 8) % 3;
  const swingAngle = 0.40;

  const isSide = (dir === 'left' || dir === 'right');
  let lLegA = 0, rLegA = 0;
  let lLegScaleY = 1.0, rLegScaleY = 1.0;

  if (isSide) {
    lLegA = action === 'walk' ? (frame === 1 ? -swingAngle : frame === 2 ? swingAngle : 0) : 0;
    rLegA = action === 'walk' ? (frame === 1 ? swingAngle : frame === 2 ? -swingAngle : 0) : 0;
  } else {
    if (action === 'walk') { lLegScaleY = frame === 1 ? 0.7 : 1.0; rLegScaleY = frame === 2 ? 0.7 : 1.0; }
  }

  const isAttack = action === 'attack' || action === 'swing';
  const lArmA = isAttack ? -2.0 : (isSide ? -lLegA : 0);
  const rArmA = isAttack ? -2.0 : (isSide ? -rLegA : 0);
  let lArmScaleY = 1.0, rArmScaleY = 1.0;
  if (!isSide && !isAttack && action === 'walk') {
    lArmScaleY = lLegScaleY === 0.7 ? 0.7 : 1.0;
    rArmScaleY = rLegScaleY === 0.7 ? 0.7 : 1.0;
  }

  const drawArm = (ctx, isRight, w, h, baseCol, handCol, wpCol) => {
    ctx.save();
    ctx.translate(isRight ? w : -w, -10);
    ctx.scale(1, isRight ? rArmScaleY : lArmScaleY);
    ctx.rotate(isRight ? rArmA : lArmA);
    ctx.fillStyle = (windingUp && isRight) ? '#ffaa00' : baseCol;
    ctx.fillRect(-2, 0, 4, h);
    if (handCol) { ctx.fillStyle = handCol; ctx.fillRect(-2, h-2, 4, 3); }
    if (wpCol && isRight) { ctx.fillStyle = wpCol; ctx.fillRect(-1, h, 2, 12); }
    ctx.restore();
  };
  
  const drawLeg = (ctx, isRight, baseCol, shoeCol) => {
    ctx.save();
    ctx.translate(isRight ? 3.5 : -3.5, 6);
    ctx.scale(1, isRight ? rLegScaleY : lLegScaleY);
    ctx.rotate(isRight ? rLegA : lLegA);
    ctx.fillStyle = baseCol; ctx.fillRect(-2.5, 0, 5, 11);
    if (shoeCol) { ctx.fillStyle = shoeCol; ctx.fillRect(-3, 8, 6, 3); }
    ctx.restore();
  }

  const drawBody = (w, h, y, col) => { ctx.fillStyle = col; ctx.fillRect(-w/2, y, w, h); };
  const drawHead = (w, h, y, col, eyeCol) => { 
    ctx.fillStyle = col; ctx.fillRect(-w/2, y, w, h); 
    if (eyeCol) { ctx.fillStyle = eyeCol; ctx.fillRect(-w/2+3, y+4, 2, 2); ctx.fillRect(w/2-5, y+4, 2, 2); }
  };

  switch (enemyType) {
    case 'goblin':
      ctx.scale(0.8, 0.8);
      drawLeg(ctx, false, '#4b6e3b'); drawLeg(ctx, true, '#4b6e3b');
      drawBody(16, 14, -8, '#5d4037');
      drawHead(14, 12, -20, '#5a8247', '#ffeb3b');
      drawArm(ctx, false, 9, 12, '#5a8247'); drawArm(ctx, true, 9, 12, '#5a8247', null, '#d4c4b7');
      break;
    case 'zombie':
      drawLeg(ctx, false, '#2e3b32'); drawLeg(ctx, true, '#2e3b32');
      drawBody(20, 18, -12, '#2e3b32');
      drawHead(16, 14, -26, '#385c40', '#ff0000');
      drawArm(ctx, false, 11, 14, '#385c40'); drawArm(ctx, true, 11, 14, '#385c40');
      break;
    case 'orc':
      ctx.scale(1.1, 1.1);
      drawLeg(ctx, false, '#4b6e3b', '#222'); drawLeg(ctx, true, '#4b6e3b', '#222');
      drawBody(24, 22, -14, '#6b8e23');
      drawHead(18, 16, -30, '#556b2f', '#ff0000');
      drawArm(ctx, false, 13, 16, '#6b8e23'); drawArm(ctx, true, 13, 16, '#6b8e23', '#222', '#777');
      break;
    case 'ogre':
      ctx.scale(1.4, 1.4);
      drawLeg(ctx, false, '#8b4513'); drawLeg(ctx, true, '#8b4513');
      drawBody(28, 26, -18, '#cd853f');
      drawHead(20, 18, -36, '#d2b48c', '#800000');
      drawArm(ctx, false, 15, 20, '#cd853f'); drawArm(ctx, true, 15, 20, '#cd853f', null, '#555');
      break;
    case 'skeleton_sword':
    case 'skeleton_archer':
      drawLeg(ctx, false, '#ddd'); drawLeg(ctx, true, '#ddd');
      drawBody(18, 16, -10, '#eee');
      drawHead(16, 14, -24, '#fff', '#000');
      drawArm(ctx, false, 10, 14, '#ddd'); drawArm(ctx, true, 10, 14, '#ddd', null, enemyType === 'skeleton_archer' ? '#8b4513' : '#aaa');
      break;
    case 'stone_golem':
      ctx.scale(1.3, 1.3);
      drawLeg(ctx, false, '#777'); drawLeg(ctx, true, '#777');
      drawBody(30, 26, -16, '#666');
      drawHead(22, 18, -34, '#555', '#00ffff');
      drawArm(ctx, false, 16, 20, '#777'); drawArm(ctx, true, 16, 20, '#777');
      break;
    case 'cursed_knight':
      ctx.scale(1.5, 1.5);
      drawLeg(ctx, false, '#444', '#111'); drawLeg(ctx, true, '#444', '#111');
      drawBody(24, 22, -14, '#333');
      ctx.fillStyle = '#555'; ctx.fillRect(-15, -14, 8, 8); ctx.fillRect(7, -14, 8, 8); // pauldrons
      drawHead(18, 18, -32, '#222', '#ffaa00');
      ctx.fillStyle = '#ffaa00'; ctx.fillRect(-11, -34, 4, 6); ctx.fillRect(7, -34, 4, 6); // horns
      drawArm(ctx, false, 13, 16, '#444'); drawArm(ctx, true, 13, 16, '#444', '#111', '#ffaa00');
      break;
    case 'frost_wolf':
      ctx.translate(0, 8);
      drawLeg(ctx, false, '#87ceeb'); drawLeg(ctx, true, '#87ceeb');
      drawBody(24, 12, -6, '#b0e0e6');
      drawHead(14, 12, -14, '#add8e6', '#0000ff');
      drawArm(ctx, false, 8, 12, '#87ceeb'); drawArm(ctx, true, 8, 12, '#87ceeb');
      break;
    case 'ice_golem':
      ctx.scale(1.4, 1.4);
      drawLeg(ctx, false, '#00ffff'); drawLeg(ctx, true, '#00ffff');
      drawBody(28, 24, -16, '#00ced1');
      drawHead(20, 16, -32, '#40e0d0', '#ffffff');
      drawArm(ctx, false, 15, 18, '#00ffff'); drawArm(ctx, true, 15, 18, '#00ffff');
      break;
    case 'snow_witch':
      drawLeg(ctx, false, '#eee'); drawLeg(ctx, true, '#eee');
      drawBody(16, 24, -16, '#f0f8ff'); 
      drawHead(14, 14, -30, '#ffe4e1', '#00ffff');
      drawArm(ctx, false, 9, 14, '#f0f8ff'); drawArm(ctx, true, 9, 14, '#f0f8ff', null, '#add8e6');
      break;
    default:
      drawLeg(ctx, false, '#2d1815'); drawLeg(ctx, true, '#2d1815');
      drawBody(22, 20, -13, '#7a3b2e');
      drawHead(18, 14, -27, '#2d1815', '#ff3366');
      drawArm(ctx, false, 12, 14, '#54261c'); drawArm(ctx, true, 12, 14, '#54261c');
      break;
  }

  ctx.restore();
}

function renderLoop() {
  updateLoop();
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (localPlayer.zone === 'city') {
    // ── Huge Detailed Exterior City ──
    cameraX = Math.round(canvas.width / 2 - localPlayer.x); cameraY = Math.round(canvas.height / 2 - localPlayer.y);
    cameraX = Math.max(canvas.width - CITY_WIDTH, Math.min(0, cameraX)); cameraY = Math.max(canvas.height - CITY_HEIGHT, Math.min(0, cameraY));
    
    ctx.save(); ctx.translate(cameraX, cameraY);
    // Base Grass
    ctx.fillStyle = '#203c25'; ctx.fillRect(0, 0, CITY_WIDTH, CITY_HEIGHT);
    // Grass detail patches
    ctx.fillStyle = '#26472d'; 
    for(let i=0; i<300; i++) { ctx.fillRect(Math.sin(i*7)*CITY_WIDTH*0.5+CITY_WIDTH/2, Math.cos(i*13)*CITY_HEIGHT*0.5+CITY_HEIGHT/2, 40, 20); }
    
    // Dirt Paths
    ctx.fillStyle = '#5c4a3d';
    ctx.fillRect(350, 1600, 100, 300); // Path up from spawn
    ctx.fillRect(450, 800, 1000, 900); // Main plaza hub
    ctx.fillRect(1450, 1000, 1200, 100); // Path to tower
    ctx.fillRect(2650, 300, 100, 800); // Tower entrance path

    // Party access is now inside the Tower — no squares in city

    // Draw Detailed Buildings (skip tower - drawn separately)
    Object.keys(NPCs).filter(k => k !== 'tower').forEach(key => {
      const npc = NPCs[key];
      // House Base
      ctx.fillStyle = '#4a3b2b'; ctx.fillRect(npc.x - 80, npc.y - 80, 160, 100);
      // Wood Planks detail
      ctx.strokeStyle = '#3a2d21'; ctx.lineWidth = 2;
      for(let fy=npc.y-80; fy<npc.y+20; fy+=20) { ctx.beginPath(); ctx.moveTo(npc.x-80, fy); ctx.lineTo(npc.x+80, fy); ctx.stroke(); }
      
      // Unique Architectural details
      if (key === 'forge' || key === 'blacksmith') {
        ctx.fillStyle = '#555'; ctx.fillRect(npc.x + 50, npc.y - 120, 20, 60);
        ctx.fillStyle = '#a0a0a0'; ctx.beginPath(); ctx.arc(npc.x + 60, npc.y - 130 + Math.sin(Date.now()/500)*10, 10, 0, Math.PI*2); ctx.fill();
      } else if (key === 'potions') {
        ctx.fillStyle = '#bf3dff'; ctx.fillRect(npc.x - 70, npc.y - 20, 20, 30);
      } else if (key === 'merchant' || key === 'pawn') {
        ctx.fillStyle = '#dfb257'; ctx.fillRect(npc.x - 80, npc.y - 80, 160, 20);
      }
      // Roof
      ctx.fillStyle = key === 'potions' ? '#3d254f' : key === 'quests' ? '#384d2f' : '#6b3628'; 
      ctx.beginPath(); ctx.moveTo(npc.x - 90, npc.y - 80); ctx.lineTo(npc.x + 90, npc.y - 80); ctx.lineTo(npc.x, npc.y - 160); ctx.fill();
      ctx.strokeStyle = '#4a251b'; ctx.lineWidth = 4; ctx.stroke();
      // Door
      ctx.fillStyle = '#22140b'; ctx.fillRect(npc.x - 20, npc.y - 20, 40, 40);
      ctx.fillStyle = '#e4dff0'; ctx.fillRect(npc.x - 14, npc.y - 10, 12, 12);
      // Sign
      ctx.fillStyle = '#8d5c23'; ctx.fillRect(npc.x - 50, npc.y - 180, 100, 24);
      ctx.font = '16px VT323'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(npc.name, npc.x, npc.y - 164);
    });

    // ── Clockwork Tower (detailed exterior) ──
    const tx = NPCs.tower.x, ty = NPCs.tower.y;
    // Foundation
    ctx.fillStyle = '#1a1b22'; ctx.fillRect(tx - 200, ty - 500, 400, 600);
    // Stone brick pattern
    ctx.strokeStyle = '#0f1015'; ctx.lineWidth = 2;
    for (let bx = tx-200; bx < tx+200; bx += 50) {
      for (let by = ty-500; by < ty+100; by += 24) {
        ctx.strokeRect(bx + ((by % 48 === 0) ? 0 : 25), by, 50, 24);
      }
    }
    // Mid tier
    ctx.fillStyle = '#252631'; ctx.fillRect(tx - 130, ty - 700, 260, 200);
    ctx.strokeStyle = '#111218'; ctx.lineWidth = 2;
    for (let bx = tx-130; bx < tx+130; bx += 40) {
      for (let by = ty-700; by < ty-500; by += 20) { ctx.strokeRect(bx, by, 40, 20); }
    }
    // Spire
    ctx.fillStyle = '#1e1f26'; ctx.fillRect(tx - 50, ty - 900, 100, 200);
    ctx.fillStyle = '#424552'; ctx.beginPath(); ctx.moveTo(tx - 60, ty - 900); ctx.lineTo(tx + 60, ty - 900); ctx.lineTo(tx, ty - 1000); ctx.fill();
    // Clock face
    const now = Date.now();
    ctx.fillStyle = '#8d5c23'; ctx.beginPath(); ctx.arc(tx, ty - 350, 90, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#dfb257'; ctx.beginPath(); ctx.arc(tx, ty - 350, 78, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = '#22140b'; ctx.lineWidth = 8;
    // Minute hand
    const mn = (now / 60000) * Math.PI * 2;
    ctx.beginPath(); ctx.moveTo(tx, ty - 350); ctx.lineTo(tx + Math.sin(mn)*60, ty - 350 - Math.cos(mn)*60); ctx.stroke();
    // Hour hand
    const hr = (now / 3600000) * Math.PI * 2;
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.moveTo(tx, ty - 350); ctx.lineTo(tx + Math.sin(hr)*40, ty - 350 - Math.cos(hr)*40); ctx.stroke();
    // Tower gate (entrance)
    ctx.fillStyle = '#22140b'; ctx.fillRect(tx - 40, ty - 60, 80, 80);
    ctx.fillStyle = '#dfb257'; ctx.fillRect(tx - 38, ty - 58, 76, 4); ctx.fillRect(tx - 38, ty - 58, 4, 76); ctx.fillRect(tx + 34, ty - 58, 4, 76); // gold trim
    // Tower sign
    ctx.fillStyle = '#8d5c23'; ctx.fillRect(tx - 80, ty - 520, 160, 28);
    ctx.font = '20px VT323'; ctx.fillStyle = '#dfb257'; ctx.textAlign = 'center'; ctx.fillText('CLOCKWORK TOWER', tx, ty - 500);
    ctx.font = '14px VT323'; ctx.fillStyle = '#a39ca9'; ctx.fillText('Enter to Challenge the Floors', tx, ty - 480);

    otherCityPlayers.forEach(p => {
      drawLimbsHuman(ctx, p.x, p.y, p.class, p.dir, false, p.action || 'none');
      ctx.font = '18px VT323'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(p.username, p.x, p.y - 64); // 64px = 2x sprite height offset
    });
    drawLimbsHuman(ctx, localPlayer.x, localPlayer.y, currentClass, localPlayer.dir, localPlayer.hp <= 0, localPlayer.action);
    ctx.font = '16px VT323'; ctx.fillStyle = '#00f0ff'; ctx.textAlign = 'center';
    ctx.fillText(username, localPlayer.x, localPlayer.y - 64);
    ctx.restore();

  } else if (localPlayer.zone === 'interior_tower') {
    // ── Tower Lobby (Grand Stone Hall) ──
    cameraX = Math.round(canvas.width / 2 - localPlayer.x); cameraY = Math.round(canvas.height / 2 - localPlayer.y);
    cameraX = Math.max(canvas.width - 1600, Math.min(0, cameraX)); cameraY = Math.max(canvas.height - 1200, Math.min(0, cameraY));
    ctx.save(); ctx.translate(cameraX, cameraY);

    // Deep void background
    ctx.fillStyle = '#08090e'; ctx.fillRect(-2000, -2000, 4000, 4000);

    // Stone floor with engraved tiles (expanded size 1600x1200)
    ctx.fillStyle = '#1a1b22'; ctx.fillRect(80, 100, 1440, 1020);
    ctx.strokeStyle = '#0f1015'; ctx.lineWidth = 2;
    for (let fx = 80; fx < 1520; fx += 48) { ctx.beginPath(); ctx.moveTo(fx, 100); ctx.lineTo(fx, 1120); ctx.stroke(); }
    for (let fy = 100; fy < 1120; fy += 48) { ctx.beginPath(); ctx.moveTo(80, fy); ctx.lineTo(1520, fy); ctx.stroke(); }

    // Gold inlay cross in the center plaza
    ctx.fillStyle = 'rgba(223,178,87,0.15)'; 
    ctx.fillRect(760, 100, 80, 1020); // vertical stripe
    ctx.fillRect(80, 560, 1440, 80);  // horizontal stripe

    // Walls
    ctx.fillStyle = '#12131a'; ctx.fillRect(0, 0, 1600, 100); // back wall
    ctx.fillStyle = '#12131a'; ctx.fillRect(0, 0, 80, 1200); ctx.fillRect(1520, 0, 80, 1200); // side walls
    // Brick wall pattern
    ctx.strokeStyle = '#0a0b10'; ctx.lineWidth = 1;
    for (let bx = 0; bx < 1600; bx += 56) {
      for (let by = 0; by < 100; by += 20) { ctx.strokeRect(bx + (by%40===0 ? 0:28), by, 56, 20); }
    }

    // Faction Banners on walls (left = blue party, right = red solo)
    ctx.fillStyle = '#003366'; ctx.fillRect(160, 10, 40, 80);
    ctx.fillStyle = '#00f0ff'; ctx.fillRect(168, 20, 24, 16); ctx.fillRect(174, 16, 12, 24); // cross symbol
    ctx.font = '10px VT323'; ctx.fillStyle = '#00f0ff'; ctx.textAlign = 'center'; ctx.fillText('PARTY', 180, 98);

    ctx.fillStyle = '#660011'; ctx.fillRect(1400, 10, 40, 80);
    ctx.fillStyle = '#ff3366'; ctx.fillRect(1410, 38, 20, 6); // dash symbol
    ctx.font = '10px VT323'; ctx.fillStyle = '#ff3366'; ctx.textAlign = 'center'; ctx.fillText('SOLO', 1420, 98);

    // Staircase to upper floors (decorative - placed upper right)
    ctx.fillStyle = '#252631';
    for (let s = 0; s < 6; s++) { ctx.fillRect(1340 - s*10, 108 + s*14, 120 + s*20, 12); }
    ctx.fillStyle = '#35364a';
    for (let s = 0; s < 6; s++) { ctx.fillRect(1340 - s*10, 108 + s*14, 120 + s*20, 3); }
    ctx.font = '14px VT323'; ctx.fillStyle = '#a39ca9'; ctx.textAlign = 'center'; ctx.fillText('Upper Floors (Locked)', 1400, 196);

    // Glowing circular pads for each party slot and solo
    const pulseAlpha = 0.5 + 0.5 * Math.sin(Date.now() / 400);
    Object.keys(TOWER_PADS).forEach(padId => {
      const pad = TOWER_PADS[padId];
      const onPad = Math.hypot(localPlayer.x - pad.x, localPlayer.y - pad.y) < 48;
      ctx.fillStyle = onPad ? pad.color + 'aa' : pad.color + '30';
      ctx.beginPath(); ctx.arc(pad.x, pad.y, 48, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = pad.color; ctx.lineWidth = onPad ? 4 : 2; ctx.stroke();
      // Inner rune circle
      ctx.strokeStyle = pad.color; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(pad.x, pad.y, 30, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(pad.x, pad.y, 14, 0, Math.PI*2); ctx.stroke();
      // Pad Label
      ctx.font = 'bold 14px VT323'; ctx.fillStyle = pad.color; ctx.textAlign = 'center';
      ctx.fillText(pad.label, pad.x, pad.y - 56);
      if (onPad) {
        ctx.font = '13px VT323'; ctx.fillStyle = '#fff'; ctx.fillText('Step on to Enter', pad.x, pad.y + 64);
      }
    });

    // Exit mat at bottom center (800, 1120)
    ctx.fillStyle = '#a83c32'; ctx.fillRect(760, 1108, 80, 12); // Exit mat
    ctx.font = '12px VT323'; ctx.fillStyle = '#a39ca9'; ctx.textAlign = 'center'; ctx.fillText('EXIT', 800, 1098);

    // Players in lobby
    otherCityPlayers.forEach(p => {
      drawLimbsHuman(ctx, p.x, p.y, p.class, p.dir, false, p.action || 'none');
      ctx.font = '16px VT323'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(p.username, p.x, p.y - 64);
    });
    drawLimbsHuman(ctx, localPlayer.x, localPlayer.y, currentClass, localPlayer.dir, false, localPlayer.action);
    ctx.font = '16px VT323'; ctx.fillStyle = '#00f0ff'; ctx.textAlign = 'center'; ctx.fillText(username, localPlayer.x, localPlayer.y - 64);
    ctx.restore();

    // Floor selector UI drawn statically on canvas (outside translate/save)
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 480, 800, 120);
    ctx.fillStyle = '#dfb257'; ctx.font = '20px VT323'; ctx.textAlign = 'center';
    ctx.fillText('Walk to a pad — use the Floor Selector UI that appears to choose your floor', 400, 515);
    ctx.fillStyle = '#a39ca9'; ctx.font = '16px VT323';
    ctx.fillText('Party Pads (blue) — join with others   |   Solo Pad (red) — run alone', 400, 542);
    ctx.fillText('Checkpoints unlock every 10 floors', 400, 568);

  } else if (localPlayer.zone.startsWith('interior_')) {
    // ── Pokemon Style Interior Room (Expanded size 1200x900) ──
    const key = localPlayer.zone.replace('interior_', '');
    const npc = NPCs[key];

    cameraX = Math.round(canvas.width / 2 - localPlayer.x); cameraY = Math.round(canvas.height / 2 - localPlayer.y);
    cameraX = Math.max(canvas.width - 1200, Math.min(0, cameraX)); cameraY = Math.max(canvas.height - 900, Math.min(0, cameraY));
    ctx.save(); ctx.translate(cameraX, cameraY);
    
    // Black outside
    ctx.fillStyle = '#000'; ctx.fillRect(-2000, -2000, 4000, 4000);
    
    // Theme configuration based on key
    let floorColor = '#5c4a3d', wallColor = '#2c2219', trimColor = '#3a2d21', lineColor = '#4a3b2b', brickLine = '#1e1611';
    
    if (key === 'forge' || key === 'blacksmith') {
      floorColor = '#3a3333'; wallColor = '#3a1111'; trimColor = '#220808'; lineColor = '#1c1c1c'; brickLine = '#1a0000';
    } else if (key === 'potions') {
      floorColor = '#2c1a3b'; wallColor = '#161021'; trimColor = '#0b0812'; lineColor = '#3f2257'; brickLine = '#08050e';
    } else if (key === 'merchant') {
      floorColor = '#9a8138'; wallColor = '#521414'; trimColor = '#3a0c0c'; lineColor = '#bf9830'; brickLine = '#3a0c0c';
    } else if (key === 'relics' || key === 'transmuter') {
      floorColor = '#1c223a'; wallColor = '#10142b'; trimColor = '#0b0e1e'; lineColor = '#293359'; brickLine = '#0a0d1e';
    } else if (key === 'pawn') {
      floorColor = '#423d2b'; wallColor = '#242116'; trimColor = '#1c1810'; lineColor = '#2b261a'; brickLine = '#18150c';
    }

    // Floor planks / tiles
    ctx.fillStyle = floorColor; ctx.fillRect(80, 100, 1040, 720);
    
    // Merchant Red Carpet
    if (key === 'merchant') { ctx.fillStyle = '#7a1919'; ctx.fillRect(400, 100, 400, 720); }
    
    ctx.strokeStyle = lineColor; ctx.lineWidth = 2;
    for (let fx = 80; fx < 1120; fx += 48) { ctx.beginPath(); ctx.moveTo(fx, 100); ctx.lineTo(fx, 820); ctx.stroke(); }
    for (let fy = 100; fy < 820; fy += 32) { ctx.beginPath(); ctx.moveTo(80, fy); ctx.lineTo(1120, fy); ctx.stroke(); }
    
    // Walls (dark stone brick)
    ctx.fillStyle = wallColor; ctx.fillRect(80, 40, 1040, 60); // back wall
    ctx.fillStyle = trimColor; ctx.fillRect(80, 40, 1040, 8); // wall trim
    // Brick pattern
    ctx.strokeStyle = brickLine; ctx.lineWidth = 1;
    for (let bx = 80; bx < 1120; bx += 64) { for (let by = 40; by < 100; by += 18) { ctx.strokeRect(bx + (by%36 ? 0:32), by, 64, 18); } }

    // Side walls
    ctx.fillStyle = wallColor; ctx.fillRect(0, 40, 80, 860); ctx.fillRect(1120, 40, 80, 860);

    // Decorative staircase (upper right corner)
    ctx.fillStyle = '#4a3b2b';
    for (let s = 0; s < 5; s++) { ctx.fillRect(1050 - s*12, 50 + s*16, 50 + s*12, 14); }
    ctx.fillStyle = '#6b4519';
    for (let s = 0; s < 5; s++) { ctx.fillRect(1050 - s*12, 50 + s*16, 50 + s*12, 4); }

    // Shelves with items along the back wall
    ctx.fillStyle = '#6e503b';
    ctx.fillRect(160, 92, 180, 8); // Shelf Left
    ctx.fillRect(860, 92, 180, 8); // Shelf Right
    // Potion bottles on shelf left
    ctx.fillStyle = '#ff3333'; ctx.fillRect(180, 78, 8, 14);
    ctx.fillStyle = '#3399ff'; ctx.fillRect(210, 80, 8, 12);
    ctx.fillStyle = '#33cc33'; ctx.fillRect(240, 76, 8, 16);
    ctx.fillStyle = '#ffaa00'; ctx.fillRect(280, 78, 8, 14);
    // Gear wheel and shield on shelf right
    ctx.fillStyle = '#999'; ctx.beginPath(); ctx.arc(890, 82, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#8d5c23'; ctx.fillRect(940, 72, 18, 20); // Shield
    ctx.fillStyle = '#dfb257'; ctx.fillRect(944, 76, 10, 12);

    // Shop-specific wall & room decorations
    if (key === 'forge' || key === 'blacksmith') {
      // Big chimney/forge with animated fire
      const fireFlicker = Math.abs(Math.sin(Date.now() / 120));
      ctx.fillStyle = '#555'; ctx.fillRect(160, 60, 60, 70); 
      ctx.fillStyle = `rgba(255, ${Math.floor(60 + fireFlicker * 80)}, 0, 1)`; ctx.fillRect(175, 105, 30, 25); // animated fire glow
      ctx.fillStyle = `rgba(255, 200, 0, ${0.5 + fireFlicker * 0.5})`; ctx.fillRect(182, 110, 16, 14); // bright ember
      // Sparks
      for (let sp = 0; sp < 3; sp++) {
        const sx = 190 + Math.sin(Date.now() / 200 + sp * 2) * 10;
        const sy = 100 - sp * 8 + Math.sin(Date.now() / 100 + sp) * 4;
        ctx.fillStyle = `rgba(255, 180, 0, ${0.8 - sp * 0.25})`; ctx.fillRect(sx, sy, 3, 3);
      }
      // Anvil in the room
      ctx.fillStyle = '#3a3a3a'; ctx.fillRect(200, 400, 48, 24);
      ctx.fillStyle = '#555'; ctx.fillRect(208, 424, 32, 12);
      ctx.fillStyle = '#dfb257'; ctx.font = '12px VT323'; ctx.textAlign = 'center'; ctx.fillText('ANVIL', 224, 390);
      // Sword Rack
      ctx.fillStyle = '#8d5c23'; ctx.fillRect(940, 300, 12, 100);
      ctx.fillStyle = '#999'; ctx.fillRect(930, 320, 32, 6); ctx.fillRect(930, 350, 32, 6); ctx.fillRect(930, 380, 32, 6);
      // Swords on rack
      ctx.fillStyle = '#bbb'; ctx.fillRect(938, 315, 4, 15); ctx.fillRect(946, 315, 4, 15); ctx.fillRect(954, 315, 4, 15);
    } else if (key === 'potions') {
      // Magic orb on back wall (animated glow)
      const orbGlow = 0.6 + 0.4 * Math.sin(Date.now() / 400);
      ctx.fillStyle = `rgba(191, 61, 255, ${orbGlow})`; ctx.beginPath(); ctx.arc(220, 80, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.arc(214, 73, 5, 0, Math.PI*2); ctx.fill(); // orb highlight
      // Large animated Cauldron
      ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(950, 420, 35, 0, Math.PI*2); ctx.fill();
      const cauldronPulse = Math.abs(Math.sin(Date.now()/500));
      ctx.fillStyle = `rgba(191, 61, 255, ${cauldronPulse})`; ctx.beginPath(); ctx.arc(950, 415, 28, Math.PI, 2*Math.PI); ctx.fill();
      // Floating bubble particles from cauldron
      for (let b = 0; b < 4; b++) {
        const bx = 935 + b * 10 + Math.sin(Date.now() / 300 + b) * 5;
        const by = 400 - ((Date.now() / 500 + b * 20) % 40);
        ctx.fillStyle = `rgba(191, 61, 255, ${0.6 - (400 - by)/60})`; ctx.beginPath(); ctx.arc(bx, by, 3, 0, Math.PI*2); ctx.fill();
      }
      // Ingredient cabinets
      ctx.fillStyle = '#1e0a33'; ctx.fillRect(140, 250, 80, 120);
      ctx.strokeStyle = '#bf3dff'; ctx.lineWidth = 1; ctx.strokeRect(140, 250, 80, 120);
      // Potions on cabinet shelves
      const potColors = ['#ff3333','#3399ff','#33cc33','#bf3dff','#ffaa00'];
      for (let pi = 0; pi < 5; pi++) {
        ctx.fillStyle = potColors[pi]; ctx.fillRect(150 + pi*13, 270, 8, 18);
        ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(152 + pi*13, 272, 3, 8);
      }
    } else if (key === 'tinker') {
      // Small amulet/gem display cases
      ctx.fillStyle = '#0055aa'; ctx.fillRect(160, 270, 80, 60);
      ctx.fillStyle = '#00f0ff'; ctx.strokeRect(160, 270, 80, 60); ctx.lineWidth = 1;
      const gemColors = ['#00f0ff','#ff3333','#ffaa00','#bf3dff'];
      for (let gi = 0; gi < 4; gi++) {
        ctx.fillStyle = gemColors[gi]; ctx.beginPath(); ctx.arc(176 + gi * 16, 300, 5, 0, Math.PI*2); ctx.fill();
      }
      // Workbench with tools
      ctx.fillStyle = '#0d2244'; ctx.fillRect(900, 300, 80, 100);
      ctx.fillStyle = '#999'; ctx.fillRect(910, 310, 6, 30); ctx.fillRect(920, 312, 4, 28); // tools
    } else if (key === 'quests') {
      // Notice Board
      ctx.fillStyle = '#8d5c23'; ctx.fillRect(150, 50, 180, 45); 
      ctx.fillStyle = '#f0e0b0'; ctx.fillRect(158, 55, 60, 33); ctx.fillRect(228, 55, 60, 33); // papers
      // Table & Chairs
      ctx.fillStyle = '#8d5c23'; ctx.beginPath(); ctx.arc(950, 420, 40, 0, Math.PI*2); ctx.fill(); // Round table
      ctx.fillStyle = '#5c4a3d'; ctx.fillRect(890, 410, 16, 20); ctx.fillRect(994, 410, 16, 20); // chairs
    } else if (key === 'relics' || key === 'transmuter') {
      // Magic rune circle on the floor
      const runeAlpha = 0.3 + 0.2 * Math.sin(Date.now()/300);
      ctx.strokeStyle = `rgba(0, 240, 255, ${runeAlpha})`; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(600, 550, 70, 0, Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.arc(600, 550, 40, 0, Math.PI*2); ctx.stroke();
      // Ancient pillars
      ctx.fillStyle = '#656775'; ctx.fillRect(200, 250, 30, 150); ctx.fillRect(970, 250, 30, 150);
      ctx.fillStyle = '#4f515e'; ctx.fillRect(195, 240, 40, 10); ctx.fillRect(965, 240, 40, 10);
    } else if (key === 'merchant') {
      // Gold coin piles
      ctx.fillStyle = '#dfb257'; ctx.beginPath(); ctx.arc(200, 430, 22, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#bf9030'; ctx.beginPath(); ctx.arc(210, 440, 16, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#dfb257'; ctx.font = '14px VT323'; ctx.textAlign = 'center'; ctx.fillText('COINS', 200, 410);
      // Display cases / jewel boxes
      ctx.fillStyle = '#7a1919'; ctx.fillRect(900, 300, 100, 60);
      ctx.fillStyle = '#dfb257'; ctx.strokeRect(900, 300, 100, 60); ctx.lineWidth = 2;
      ctx.fillStyle = '#00f0ff'; ctx.beginPath(); ctx.arc(940, 330, 8, 0, Math.PI*2); ctx.fill(); // gem
      ctx.fillStyle = '#bf3dff'; ctx.beginPath(); ctx.arc(965, 325, 7, 0, Math.PI*2); ctx.fill();
      // Exotic vase / display
      ctx.fillStyle = '#521414';
      ctx.fillRect(165, 280, 20, 50); ctx.fillRect(158, 290, 34, 8); // vase
      ctx.fillStyle = '#dfb257'; ctx.fillRect(170, 275, 10, 6); // vase neck
    } else if (key === 'pawn') {
      // Scattered junk/barrels
      ctx.fillStyle = '#6b4519'; ctx.fillRect(900, 350, 44, 50); // barrel
      ctx.fillStyle = '#8d5c23'; ctx.fillRect(897, 345, 50, 10); ctx.fillRect(897, 390, 50, 10); // barrel rings
      ctx.fillStyle = '#5a3d28'; ctx.fillRect(160, 300, 40, 60); // crate
      ctx.strokeStyle = '#3a2510'; ctx.lineWidth = 2; ctx.strokeRect(160, 300, 40, 60);
      // Scattered items on floor
      ctx.fillStyle = '#999'; ctx.fillRect(240, 450, 30, 8); // old sword
      ctx.fillStyle = '#8e9eab'; ctx.fillRect(250, 380, 20, 24); // chipped shield
      // Cobwebs in corners
      ctx.strokeStyle = 'rgba(200,200,200,0.3)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(85, 45); ctx.lineTo(130, 80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(85, 65); ctx.lineTo(115, 80); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(1115, 45); ctx.lineTo(1070, 80); ctx.stroke();
    } else {
      // Crate/Chest decorations (default)
      ctx.fillStyle = '#8d5c23'; ctx.fillRect(160, 300, 50, 50); ctx.strokeStyle = '#5c4a3d'; ctx.strokeRect(160,300,50,50);
      ctx.fillStyle = '#6b4519'; ctx.fillRect(940, 300, 60, 40); ctx.fillStyle = '#dfb257'; ctx.fillRect(965, 320, 10, 10);
    }

    // Counter (in front of NPC) - color themed per shop
    let counterColor = '#8d5c23', counterShadow = '#6b4519';
    if (key === 'forge' || key === 'blacksmith') { counterColor = '#444'; counterShadow = '#222'; }
    else if (key === 'potions') { counterColor = '#3f2257'; counterShadow = '#1e0a33'; }
    else if (key === 'merchant') { counterColor = '#7a1919'; counterShadow = '#521212'; }
    else if (key === 'relics' || key === 'transmuter') { counterColor = '#1c2b55'; counterShadow = '#0e1a33'; }
    else if (key === 'pawn') { counterColor = '#4a3b2b'; counterShadow = '#2b2218'; }
    ctx.fillStyle = counterColor; ctx.fillRect(350, 300, 500, 40);
    ctx.fillStyle = counterShadow; ctx.fillRect(350, 340, 500, 12);
    // Counter items
    ctx.fillStyle = '#d4c8a0'; ctx.fillRect(460, 280, 20, 20); ctx.fillRect(560, 278, 20, 22);
    if (key === 'merchant') {
      ctx.fillStyle = '#dfb257'; ctx.fillRect(490, 282, 16, 16); // gold bar on counter
      ctx.fillStyle = '#bf3dff'; ctx.beginPath(); ctx.arc(620, 289, 7, 0, Math.PI*2); ctx.fill(); // gem
    } else if (key === 'forge' || key === 'blacksmith') {
      ctx.fillStyle = '#aaa'; ctx.fillRect(480, 275, 10, 26); ctx.fillRect(475, 275, 20, 7); // blade silhouette
    } else if (key === 'potions') {
      ctx.fillStyle = '#3399ff'; ctx.fillRect(490, 278, 10, 20); ctx.fillRect(487, 275, 16, 6); // potion bottle on counter
      ctx.fillStyle = '#ff3333'; ctx.fillRect(515, 280, 10, 18);
    }

    // Exit Door + Mat at bottom center (600, 820)
    ctx.fillStyle = '#1a0f08'; ctx.fillRect(550, 820, 100, 80); // door
    ctx.fillStyle = '#a83c32'; ctx.fillRect(560, 808, 80, 12); // exit mat
    ctx.font = '12px VT323'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText('EXIT', 600, 798);

    // The NPC behind the counter (stands at 600, 260)
    const npcClass = key === 'potions' ? 'mage' : key === 'quests' ? 'healer' : key === 'merchant' || key === 'pawn' ? 'archer' : 'swordsman';
    drawLimbsHuman(ctx, 600, 260, npcClass, 'down', false, 'none', npc ? npc.color : null);
    ctx.font = '20px VT323'; ctx.fillStyle = 'var(--cyan)'; ctx.textAlign = 'center'; ctx.fillText(npc ? npc.name : '', 600, 200);

    // Other players in the interior
    otherCityPlayers.forEach(p => {
      drawLimbsHuman(ctx, p.x, p.y, p.class, p.dir, false, p.action || 'none');
      ctx.font = '16px VT323'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
      ctx.fillText(p.username, p.x, p.y - 64);
    });

    // Local Player
    drawLimbsHuman(ctx, localPlayer.x, localPlayer.y, currentClass, localPlayer.dir, false, localPlayer.action);
    ctx.font = '16px VT323'; ctx.fillStyle = '#00f0ff'; ctx.textAlign = 'center';
    ctx.fillText(username, localPlayer.x, localPlayer.y - 64);
    
    // Interaction Prompt
    if (canInteractWithNpc) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(localPlayer.x - 90, localPlayer.y - 82, 180, 24);
      ctx.font = '16px VT323'; ctx.fillStyle = 'var(--gold)'; ctx.textAlign = 'center';
      ctx.fillText('[SPACE] Talk to NPC', localPlayer.x, localPlayer.y - 64);
    }
    ctx.restore();

  } else {
    // ── Tower Instance ──
    // Camera: center the 800x600 arena on screen; clamp only if canvas is smaller than arena
    const arenaOffX = Math.max(0, Math.round((canvas.width  - ARENA_W) / 2));
    const arenaOffY = Math.max(0, Math.round((canvas.height - ARENA_H) / 2));
    cameraX = arenaOffX + Math.round(canvas.width < ARENA_W ? Math.min(0, Math.max(canvas.width - ARENA_W, canvas.width/2 - localPlayer.x)) : 0);
    cameraY = arenaOffY + Math.round(canvas.height < ARENA_H ? Math.min(0, Math.max(canvas.height - ARENA_H, canvas.height/2 - localPlayer.y)) : 0);

    ctx.save(); ctx.translate(cameraX, cameraY);

    // ── Stone Floor Tiles ──
    const tileSize = 40;
    for (let ty = 0; ty < ARENA_H; ty += tileSize) {
      for (let tx = 0; tx < ARENA_W; tx += tileSize) {
        const checker = ((tx / tileSize) + (ty / tileSize)) % 2 === 0;
        ctx.fillStyle = checker ? '#1e1618' : '#1a1215';
        ctx.fillRect(tx, ty, tileSize, tileSize);
        // Grout lines
        ctx.strokeStyle = '#0e0a0c'; ctx.lineWidth = 1;
        ctx.strokeRect(tx, ty, tileSize, tileSize);
        // Subtle crack/worn detail
        if ((tx + ty) % 80 === 0) {
          ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(tx+5, ty+5); ctx.lineTo(tx+15, ty+18); ctx.stroke();
        }
      }
    }

    // ── Outer Walls ──
    const wallThick = 24;
    ctx.fillStyle = '#2c1e10';
    ctx.fillRect(0, 0, ARENA_W, wallThick);           // top
    ctx.fillRect(0, ARENA_H - wallThick, ARENA_W, wallThick); // bottom
    ctx.fillRect(0, 0, wallThick, ARENA_H);            // left
    ctx.fillRect(ARENA_W - wallThick, 0, wallThick, ARENA_H); // right
    // Wall facing bevel
    ctx.fillStyle = '#3d2a18';
    ctx.fillRect(0, 0, ARENA_W, 6);
    ctx.fillRect(0, 0, 6, ARENA_H);
    ctx.fillStyle = '#1a0e08';
    ctx.fillRect(0, ARENA_H - 6, ARENA_W, 6);
    ctx.fillRect(ARENA_W - 6, 0, 6, ARENA_H);

    // ── Corner Pillars ──
    const pillars = [[24,24],[ARENA_W-68,24],[24,ARENA_H-68],[ARENA_W-68,ARENA_H-68]];
    pillars.forEach(([px,py]) => {
      ctx.fillStyle = '#4a3520'; ctx.fillRect(px, py, 44, 44);
      ctx.fillStyle = '#5e441f'; ctx.fillRect(px+4, py+4, 36, 36);
      ctx.fillStyle = '#3a2810'; ctx.fillRect(px+14, py+14, 16, 16);
      // Pillar top highlight
      ctx.fillStyle = '#7a5c30'; ctx.fillRect(px, py, 44, 4); ctx.fillRect(px, py, 4, 44);
    });

    // ── Side Pillars ──
    [[ARENA_W/2-22, 24],[ARENA_W/2-22, ARENA_H-68]].forEach(([px,py]) => {
      ctx.fillStyle = '#4a3520'; ctx.fillRect(px, py, 44, 44);
      ctx.fillStyle = '#5e441f'; ctx.fillRect(px+4, py+4, 36, 36);
      ctx.fillStyle = '#7a5c30'; ctx.fillRect(px, py, 44, 4); ctx.fillRect(px, py, 4, 44);
    });

    // ── Wall Torches (animated flicker) ──
    const flickTime = Date.now();
    const flicker = Math.sin(flickTime / 80) * 0.3 + 0.7;
    const torchPositions = [[120,28],[ARENA_W-120,28],[120,ARENA_H-34],[ARENA_W-120,ARENA_H-34]];
    torchPositions.forEach(([tx,ty]) => {
      // Bracket
      ctx.fillStyle = '#5c4418'; ctx.fillRect(tx-4, ty, 8, 12);
      // Flame glow
      ctx.save();
      ctx.globalAlpha = flicker * 0.5;
      ctx.fillStyle = '#ff8800';
      ctx.beginPath(); ctx.arc(tx, ty, 16, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = flicker * 0.25;
      ctx.fillStyle = '#ffdd00';
      ctx.beginPath(); ctx.arc(tx, ty, 24, 0, Math.PI*2); ctx.fill();
      ctx.globalAlpha = 1;
      // Flame body
      ctx.fillStyle = '#ffcc00'; ctx.fillRect(tx-3, ty-10, 6, 10);
      ctx.fillStyle = '#ff6600'; ctx.fillRect(tx-2, ty-14, 4, 6);
      ctx.fillStyle = '#fff'; ctx.fillRect(tx-1, ty-16, 2, 3);
      ctx.restore();
    });

    // Draw AoE Warnings
    aoeWarnings.forEach(aoe => {
      ctx.save();
      const alpha = 0.2 + 0.4 * (1 - (aoe.timer / aoe.maxTimer));
      ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha + 0.3})`;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(aoe.x, aoe.y, aoe.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      aoe.timer--;
    });
    aoeWarnings = aoeWarnings.filter(a => a.timer > 0);

    // ── Floor Center Rune / Arena Ring ──
    ctx.save();
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = '#dfb257'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(ARENA_W/2, ARENA_H/2, 180, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(ARENA_W/2, ARENA_H/2, 90, 0, Math.PI*2); ctx.stroke();
    ctx.beginPath(); ctx.arc(ARENA_W/2, ARENA_H/2, 40, 0, Math.PI*2); ctx.stroke();
    // Cross runes
    ctx.lineWidth = 1;
    for (let a = 0; a < 8; a++) {
      const ang = (Math.PI * 2 / 8) * a;
      ctx.beginPath(); ctx.moveTo(ARENA_W/2 + Math.cos(ang)*45, ARENA_H/2 + Math.sin(ang)*45);
      ctx.lineTo(ARENA_W/2 + Math.cos(ang)*175, ARENA_H/2 + Math.sin(ang)*175); ctx.stroke();
    }
    ctx.restore();

    // ── Floor number banner ──
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(ARENA_W/2 - 80, 4, 160, 20);
    ctx.font = '14px VT323'; ctx.fillStyle = '#dfb257'; ctx.textAlign = 'center';
    ctx.fillText(`FLOOR ${currentFloor}`, ARENA_W/2, 18);

    partyMembers.forEach(m => {
      const isMe = m.username === username;
      const px = isMe ? localPlayer.x : (m.x || 400); const py = isMe ? localPlayer.y : (m.y || 300);
      drawLimbsHuman(ctx, px, py, m.class, isMe ? localPlayer.dir : m.dir, m.hp <= 0, isMe ? localPlayer.action : m.action);
      ctx.font = '18px VT323'; ctx.fillStyle = isMe ? '#00f0ff' : '#fff'; ctx.textAlign = 'center';
      ctx.fillText(m.username, px, py - 64);
    });

    enemies.forEach(e => {
      drawPixelEnemy(ctx, e.x, e.y, e.hp <= 0, e.action, e.enemyClass || 'zombie', e.dir || 'down', e.walkTick || 0, e.windingUp);
      if (e.hp > 0) {
        // HP bar above enemy
        const barW = 48;
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(e.x - barW/2, e.y - 74, barW, 7);
        ctx.fillStyle = '#ff3333'; ctx.fillRect(e.x - barW/2, e.y - 74, Math.round(barW * e.hp / e.maxHp), 7);
        ctx.font = '16px VT323'; ctx.fillStyle = 'var(--red)'; ctx.textAlign = 'center';
        ctx.fillText(e.name ? e.name.split(' ')[0] : '?', e.x, e.y - 78);
      }
    });
    ctx.restore();
  }

  // Draw Particles (world-space — camera offset applied)
  ctx.save();
  if (localPlayer.zone !== 'city' && !localPlayer.zone.startsWith('interior_')) ctx.translate(cameraX, cameraY);
  particles = particles.filter(p => {
    if (p.type === 'spark') { p.x += p.vx; p.y += p.vy; p.alpha -= 0.04; ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.alpha); ctx.fillRect(p.x - p.r/2, p.y - p.r/2, p.r, p.r); ctx.globalAlpha = 1.0; return p.alpha > 0; }
    else if (p.type === 'slash') { p.alpha -= 0.12; ctx.strokeStyle = 'rgba(255,255,255,' + p.alpha + ')'; ctx.lineWidth = 4; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle); ctx.beginPath(); ctx.moveTo(-20, 0); ctx.lineTo(20, 0); ctx.stroke(); ctx.restore(); return p.alpha > 0; }
    else if (p.type === 'wave') { p.r += 12; ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI*2); ctx.stroke(); return p.r < p.maxR; }
  });
  ctx.restore();

  if (floorAnnounce) {
    ctx.save();
    ctx.textAlign = 'center';
    const alpha = Math.min(1, floorAnnounce.timer / 20);
    ctx.globalAlpha = alpha;
    ctx.font = 'bold 72px "Press Start 2P", monospace';
    ctx.fillStyle = '#000'; ctx.fillText(floorAnnounce.text, canvas.width/2 + 4, canvas.height/2 - 46);
    ctx.fillStyle = '#dfb257'; ctx.fillText(floorAnnounce.text, canvas.width/2, canvas.height/2 - 50);
    if (floorAnnounce.sub) {
      ctx.font = 'bold 36px "Press Start 2P", monospace';
      ctx.fillStyle = '#000'; ctx.fillText(floorAnnounce.sub, canvas.width/2 + 3, canvas.height/2 + 33);
      ctx.fillStyle = '#ff3366'; ctx.fillText(floorAnnounce.sub, canvas.width/2, canvas.height/2 + 30);
    }
    ctx.restore();
    floorAnnounce.timer--;
    if (floorAnnounce.timer <= 0) floorAnnounce = null;
  }

  // Draw floating damage texts (screen-space — no camera offset, already baked in)
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
  floatingTexts = floatingTexts.filter(t => {
    t.y -= 1.4; t.opacity -= 0.018;
    ctx.font = 'bold 22px VT323'; ctx.fillStyle = t.color;
    ctx.globalAlpha = Math.max(0, t.opacity);
    ctx.textAlign = 'center';
    ctx.fillText(t.text, t.x, t.y);
    ctx.globalAlpha = 1.0;
    return t.opacity > 0;
  });
  ctx.restore();

  requestAnimationFrame(renderLoop);
}

function spawnCombatNumbers(hitMsg) {
  let tx = localPlayer.x, ty = localPlayer.y;

  // Resolve target position in world space
  if (hitMsg.target === 'all') {
    // Lightning-style — scatter over center of arena
    tx = 400; ty = 300;
  } else if (hitMsg.target && hitMsg.target.startsWith('enemy_')) {
    const match = enemies.find(e => e.id === hitMsg.target);
    if (match) { tx = match.x; ty = match.y; }
    else { tx = 400; ty = 300; }
  } else if (hitMsg.target) {
    // Target is a player username
    if (hitMsg.target === username) {
      tx = localPlayer.x; ty = localPlayer.y;
    } else {
      const match = partyMembers.find(m => m.username === hitMsg.target);
      if (match) { tx = match.x || 400; ty = match.y || 300; }
    }
  }

  // Convert world-space coords to screen-space
  const sx = tx + cameraX;
  const sy = ty + cameraY;

  if (hitMsg.damage === 0 && hitMsg.log && hitMsg.log.includes('PARRIED')) {
    floatingTexts.push({ x: sx, y: sy - 25, text: "PARRY!", color: '#00f0ff', opacity: 1 });
  } else if (hitMsg.target != null) {
    const jitter = Math.random() * 24 - 12;
    floatingTexts.push({
      x: sx + jitter, y: sy - 20,
      text: hitMsg.isHeal ? `+${hitMsg.damage}` : `-${hitMsg.damage}`,
      color: hitMsg.isHeal ? '#2ecc71' : '#ff3366',
      opacity: 1
    });
  }

  // Spark particles in world-space (rendered with cameraX/cameraY offset in draw loop)
  for (let i = 0; i < 12; i++) {
    particles.push({
      type: 'spark', x: tx, y: ty,
      vx: (Math.random() * 4 - 2), vy: (Math.random() * 4 - 2),
      r: Math.random() * 4 + 2,
      color: hitMsg.isHeal ? '#2ecc71' : '#ff5500',
      alpha: 1
    });
  }

  // Slash overlay on physical hits
  if (!hitMsg.isHeal && hitMsg.damage > 0) {
    particles.push({ type: 'slash', x: tx, y: ty, angle: Math.random() * Math.PI, alpha: 1.0 });
  }
}

renderLoop();
connectWebSocket();
