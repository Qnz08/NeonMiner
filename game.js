// Main game loop and Three.js setup
let scene, renderer, camera, world, player, composer;
let clock, animationId;
let highlightMesh;
let isLoaded = false;
let creativeMode = false;
let _lastFrameTime = performance.now();
let _fpsDisplay = 60;
// Throttle HUD DOM updates to reduce layout work while moving fast (ms)
let _lastHudUpdateTime = 0;

// Shop Upgrades Data
const UPGRADES = [
    {
        id: 'pickaxe', name: 'Laser-Bohrer Mk II', desc: '+100% Abbaugeschwindigkeit', cost: 100,
        execute: (p) => { p.miningPower = 2.0; p.setWeaponLevel(1); },
        drawIcon: (ctx, s) => _drawLaserIcon(ctx, s, '#00ff66', 'Mk II')
    },
    {
        id: 'pickaxe3', name: 'Laser-Bohrer Mk III', desc: '+200% Abbaugeschwindigkeit', cost: 500,
        execute: (p) => { p.miningPower = 3.0; p.setWeaponLevel(2); },
        drawIcon: (ctx, s) => _drawLaserIcon(ctx, s, '#ff007f', 'Mk III')
    },
    {
        id: 'reach', name: 'Reichweiten-Mod', desc: '+3m Reichweite', cost: 250,
        execute: (p) => p.REACH = 8,
        drawIcon: (ctx, s) => _drawReachIcon(ctx, s)
    },
    {
        id: 'jetpack', name: 'Jetpack Modul', desc: 'Schaltet Flugmodus (F) frei', cost: 1000,
        execute: (p) => { p.flyingUnlocked = true; showMessage('Jetpack aktiviert (F)', '#ff007f'); },
        drawIcon: (ctx, s) => _drawJetpackIcon(ctx, s)
    },
    {
        id: 'dynamite', name: 'Dynamit-Bauplan', desc: 'Drücke Q — Dynamit werfen & sprengen', cost: 750,
        execute: (p) => { p.hasDynamite = true; showMessage('Dynamit freigeschaltet (Q)', '#ff007f'); },
        drawIcon: (ctx, s) => _drawDynamiteIcon(ctx, s)
    },
    {
        id: 'hyperdrive', name: 'HYPER-DRIVE', desc: 'Oeffnet den naechsten Minensektor.', cost: 10000,
        getCost: () => getCurrentGameLevel().goalCost,
        execute: () => advanceGameLevel(),
        drawIcon: (ctx, s) => _drawHyperIcon(ctx, s)
    }
];
let purchasedUpgrades = new Set();

function getCurrentGameLevel() {
    return GAME_LEVELS[world?.gameLevel || 0] || GAME_LEVELS[0];
}

// ─── Shop Icon Painters ──────────────────────────────────────────
function _drawLaserIcon(ctx, s, glowColor, label) {
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, s, s);
    // Barrel
    ctx.fillStyle = '#445566';
    ctx.fillRect(s*0.15, s*0.42, s*0.55, s*0.16);
    // Body
    ctx.fillStyle = '#334455';
    ctx.fillRect(s*0.5, s*0.32, s*0.2, s*0.36);
    // Glow tip
    ctx.shadowBlur = 10; ctx.shadowColor = glowColor;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(s*0.12, s*0.5, s*0.09, 0, Math.PI*2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // Label
    ctx.fillStyle = glowColor;
    ctx.font = `bold ${s*0.18}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText(label, s*0.5, s*0.92);
}
function _drawReachIcon(ctx, s) {
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = '#66fcf1'; ctx.lineWidth = 2;
    ctx.shadowBlur = 8; ctx.shadowColor = '#66fcf1';
    // Arrow
    ctx.beginPath();
    ctx.moveTo(s*0.1, s*0.5); ctx.lineTo(s*0.9, s*0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s*0.75, s*0.32); ctx.lineTo(s*0.9, s*0.5); ctx.lineTo(s*0.75, s*0.68);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#66fcf1'; ctx.font = `bold ${s*0.16}px monospace`;
    ctx.textAlign = 'center'; ctx.fillText('+3m', s*0.5, s*0.9);
}
function _drawJetpackIcon(ctx, s) {
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, s, s);
    ctx.fillStyle = '#445566';
    ctx.fillRect(s*0.3, s*0.2, s*0.4, s*0.45);
    // Nozzles
    for (const nx of [s*0.32, s*0.58]) {
        ctx.fillStyle = '#66fcf1';
        ctx.shadowBlur = 8; ctx.shadowColor = '#66fcf1';
        ctx.beginPath(); ctx.arc(nx, s*0.75, s*0.09, 0, Math.PI*2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#66fcf1'; ctx.font = `bold ${s*0.14}px monospace`;
    ctx.textAlign = 'center'; ctx.fillText('JET', s*0.5, s*0.95);
}
function _drawDynamiteIcon(ctx, s) {
    ctx.fillStyle = '#0a1020';
    ctx.fillRect(0, 0, s, s);
    // Body
    ctx.fillStyle = '#cc0000';
    ctx.shadowBlur = 8; ctx.shadowColor = '#ff0000';
    ctx.fillRect(s*0.3, s*0.3, s*0.4, s*0.5);
    ctx.shadowBlur = 0;
    // Fuse
    ctx.strokeStyle = '#ffaa00'; ctx.lineWidth = 2; ctx.shadowBlur = 5; ctx.shadowColor = '#ffaa00';
    ctx.beginPath(); ctx.moveTo(s*0.5, s*0.3); ctx.bezierCurveTo(s*0.65, s*0.1, s*0.8, s*0.2, s*0.85, s*0.1);
    ctx.stroke();
    ctx.shadowBlur = 0;
    // Spark
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(s*0.85, s*0.1, s*0.05, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#ff4444'; ctx.font = `bold ${s*0.18}px monospace`;
    ctx.textAlign = 'center'; ctx.fillText('TNT', s*0.5, s*0.96);
}
function _drawHyperIcon(ctx, s) {
    const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, '#ffd700');
    grad.addColorStop(1, '#ff007f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // Star
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.font = `${s*0.55}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 12; ctx.shadowColor = '#ffd700';
    ctx.fillText('🚀', s*0.5, s*0.68);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.font = `bold ${s*0.16}px monospace`;
    ctx.fillText('HYPER', s*0.5, s*0.96);
}

function makeShopIcon(drawFn, size = 56) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    canvas.style.borderRadius = '6px';
    drawFn(canvas.getContext('2d'), size);
    return canvas;
}

// ─── Survival Snapshot (für Rückkehr aus Creative) ────────────────
let survivalSnapshot = null;

function saveSurvivalSnapshot() {
    survivalSnapshot = {
        money: player.money,
        gameLevel: world.gameLevel,
        purchasedUpgrades: new Set(purchasedUpgrades),
        miningPower: player.miningPower,
        weaponLevel: player.weaponLevel ?? 0,
        reach: player.REACH,
        flyingUnlocked: player.flyingUnlocked,
        hasDynamite: player.hasDynamite,
    };
}

function restoreSurvivalSnapshot() {
    if (!survivalSnapshot) return;

    purchasedUpgrades = survivalSnapshot.purchasedUpgrades;
    player.money = survivalSnapshot.money;
    player.miningPower = survivalSnapshot.miningPower;
    player.setWeaponLevel(survivalSnapshot.weaponLevel);
    player.REACH = survivalSnapshot.reach;
    player.flyingUnlocked = survivalSnapshot.flyingUnlocked;
    player.hasDynamite = survivalSnapshot.hasDynamite;

    const targetLevel = survivalSnapshot.gameLevel;
    survivalSnapshot = null;

    showLoadingScreen(true, 'Survival-Stand wird geladen...');
    setTimeout(() => {
        world.setGameLevel(targetLevel);
        applyLevelAtmosphere(GAME_LEVELS[targetLevel]);
        const spawnY = world.getTerrainHeight(8, 8) + 3;
        player.position.set(8, spawnY, 8);
        player.velocity.set(0, 0, 0);
        world.loadChunk(0, 0);
        world.updateChunks(player.position.x, player.position.z);
        updateMoneyDisplay(player.money);
        updateHUD();
        renderShop();
        renderSectorSelector();
        showLoadingScreen(false);
    }, 100);
}

// ─── Game Start ───────────────────────────────────────────────────
function startGame() {
    const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

    // Rückkehr aus Creative: Survival-Stand wiederherstellen
    if (creativeMode) {
        creativeMode = false;
        restoreSurvivalSnapshot();
        showMessage('Survival fortgesetzt - Fortschritt wiederhergestellt!', '#66fcf1');
    }

    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';

    if (isTouchDevice()) {
        document.getElementById('touch-controls').classList.add('visible');
    } else {
        document.getElementById('game-canvas').requestPointerLock();
    }
}

// ─── Creative Mode ──────────────────────────────────────────────────
// Schaltet alle Werkzeuge/Upgrade frei, gibt viel Guthaben und erlaubt
// freie Sektor-Wahl ohne Fortschrittszwang.
function unlockEverythingForCreative() {
    creativeMode = true;

    UPGRADES.forEach(upg => {
        if (upg.id !== 'hyperdrive') purchasedUpgrades.add(upg.id);
    });

    player.miningPower = 3.0;
    player.setWeaponLevel(2);
    player.REACH = 8;
    player.flyingUnlocked = true;
    player.hasDynamite = true;
    player.money = 999999;

    updateMoneyDisplay(player.money);
    renderShop();
    showMessage('Creative-Modus: Alles freigeschaltet!', '#ff007f');
}

function startCreativeMode() {
    // Snapshot nur speichern wenn gerade im Survival-Modus
    if (!creativeMode) {
        saveSurvivalSnapshot();
    }
    unlockEverythingForCreative();
    // Direkt starten ohne startGame() um kein versehentliches Restore zu triggern
    const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'flex';
    if (isTouchDevice()) {
        document.getElementById('touch-controls').classList.add('visible');
    } else {
        document.getElementById('game-canvas').requestPointerLock();
    }
}

function applyLevelAtmosphere(stage) {
    if (!scene) return;
    scene.background = new THREE.Color(stage.fogColor);
    scene.fog = new THREE.FogExp2(stage.fogColor, stage.fogDensity);
}

// ─── Initialization ───────────────────────────────────────────────
function initGame() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0b0c10);
    scene.fog = new THREE.FogExp2(0x0b0c10, 0.018); // slightly denser fog = less to render far away

    renderer = new THREE.WebGLRenderer({
        canvas: document.getElementById('game-canvas'),
        antialias: false,            // PERF: off
        powerPreference: 'high-performance',
        stencil: false,              // PERF: unused
        depth: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // PERF: cap at 1.5x
    renderer.shadowMap.enabled = false; // PERF: shadows disabled globally for big speedup

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 160); // PERF: shorter far plane
    scene.add(camera);

    // PERF: Reduced bloom strength
    const renderScene = new THREE.RenderPass(scene, camera);
    const bloomPass = new THREE.UnrealBloomPass(
        new THREE.Vector2(window.innerWidth * 0.75, window.innerHeight * 0.75), // PERF: bloom at 75% res
        0.8, 0.4, 0.85
    );
    bloomPass.threshold = 0;
    bloomPass.strength = 0.8;  // PERF: was 1.2
    bloomPass.radius = 0.4;

    composer = new THREE.EffectComposer(renderer);
    composer.addPass(renderScene);
    composer.addPass(bloomPass);

    setupLighting();

    const hemi = new THREE.HemisphereLight(0x66fcf1, 0x050608, 0.4);
    scene.add(hemi);

    world = new World(scene);
    player = new Player(camera, world);
    player.initWeapon(scene);
    applyLevelAtmosphere(getCurrentGameLevel());

    setupHighlight();

    clock = new THREE.Clock();

    showLoadingScreen(true, 'Scanne Sektor...');
    setTimeout(() => {
        world.loadChunk(0, 0);
        world.updateChunks(player.position.x, player.position.z);
        const spawnY = world.getTerrainHeight(8, 8) + 3;
        player.position.set(8, spawnY, 8);
        isLoaded = true;
        showLoadingScreen(false);
        renderShop();
        renderLevelSelector();
        renderSectorSelector();
    }, 100);

    window.addEventListener('resize', onResize);

    document.getElementById('game-canvas').addEventListener('click', () => {
        const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
        if (!isTouchDevice() && !document.pointerLockElement) {
            document.getElementById('game-canvas').requestPointerLock();
        }
    });

    document.addEventListener('pointerlockchange', () => {
        const locked = !!document.pointerLockElement;
        const shop = document.getElementById('shop-overlay');
        const winScreen = document.getElementById('win-screen');

        if (locked) {
            document.getElementById('pause-overlay').style.display = 'none';
            shop.style.display = 'none';
        } else {
            if (shop.style.display !== 'flex' && winScreen.style.display !== 'flex') {
                document.getElementById('pause-overlay').style.display = 'flex';
            }
        }
    });

    gameLoop();
}

function setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 0.3);
    scene.add(ambient);

    // PERF: No shadow map
    const sun = new THREE.DirectionalLight(0x45a29e, 0.7);
    sun.position.set(50, 100, 50);
    sun.castShadow = false;
    scene.add(sun);
}

function setupHighlight() {
    const geo = new THREE.BoxGeometry(1.01, 1.01, 1.01);
    const mat = new THREE.MeshBasicMaterial({
        color: 0x66fcf1,
        wireframe: true,
        transparent: true,
        opacity: 0.35,
        depthTest: true
    });
    highlightMesh = new THREE.Mesh(geo, mat);
    highlightMesh.visible = false;
    scene.add(highlightMesh);
}

// ─── Main Game Loop ───────────────────────────────────────────────
function gameLoop() {
    animationId = requestAnimationFrame(gameLoop);
    if (!isLoaded) return;

    const dt = Math.min(clock.getDelta(), 0.1);

    player.update(dt);
    world.processQueue();
    world.updateChunks(player.position.x, player.position.z);
    updateHighlight();
    updateHUD();

    if (player.position.y < -20) {
        player.respawn();
        showMessage('Du bist gestorben! Respawn...');
    }

    composer.render();
}

// ─── Block Highlight ──────────────────────────────────────────────
function updateHighlight() {
    const hit = player.raycast();
    if (hit) {
        highlightMesh.visible = true;
        highlightMesh.position.set(hit.hit.x + 0.5, hit.hit.y + 0.5, hit.hit.z + 0.5);
    } else {
        highlightMesh.visible = false;
    }
}

// ─── HUD ──────────────────────────────────────────────────────────
function updateHUD() {
    // Only update HUD at most every 100ms to avoid excessive DOM thrashing
    const now = performance.now();
    if (now - _lastHudUpdateTime < 100) return;
    _lastHudUpdateTime = now;

    const p = player.position;
    document.getElementById('coords').textContent =
        `X: ${p.x.toFixed(1)}  Y: ${p.y.toFixed(1)}  Z: ${p.z.toFixed(1)}`;

    const mode = player.flying
        ? '✈ Flug' + (player.sprinting ? ' (Schnell)' : '')
        : player.onGround
            ? (player.sprinting ? '🏃 Sprint' : '🚶 Boden')
            : '↑ Luft';
    document.getElementById('mode-display').textContent = mode;

    const colorName = LEVEL_THEMES[world.currentLevel]?.name || 'Unknown';
    const stage = GAME_LEVELS[world.gameLevel] || GAME_LEVELS[0];
    let hazards = '';
    if (stage.hasLava) hazards += ' 🔥';
    if (stage.hasGas) hazards += ' ☣';
    if (stage.hasTraps) hazards += ' ⚠';
    if ((stage.gravityMultiplier ?? 1) < 1) hazards += ' 🌙';
    document.getElementById('level-display').textContent = `Level ${world.gameLevel + 1}: ${stage.name}${hazards} | Farbe: ${colorName}`;
}

// ─── Shop & Economy ────────────────────────────────────────────────
function updateMoneyDisplay(amount) {
    document.getElementById('money-display').textContent = `$${amount}`;
    document.getElementById('shop-money').textContent = `$${amount}`;
}

function toggleShop() {
    const shop = document.getElementById('shop-overlay');
    const isVisible = shop.style.display === 'flex';
    const isTouchDevice = (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

    if (isVisible) {
        shop.style.display = 'none';
        if (!isTouchDevice) {
            document.getElementById('game-canvas').requestPointerLock();
        }
    } else {
        if (document.pointerLockElement) document.exitPointerLock();
        document.getElementById('pause-overlay').style.display = 'none';
        renderShop();
        shop.style.display = 'flex';
    }
}

function renderShop() {
    const container = document.getElementById('shop-items-container');
    container.innerHTML = '';

    UPGRADES.forEach((upg) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'shop-item';

        const cost = upg.getCost ? upg.getCost() : upg.cost;
        const isPurchased = upg.id !== 'hyperdrive' && purchasedUpgrades.has(upg.id);
        const canAfford = player.money >= cost;

        // Icon
        const iconCanvas = makeShopIcon(upg.drawIcon);
        iconCanvas.className = 'shop-icon';

        const info = document.createElement('div');
        info.className = 'item-info';
        const desc = upg.id === 'hyperdrive'
            ? `${upg.desc} Aktueller Sektor: ${getCurrentGameLevel().name}.`
            : upg.desc;
        info.innerHTML = `<h3>${upg.name}</h3><p>${desc}</p>`;

        const btn = document.createElement('button');
        btn.className = 'buy-btn';
        if (isPurchased) {
            btn.textContent = '✓ GEKAUFT';
            btn.classList.add('disabled');
            itemDiv.classList.add('purchased');
        } else {
            btn.textContent = `KAUFEN ($${cost})`;
            if (!canAfford) btn.classList.add('disabled');
            else {
                btn.addEventListener('click', () => buyUpgrade(upg.id));
            }
        }

        itemDiv.appendChild(iconCanvas);
        itemDiv.appendChild(info);
        itemDiv.appendChild(btn);
        container.appendChild(itemDiv);
    });
}

function renderLevelSelector() {
    const container = document.getElementById('level-selector');
    container.innerHTML = '';

    LEVEL_THEMES.forEach((theme, idx) => {
        const btn = document.createElement('button');
        btn.className = 'level-btn';
        if (idx === world.currentLevel) {
            btn.classList.add('active');
        }
        btn.textContent = theme.name;
        btn.addEventListener('click', () => setLevel(idx));
        container.appendChild(btn);
    });
}

window.setLevel = function(levelIndex) {
    world.setColorTheme(levelIndex);
    renderLevelSelector();
    showMessage(`Farbe: ${LEVEL_THEMES[levelIndex].name}`, '#66fcf1');
};

function renderSectorSelector() {
    const container = document.getElementById('sector-selector');
    if (!container) return;
    container.innerHTML = '';

    GAME_LEVELS.forEach((stage, idx) => {
        const btn = document.createElement('button');
        btn.className = 'sector-btn';
        if (world && idx === world.gameLevel) {
            btn.classList.add('active');
        }
        btn.textContent = `${idx + 1}. ${stage.name}`;
        btn.addEventListener('click', () => selectSector(idx));
        container.appendChild(btn);
    });
}

window.selectSector = function(levelIndex) {
    // Direkter Sektor-Sprung (Creative): keine Upgrade-Resets, keine Sperren.
    unlockEverythingForCreative();

    showLoadingScreen(true, `Lade ${GAME_LEVELS[levelIndex].name}...`);
    document.getElementById('shop-overlay').style.display = 'none';

    setTimeout(() => {
        world.setGameLevel(levelIndex);
        applyLevelAtmosphere(GAME_LEVELS[levelIndex]);
        const spawnY = world.getTerrainHeight(8, 8) + 3;
        player.position.set(8, spawnY, 8);
        player.velocity.set(0, 0, 0);
        world.loadChunk(0, 0);
        world.updateChunks(player.position.x, player.position.z);
        updateHUD();
        renderShop();
        renderSectorSelector();
        showLoadingScreen(false);
        startGame();
    }, 100);
};

function showFinalWin() {
    if (document.pointerLockElement) document.exitPointerLock();
    document.getElementById('win-screen').style.display = 'flex';
    document.getElementById('shop-overlay').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
}

function advanceGameLevel() {
    const nextLevel = world.gameLevel + 1;

    if (nextLevel >= GAME_LEVELS.length) {
        showFinalWin();
        return;
    }

    showMessage(`Neuer Sektor: ${GAME_LEVELS[nextLevel].name}`, '#66fcf1');
    playSound('levelUp');
    document.getElementById('shop-overlay').style.display = 'none';
    showLoadingScreen(true, `Lade ${GAME_LEVELS[nextLevel].name}...`);

    // Jedes neue Level beginnt von vorne: alle Upgrades müssen neu gekauft werden.
    // Im Creative-Modus bleibt alles freigeschaltet.
    if (creativeMode) {
        player.resetUpgrades();
    } else {
        purchasedUpgrades.clear();
        player.resetUpgrades();
    }

    setTimeout(() => {
        world.setGameLevel(nextLevel);
        applyLevelAtmosphere(GAME_LEVELS[nextLevel]);
        const spawnY = world.getTerrainHeight(8, 8) + 3;
        player.position.set(8, spawnY, 8);
        player.velocity.set(0, 0, 0);
        world.loadChunk(0, 0);
        world.updateChunks(player.position.x, player.position.z);
        updateHUD();
        if (creativeMode) unlockEverythingForCreative();
        renderShop();
        renderSectorSelector();
        showLoadingScreen(false);
    }, 100);
}

window.buyUpgrade = function(id) {
    const upg = UPGRADES.find(u => u.id === id);
    if (!upg || (id !== 'hyperdrive' && purchasedUpgrades.has(id))) return;

    const cost = upg.getCost ? upg.getCost() : upg.cost;
    if (player.money >= cost) {
        player.money -= cost;
        if (id !== 'hyperdrive') purchasedUpgrades.add(id);
        upg.execute(player);
        updateMoneyDisplay(player.money);
        renderShop();
        showMessage(`${upg.name} gekauft!`, '#66fcf1');
        playSound('buy');
    } else {
        playSound('deny');
    }
};

// ─── Particle Pool ────────────────────────────────────────────────
// PERF: Reuse a pool of particle meshes instead of creating/disposing each time
const _particlePool = [];
const _particleGeo = new THREE.SphereGeometry(0.15, 4, 4);

function _getParticle(color) {
    let mesh = _particlePool.pop();
    if (!mesh) {
        mesh = new THREE.Mesh(_particleGeo, new THREE.MeshBasicMaterial({ transparent: true }));
    }
    mesh.material.color.setHex(color);
    mesh.material.opacity = 0.9;
    mesh.visible = true;
    return mesh;
}

function _returnParticle(mesh) {
    mesh.visible = false;
    _particlePool.push(mesh);
    scene.remove(mesh);
}

function showBreakEffect(pos, blockId) {
    let color = 0x45a29e;
    if (blockId === BLOCK.NEON_BLUE_CRYSTAL) color = 0x66fcf1;
    if (blockId === BLOCK.NEON_MAGENTA_CRYSTAL) color = 0xff007f;
    if (blockId === BLOCK.GOLD_CRYSTAL) color = 0xffd700;
    if (blockId === BLOCK.TRAP_CRYSTAL) color = 0xff1133;

    const particles = [];
    for (let i = 0; i < 5; i++) { // PERF: 5 instead of 6
        const mesh = _getParticle(color);
        mesh.position.set(pos.x + 0.5, pos.y + 0.5, pos.z + 0.5);
        mesh.velocity = new THREE.Vector3(
            (Math.random()-0.5)*3, Math.random()*3+1, (Math.random()-0.5)*3
        );
        scene.add(mesh);
        particles.push(mesh);
    }

    let t = 0;
    function animate() {
        t += 0.05;
        for (const p of particles) {
            p.position.addScaledVector(p.velocity, 0.05);
            p.velocity.y -= 0.15;
            p.material.opacity = Math.max(0, 0.9 - t * 2);
        }
        if (t < 0.5) {
            requestAnimationFrame(animate);
        } else {
            particles.forEach(p => _returnParticle(p));
        }
    }
    animate();
}

function showMessage(text, color) {
    const el = document.getElementById('message');
    el.textContent = text;
    el.style.color = color || '#fff';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
    clearTimeout(window._msgTimeout);
    window._msgTimeout = setTimeout(() => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(-10px)';
    }, 2500);
}

function showLoadingScreen(show, text = '') {
    const el = document.getElementById('loading-screen');
    if (show) {
        el.style.display = 'flex';
        el.style.opacity = '1';
        document.getElementById('loading-text').textContent = text;
    } else {
        el.style.opacity = '0';
        setTimeout(() => el.style.display = 'none', 500);
    }
}

// ─── Resize ────────────────────────────────────────────────────────
function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
}

// ─── Mobile Navigation ───────────────────────────────────────────
function setupMobileNavigation() {
    const isTouchDevice = () => (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));

    if (!isTouchDevice()) return;

    document.getElementById('mobile-shop-btn').addEventListener('click', () => {
        const shop = document.getElementById('shop-overlay');
        const pauseOverlay = document.getElementById('pause-overlay');

        if (shop.style.display === 'flex') {
            shop.style.display = 'none';
        } else {
            renderShop();
            shop.style.display = 'flex';
            pauseOverlay.style.display = 'none';
        }
    });

    document.getElementById('mobile-menu-btn').addEventListener('click', () => {
        const pauseOverlay = document.getElementById('pause-overlay');
        const shop = document.getElementById('shop-overlay');

        if (pauseOverlay.style.display === 'flex') {
            pauseOverlay.style.display = 'none';
        } else {
            pauseOverlay.style.display = 'flex';
            shop.style.display = 'none';
        }
    });

    document.getElementById('shop-overlay').addEventListener('click', (e) => {
        if (e.target === e.currentTarget) {
            e.currentTarget.style.display = 'none';
        }
    });
}

window.addEventListener('load', () => {
    initGame();
    setupMobileNavigation();
});