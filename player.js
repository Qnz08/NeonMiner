// First-person player controller with physics, weapon arm, view bobbing, and physical dynamite
class Player {
    constructor(camera, world) {
        this.camera = camera;
        this.world = world;

        // Position
        this.position = new THREE.Vector3(8, 30, 8);
        this.velocity = new THREE.Vector3(0, 0, 0);

        // Camera euler angles
        this.yaw = 0;
        this.pitch = 0;

        // State
        this.onGround = false;
        this.flying = false;
        this.sprinting = false;
        this.flyingUnlocked = false;

        // Player Dimensions (AABB)
        this.width = 0.6;
        this.height = 1.8;

        // Control state
        this.keys = {};
        this.hasDynamite = false;

        // Economy & Upgrades
        this.money = 0;
        this.miningPower = 1.0;
        this.mineCooldown = 0;

        // Hazard states
        this.gasSlowTimer = 0;
        this.lavaImmuneTimer = 0;

        // Reach distance
        this.REACH = 6;

        // Physics constants
        this.GRAVITY = -28;
        this.JUMP_FORCE = 9;
        this.WALK_SPEED = 5;
        this.FLY_SPEED = 12;

        // ─── Weapon / View Bob ────────────────────────────────────
        this._bobTime = 0;
        this._bobAmount = 0;
        this._recoilOffset = 0;   // Z push-back on mining
        this._weaponPivot = null; // Three.js Group attached to camera
        this._weaponMesh = null;
        this._weaponLevel = 0;    // 0=default 1=MkII 2=MkIII

        // ─── Active Dynamite Projectiles ─────────────────────────
        this._dynamites = [];     // { mesh, vel, life }

        // Scene ref (set by game.js after init)
        this._scene = null;

        this.setupControls();
    }

    // Called by game.js once scene is ready
    initWeapon(scene) {
        this._scene = scene;
        this._buildWeaponMesh();
    }

    // ─── Weapon Model ─────────────────────────────────────────────
    _buildWeaponMesh() {
        if (this._weaponPivot) {
            this.camera.remove(this._weaponPivot);
        }

        const pivot = new THREE.Group();
        // Position weapon in lower-right of view (like a FPS game)
        pivot.position.set(0.28, -0.22, -0.45);
        this.camera.add(pivot);
        this._weaponPivot = pivot;

        const level = this._weaponLevel;

        // Colors per level
        const bodyColor  = [0x334455, 0x1a2a1a, 0xd4c88a][level] ?? 0x334455;
        const glowColor  = [0x66fcf1, 0x00ff66, 0xff007f][level] ?? 0x66fcf1;
        const emissiveI  = [1.2, 1.8, 2.5][level] ?? 1.2;

        const bodyMat = new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.4, metalness: 0.8 });
        const glowMat = new THREE.MeshStandardMaterial({
            color: glowColor, emissive: glowColor, emissiveIntensity: emissiveI,
            roughness: 0.2, metalness: 0.1
        });

        // Barrel (long box)
        const barrelGeo = new THREE.BoxGeometry(0.06, 0.06, 0.35);
        const barrel = new THREE.Mesh(barrelGeo, bodyMat);
        barrel.position.set(0, 0, 0);
        pivot.add(barrel);

        // Body (thicker grip)
        const bodyGeo = new THREE.BoxGeometry(0.09, 0.11, 0.14);
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.set(0, -0.02, 0.12);
        pivot.add(body);

        // Energy tip (glowing crystal bit at front)
        const tipGeo = new THREE.OctahedronGeometry(0.04, 0);
        const tip = new THREE.Mesh(tipGeo, glowMat);
        tip.position.set(0, 0, -0.19);
        tip.rotation.z = Math.PI / 4;
        pivot.add(tip);

        // Level-specific extras
        if (level >= 1) {
            // Side vents
            for (let s of [-1, 1]) {
                const ventGeo = new THREE.BoxGeometry(0.02, 0.04, 0.10);
                const vent = new THREE.Mesh(ventGeo, glowMat);
                vent.position.set(s * 0.055, 0, 0.04);
                pivot.add(vent);
            }
        }
        if (level >= 2) {
            // Second energy ring around barrel
            const ringGeo = new THREE.TorusGeometry(0.05, 0.012, 6, 12);
            const ring = new THREE.Mesh(ringGeo, glowMat);
            ring.rotation.x = Math.PI / 2;
            ring.position.set(0, 0, -0.10);
            pivot.add(ring);
        }

        this._weaponMesh = pivot;
        this._weaponTip = tip; // for rotation animation
    }

    setWeaponLevel(level) {
        this._weaponLevel = level;
        if (this._scene) this._buildWeaponMesh();
    }

    // ─── Controls ─────────────────────────────────────────────────
    setupControls() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;

            if (e.code === 'KeyF') {
                if (!this.flyingUnlocked) {
                    showMessage('Jetpack nicht freigeschaltet!', '#ff007f');
                    return;
                }
                this.flying = !this.flying;
                this.velocity.y = 0;
                showMessage(this.flying ? '✈ Flugmodus AN' : '🚶 Flugmodus AUS');
            }
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.sprinting = true;
            }
            if (e.code === 'KeyQ' && this.hasDynamite) {
                this.throwDynamite();
            }
            if (e.code === 'KeyC') {
                this.setAutoclicker(!this.autoclickerEnabled);
            }
            if (e.code === 'KeyE') {
                toggleShop();
            }
            if (e.code === 'Escape') {
                const shop = document.getElementById('shop-overlay');
                const pauseOverlay = document.getElementById('pause-overlay');
                if (shop && shop.style.display === 'flex') {
                    toggleShop();
                } else if (pauseOverlay && pauseOverlay.style.display === 'none') {
                    pauseOverlay.style.display = 'flex';
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                this.sprinting = false;
            }
        });

        document.addEventListener('mousemove', (e) => {
            if (!document.pointerLockElement) return;
            const sensitivity = 0.002;
            this.yaw -= e.movementX * sensitivity;
            this.pitch -= e.movementY * sensitivity;
            this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch));
        });

        document.addEventListener('mousedown', (e) => {
            if (!document.pointerLockElement) return;
            if (e.button === 0) this.isMining = true;
            if (e.button === 2) this.placeScaffold();
        });
        document.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.isMining = false;
        });

        document.addEventListener('contextmenu', e => e.preventDefault());

        const pcAutoBtn = document.getElementById('autoclicker-btn-pc');
        if (pcAutoBtn) {
            pcAutoBtn.addEventListener('click', () => this.setAutoclicker(!this.autoclickerEnabled));
        }

        this.setupTouchControls();
    }

    // ─── Touch Controls ───────────────────────────────────────────
    setupTouchControls() {
        this.touchJoystickLeft = { x: 0, y: 0, isActive: false, touchId: null };
        this.touchLook = { isActive: false, touchId: null, lastX: 0, lastY: 0 };
        this.touchJoystickDeadZone = 0.14;
        this.touchJoystickInputScale = 0.72;
        this.touchLookSensitivity = 0.0045;
        this.autoclickerEnabled = false;
        this.autoClickInterval = null;
        this._lastAutoClickTime = 0;

        // Show touch controls only on touch devices
        const touchControls = document.getElementById('touch-controls');
        if (this._isTouchDevice()) {
            touchControls.classList.add('visible');
            this._initJoystickCanvases();
        }

        // Touch events
        document.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this._handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this._handleTouchEnd(e), { passive: false });

        // Button listeners
        document.getElementById('shoot-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isMining = true;
        });
        document.getElementById('shoot-btn').addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isMining = false;
        });

        document.getElementById('autoclicker-btn').addEventListener('click', (e) => {
            e.preventDefault();
            this.setAutoclicker(!this.autoclickerEnabled);
        });

        document.getElementById('jump-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.onGround && !this.flying) {
                this.velocity.y = this.JUMP_FORCE;
                this.onGround = false;
            } else if (this.flying) {
                this.velocity.y = this.FLY_SPEED * 0.7;
            }
        });

        document.getElementById('fly-btn').addEventListener('click', (e) => {
            e.preventDefault();
            if (!this.flyingUnlocked) {
                showMessage('Jetpack nicht freigeschaltet!', '#ff007f');
                return;
            }
            this.flying = !this.flying;
            this.velocity.y = 0;
            showMessage(this.flying ? '✈ Flugmodus AN' : '🚶 Flugmodus AUS');
        });

        document.getElementById('dynamite-btn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.hasDynamite) {
                this.throwDynamite();
            }
        });
    }

    _isTouchDevice() {
        return (('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
    }

    _initJoystickCanvases() {
        const drawJoystickBg = (canvas) => {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;

            // Outer circle
            ctx.strokeStyle = 'rgba(102, 252, 241, 0.4)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2 - 2, 0, Math.PI*2);
            ctx.stroke();

            // Inner circle (dead zone)
            ctx.strokeStyle = 'rgba(102, 252, 241, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/4, 0, Math.PI*2);
            ctx.stroke();
        };

        const leftBg = document.getElementById('joystick-left-bg');
        if (leftBg) {
            leftBg.width = 120;
            leftBg.height = 120;
            drawJoystickBg(leftBg);
        }
    }

    _handleTouchStart(e) {
        if (e.target.closest('.side-button')) return;

        for (const touch of e.changedTouches) {
            const x = touch.clientX;
            const y = touch.clientY;

            // Left joystick zone (left 50%)
            const leftJoystick = document.getElementById('joystick-left');
            if (leftJoystick && !this.touchJoystickLeft.isActive) {
                const leftRect = leftJoystick.getBoundingClientRect();
                if (x >= leftRect.left && x <= leftRect.right && y >= leftRect.top && y <= leftRect.bottom) {
                    this.touchJoystickLeft.isActive = true;
                    this.touchJoystickLeft.touchId = touch.identifier;
                    this._updateJoystickPosition(this.touchJoystickLeft, x, y, 'left');
                    continue;
                }
            }

            if (!this.touchLook.isActive) {
                this.touchLook.isActive = true;
                this.touchLook.touchId = touch.identifier;
                this.touchLook.lastX = x;
                this.touchLook.lastY = y;
            }
        }
    }

    _handleTouchMove(e) {
        e.preventDefault();

        for (const touch of e.touches) {
            const x = touch.clientX;
            const y = touch.clientY;

            if (this.touchJoystickLeft.isActive && touch.identifier === this.touchJoystickLeft.touchId) {
                this._updateJoystickPosition(this.touchJoystickLeft, x, y, 'left');
            }

            if (this.touchLook.isActive && touch.identifier === this.touchLook.touchId) {
                const dx = x - this.touchLook.lastX;
                const dy = y - this.touchLook.lastY;
                this.yaw -= dx * this.touchLookSensitivity;
                this.pitch -= dy * this.touchLookSensitivity;
                this.pitch = Math.max(-Math.PI/2 + 0.01, Math.min(Math.PI/2 - 0.01, this.pitch));
                this.touchLook.lastX = x;
                this.touchLook.lastY = y;
            }
        }
    }

    _handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.touchJoystickLeft.touchId) {
                this._resetJoystick(this.touchJoystickLeft, 'left');
            }

            if (touch.identifier === this.touchLook.touchId) {
                this.touchLook.isActive = false;
                this.touchLook.touchId = null;
            }
        }
    }

    _resetJoystick(joystick, side) {
        joystick.isActive = false;
        joystick.touchId = null;
        joystick.x = 0;
        joystick.y = 0;
        const container = document.getElementById(`joystick-${side}`);
        const stick = container?.querySelector('.joystick-stick');
        if (stick) {
            stick.style.transform = 'translate(-50%, -50%)';
        }
    }

    _updateJoystickPosition(joystick, screenX, screenY, side) {
        const container = document.getElementById(`joystick-${side}`);
        const rect = container.getBoundingClientRect();

        // Position relative to container center
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        let deltaX = screenX - centerX;
        let deltaY = screenY - centerY;

        // Clamp to circle (max radius is half of container)
        const maxRadius = rect.width / 2;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        if (distance > maxRadius) {
            deltaX = (deltaX / distance) * maxRadius;
            deltaY = (deltaY / distance) * maxRadius;
        }

        const rawX = deltaX / maxRadius;
        const rawY = deltaY / maxRadius;
        const rawMagnitude = Math.min(1, Math.sqrt(rawX * rawX + rawY * rawY));

        if (rawMagnitude < this.touchJoystickDeadZone) {
            joystick.x = 0;
            joystick.y = 0;
        } else {
            const adjustedMagnitude = ((rawMagnitude - this.touchJoystickDeadZone) / (1 - this.touchJoystickDeadZone)) * this.touchJoystickInputScale;
            const directionX = rawX / rawMagnitude;
            const directionY = rawY / rawMagnitude;
            joystick.x = directionX * adjustedMagnitude;
            joystick.y = directionY * adjustedMagnitude;
        }

        // Update visual position
        const offsetX = (deltaX / maxRadius) * (maxRadius * 0.5);
        const offsetY = (deltaY / maxRadius) * (maxRadius * 0.5);
        const stick = container.querySelector('.joystick-stick');
        stick.style.transform = `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`;
    }

    setAutoclicker(enabled) {
        this.autoclickerEnabled = enabled;
        const btn = document.getElementById('autoclicker-btn');
        const pcBtn = document.getElementById('autoclicker-btn-pc');
        const pcState = document.getElementById('autoclicker-pc-state');

        if (enabled) {
            if (btn) btn.classList.add('active');
            if (pcBtn) { pcBtn.classList.add('active'); pcBtn.setAttribute('aria-pressed', 'true'); }
            if (pcState) pcState.textContent = 'AN';
            this._lastAutoClickTime = 0;
        } else {
            if (btn) btn.classList.remove('active');
            if (pcBtn) { pcBtn.classList.remove('active'); pcBtn.setAttribute('aria-pressed', 'false'); }
            if (pcState) pcState.textContent = 'AUS';
        }
        playSound('autoclickerToggle');
        showMessage(enabled ? '⚙ Autoclicker AN' : '⚙ Autoclicker AUS', enabled ? '#00ff66' : '#ff5577');
    }

    getMovementDirection() {
        // PERF: Reuse preallocated vectors to avoid GC pressure every frame
        if (!this._dirVec) {
            this._dirVec = new THREE.Vector3();
            this._fwdVec = new THREE.Vector3();
            this._rgtVec = new THREE.Vector3();
        }
        const dir = this._dirVec.set(0, 0, 0);
        const sinYaw = Math.sin(this.yaw);
        const cosYaw = Math.cos(this.yaw);
        const forward = this._fwdVec.set(-sinYaw, 0, -cosYaw);
        const right   = this._rgtVec.set(cosYaw,  0, -sinYaw);

        if (this.keys['KeyW']) dir.add(forward);
        if (this.keys['KeyS']) dir.sub(forward);
        if (this.keys['KeyA']) dir.sub(right);
        if (this.keys['KeyD']) dir.add(right);

        // Touch joystick input
        if (this.touchJoystickLeft && this.touchJoystickLeft.isActive) {
            dir.addScaledVector(forward, -this.touchJoystickLeft.y);
            dir.addScaledVector(right, this.touchJoystickLeft.x);
        }

        if (dir.lengthSq() > 0) dir.normalize();
        return dir;
    }

    update(dt) {
        this._lastDt = dt;
        if (this.mineCooldown > 0) this.mineCooldown -= dt;
        if (this.gasSlowTimer > 0) this.gasSlowTimer -= dt;
        if (this.lavaImmuneTimer > 0) this.lavaImmuneTimer -= dt;

        const stage = (GAME_LEVELS[this.world.gameLevel] || GAME_LEVELS[0]);
        const gravityMult = stage.gravityMultiplier ?? 1.0;
        const gasFactor = this.gasSlowTimer > 0 ? 0.55 : 1.0;

        this._checkLavaContact();

        // Handle autoclicker
        if (this.autoclickerEnabled) {
            this._lastAutoClickTime += dt;
            if (this._lastAutoClickTime >= 0.1) { // 100ms interval
                this.breakBlock();
                this._lastAutoClickTime = 0;
            }
        } else if (this.isMining && this.mineCooldown <= 0) {
            this.breakBlock();
        }

        const speed = (this.sprinting ? 1.6 : 1.0) * (this.flying ? this.FLY_SPEED : this.WALK_SPEED) * gasFactor;
        const dir = this.getMovementDirection();

        if (this.flying) {
            this.velocity.x = dir.x * speed;
            this.velocity.z = dir.z * speed;
            if (this.keys['Space']) this.velocity.y = this.FLY_SPEED * 0.7;
            else if (this.keys['ShiftLeft']) this.velocity.y = -this.FLY_SPEED * 0.7;
            else this.velocity.y *= 0.8;
        } else {
            this.velocity.x = dir.x * speed;
            this.velocity.z = dir.z * speed;
            this.velocity.y += this.GRAVITY * gravityMult * dt;
            if (this.keys['Space'] && this.onGround) {
                this.velocity.y = this.JUMP_FORCE * Math.max(1, 1 / Math.sqrt(gravityMult));
                this.onGround = false;
                playSound('jump');
            }
        }

        this.moveAndCollide(dt);

        // Camera
        this.camera.position.set(
            this.position.x,
            this.position.y + this.height * 0.85,
            this.position.z
        );
        this.camera.rotation.order = 'YXZ';
        this.camera.rotation.y = this.yaw;
        this.camera.rotation.x = this.pitch;

        // View bobbing & weapon animation
        this._updateWeaponAnim(dt, dir);

        // Update flying dynamites
        this._updateDynamites(dt);
    }

    // ─── Weapon Animation ──────────────────────────────────────────
    _updateWeaponAnim(dt, moveDir) {
        if (!this._weaponPivot) return;

        const moving = moveDir.lengthSq() > 0 && this.onGround && !this.flying;

        // Bob speed based on sprint
        const bobSpeed = this.sprinting ? 9 : 6;
        if (moving) {
            this._bobTime += dt * bobSpeed;
            this._bobAmount += (1.0 - this._bobAmount) * Math.min(1, dt * 8);
        } else {
            this._bobAmount += (0.0 - this._bobAmount) * Math.min(1, dt * 8);
        }

        const bob = Math.sin(this._bobTime) * 0.018 * this._bobAmount;
        const bobX = Math.cos(this._bobTime * 0.5) * 0.009 * this._bobAmount;

        // Recoil decay
        this._recoilOffset += (0 - this._recoilOffset) * Math.min(1, dt * 12);

        // Apply to pivot
        this._weaponPivot.position.set(
            0.28 + bobX,
            -0.22 + bob,
            -0.45 + this._recoilOffset
        );
        this._weaponPivot.rotation.x = this._recoilOffset * 0.8;

        // Spin the energy tip
        if (this._weaponTip) {
            this._weaponTip.rotation.y += dt * (this.isMining ? 6 : 2);
        }
    }

    _triggerRecoil() {
        this._recoilOffset = 0.06;
    }

    // ─── Physics ──────────────────────────────────────────────────
    moveAndCollide(dt) {
        const newX = this.position.x + this.velocity.x * dt;
        if (!this.checkCollision(newX, this.position.y, this.position.z)) {
            this.position.x = newX;
        } else {
            this.velocity.x = 0;
        }

        const newZ = this.position.z + this.velocity.z * dt;
        if (!this.checkCollision(this.position.x, this.position.y, newZ)) {
            this.position.z = newZ;
        } else {
            this.velocity.z = 0;
        }

        const newY = this.position.y + this.velocity.y * dt;
        if (!this.checkCollision(this.position.x, newY, this.position.z)) {
            this.position.y = newY;
            if (this.velocity.y > 0) this.onGround = false;
        } else {
            if (this.velocity.y < 0) {
                this.onGround = true;
                this.position.y = Math.ceil(this.position.y + this.velocity.y * dt) - (this.velocity.y < 0 ? 0 : 1);
            }
            this.velocity.y = 0;
        }
    }

    _checkLavaContact() {
        const hw = this.width / 2;
        const x = this.position.x, y = this.position.y, z = this.position.z;
        const points = [
            [x, y + 0.2, z], [x, y + this.height * 0.5, z],
            [x - hw, y + 0.2, z - hw], [x + hw, y + 0.2, z + hw]
        ];
        let inLava = false;
        for (const [px, py, pz] of points) {
            const b = this.world.getBlock(px, py, pz);
            if (b === BLOCK.LAVA) { inLava = true; break; }
        }

        if (inLava) {
            this._lavaDamageTimer = (this._lavaDamageTimer || 0) + this._lastDt;
            if (this._lavaDamageTimer >= 1.0) {
                this._lavaDamageTimer = 0;
                this._burnInLava();
            }
            // Gentle upward push so the player isn't stuck sinking in lava
            if (this.velocity.y < 2) this.velocity.y = 2;
        } else {
            this._lavaDamageTimer = 0;
        }
    }

    _burnInLava() {
        const penalty = Math.max(5, Math.round(this.money * 0.06));
        this.money = Math.max(0, this.money - penalty);
        updateMoneyDisplay(this.money);
        showMessage(`🔥 Lava! -$${penalty}/s`, '#ff3300');
        playSound('lava');
    }

    checkCollision(x, y, z) {
        const hw = this.width / 2;
        const steps = [
            [-hw, 0, -hw], [hw, 0, -hw], [-hw, 0, hw], [hw, 0, hw],
            [-hw, this.height * 0.5, -hw], [hw, this.height * 0.5, -hw],
            [-hw, this.height * 0.5, hw], [hw, this.height * 0.5, hw],
            [-hw, this.height, -hw], [hw, this.height, -hw], [-hw, this.height, hw], [hw, this.height, hw],
        ];

        for (const [dx, dy, dz] of steps) {
            const bx = Math.floor(x + dx);
            const by = Math.floor(y + dy);
            const bz = Math.floor(z + dz);
            const b = this.world.getBlock(bx, by, bz);
            if (b !== BLOCK.AIR && b !== BLOCK.LAVA && b !== undefined) {
                return true;
            }
        }
        return false;
    }

    // ─── Raycasting ───────────────────────────────────────────────
    raycast() {
        // PERF: Preallocate to avoid per-call GC churn
        if (!this._rcDir) {
            this._rcDir = new THREE.Vector3();
            this._rcPos = new THREE.Vector3();
            this._rcPrev = new THREE.Vector3();
            this._rcEye = new THREE.Vector3();
            this._rcEuler = new THREE.Euler(0, 0, 0, 'YXZ');
        }
        this._rcEuler.set(this.pitch, this.yaw, 0);
        const rayDir = this._rcDir.set(0, 0, -1).applyEuler(this._rcEuler);

        const eyePos = this._rcEye.set(
            this.position.x,
            this.position.y + this.height * 0.85,
            this.position.z
        );

        const pos = this._rcPos.copy(eyePos);
        const step = 0.15; // PERF: slightly larger step — negligible accuracy loss
        let prevPos = this._rcPrev.copy(pos);

        for (let t = 0; t < this.REACH; t += step) {
            prevPos.copy(pos);
            pos.addScaledVector(rayDir, step);

            const bx = Math.floor(pos.x);
            const by = Math.floor(pos.y);
            const bz = Math.floor(pos.z);
            const b = this.world.getBlock(bx, by, bz);

            if (b !== BLOCK.AIR && b !== undefined) {
                return {
                    hit: { x: bx, y: by, z: bz },
                    prev: { x: Math.floor(prevPos.x), y: Math.floor(prevPos.y), z: Math.floor(prevPos.z) },
                    blockId: b
                };
            }
        }
        return null;
    }

    // ─── Block Interaction ────────────────────────────────────────
    breakBlock() {
        const hit = this.raycast();
        if (!hit) return;

        const b = hit.blockId;
        if (b === BLOCK.BEDROCK) {
            showMessage('Kann nicht abgebaut werden!');
            this.mineCooldown = 0.5;
            return;
        }

        const value = getBlockValue(b, this.world.gameLevel);
        if (value > 0) {
            this.money += value;
            updateMoneyDisplay(this.money);
            showMessage(`+$${value}`, '#66fcf1');
            playSound('money');
        } else if (value < 0) {
            this.money = Math.max(0, this.money + value);
            updateMoneyDisplay(this.money);
            showMessage(`⚠ Falle! -$${Math.abs(value)}`, '#ff1133');
            playSound('trap');
        } else {
            playSound('breakBlock');
        }

        if (b === BLOCK.GAS_POCKET) {
            const stage = GAME_LEVELS[this.world.gameLevel] || GAME_LEVELS[0];
            this.gasSlowTimer = stage.gasSlowSeconds || 3.0;
            showMessage('☣ Gas freigesetzt! Verlangsamt...', '#88ff55');
            playSound('gas');
        }

        const hardness = getBlockHardness(b, this.world.gameLevel);
        this.mineCooldown = (hardness * 0.4) / this.miningPower * (this.gasSlowTimer > 0 ? 1.6 : 1);

        this.world.setBlock(hit.hit.x, hit.hit.y, hit.hit.z, BLOCK.AIR);
        showBreakEffect(hit.hit, b);
        this._triggerRecoil();
    }

    placeScaffold() {
        if (this.money < 5) {
            showMessage('Nicht genug Geld ($5) für ein Gerüst!', '#ff007f');
            return;
        }

        const hit = this.raycast();
        if (!hit) return;
        const { x, y, z } = hit.prev;

        const px = Math.floor(this.position.x);
        const pz = Math.floor(this.position.z);
        const py0 = Math.floor(this.position.y);
        const py1 = Math.floor(this.position.y + this.height);

        if (x === px && z === pz && y >= py0 && y <= py1) return;

        this.money -= 5;
        updateMoneyDisplay(this.money);
        this.world.setBlock(x, y, z, BLOCK.CYBER_ROCK);
    }

    // ─── Dynamite Throw ───────────────────────────────────────────
    throwDynamite() {
        if (!this._scene) return;

        const rayDir = new THREE.Vector3(0, 0, -1);
        rayDir.applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));

        const eyePos = new THREE.Vector3(
            this.position.x,
            this.position.y + this.height * 0.85,
            this.position.z
        );

        // Build dynamite mesh — a little red glowing box
        const geo = new THREE.BoxGeometry(0.3, 0.3, 0.5);
        const mat = new THREE.MeshStandardMaterial({
            color: 0xff2020,
            emissive: 0xff0000,
            emissiveIntensity: 2.0,
            roughness: 0.6
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(eyePos);
        this._scene.add(mesh);

        // Add a glowing fuse spark
        const sparkGeo = new THREE.SphereGeometry(0.08, 4, 4);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const spark = new THREE.Mesh(sparkGeo, sparkMat);
        spark.position.set(0, 0.2, 0.2);
        mesh.add(spark);

        const vel = rayDir.clone().multiplyScalar(12);
        vel.y += 3; // slight upward arc

        this._dynamites.push({
            mesh,
            spark,
            vel,
            life: 2.5,    // seconds until explosion
            spinX: (Math.random() - 0.5) * 4,
            spinZ: (Math.random() - 0.5) * 4,
        });

        showMessage('💣 Dynamit geworfen!', '#ff007f');
    }

    _updateDynamites(dt) {
        for (let i = this._dynamites.length - 1; i >= 0; i--) {
            const d = this._dynamites[i];
            d.life -= dt;

            // Simple arc physics
            d.vel.y -= 20 * dt;
            d.mesh.position.addScaledVector(d.vel, dt);
            d.mesh.rotation.x += d.spinX * dt;
            d.mesh.rotation.z += d.spinZ * dt;

            // Spark flicker
            if (d.spark) {
                d.spark.material.opacity = 0.5 + Math.random() * 0.5;
                d.spark.scale.setScalar(0.7 + Math.random() * 0.6);
            }

            // Bounce off blocks (simple ground check)
            const pos = d.mesh.position;
            const blockBelow = this.world.getBlock(Math.floor(pos.x), Math.floor(pos.y - 0.3), Math.floor(pos.z));
            if (blockBelow !== BLOCK.AIR && blockBelow !== undefined) {
                d.vel.y = Math.abs(d.vel.y) * 0.3;
                d.vel.x *= 0.7;
                d.vel.z *= 0.7;
                pos.y = Math.ceil(pos.y - 0.3) + 0.3;
            }

            // Explode
            if (d.life <= 0) {
                this._explodeDynamiteAt(d.mesh.position);
                this._scene.remove(d.mesh);
                d.mesh.geometry.dispose();
                this._dynamites.splice(i, 1);
            }
        }
    }

    _explodeDynamiteAt(pos) {
        const center = {
            x: Math.floor(pos.x),
            y: Math.floor(pos.y),
            z: Math.floor(pos.z)
        };
        let totalValue = 0;
        const radius = 2; // 5x5x5 explosion

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dz = -radius; dz <= radius; dz++) {
                    if (dx*dx + dy*dy + dz*dz > radius*radius + 1) continue; // sphere shape
                    const bx = center.x + dx;
                    const by = center.y + dy;
                    const bz = center.z + dz;

                    const bId = this.world.getBlock(bx, by, bz);
                    if (bId !== BLOCK.AIR && bId !== BLOCK.BEDROCK && bId !== undefined) {
                        totalValue += getBlockValue(bId, this.world.gameLevel);
                        this.world.setBlock(bx, by, bz, BLOCK.AIR);
                        showBreakEffect({x: bx, y: by, z: bz}, bId);
                    }
                }
            }
        }

        playSound('explosion');

        // Player is hurt if standing within the blast radius
        const playerDist3D = this.position.distanceTo(new THREE.Vector3(center.x + 0.5, center.y + 0.5, center.z + 0.5));
        const blastRadiusWorld = radius + 1.5;
        if (playerDist3D <= blastRadiusWorld) {
            const closeness = 1 - (playerDist3D / blastRadiusWorld);
            const penalty = Math.max(10, Math.round(this.money * 0.15 * closeness));
            this.money = Math.max(0, this.money - penalty);
            updateMoneyDisplay(this.money);
            showMessage(`💥 Explosionsschaden! -$${penalty}`, '#ff5500');
        }

        if (totalValue > 0) {
            this.money += totalValue;
            updateMoneyDisplay(this.money);
            showMessage(`💥 BOOM: +$${totalValue}`, '#ff007f');
        } else {
            showMessage('💥 BOOM!', '#ff007f');
        }
    }

    // Legacy explodeDynamite kept for compatibility (now just throws instead)
    explodeDynamite() {
        this.throwDynamite();
    }

    respawn() {
        const spawnY = this.world.getTerrainHeight(8, 8) + 3;
        this.position.set(8, spawnY, 8);
        this.velocity.set(0, 0, 0);
    }

    // Called when advancing to a new game level: every level starts fresh,
    // so all purchased upgrades must be unlocked again.
    resetUpgrades() {
        this.miningPower = 1.0;
        this.REACH = 6;
        this.flyingUnlocked = false;
        this.flying = false;
        this.hasDynamite = false;
        this.gasSlowTimer = 0;
        this.lavaImmuneTimer = 0;
        this._lavaDamageTimer = 0;
        this.setWeaponLevel(0);
    }
}