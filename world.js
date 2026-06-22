// World chunk system and terrain generation
// PERF: Uses BufferGeometry merging instead of per-type InstancedMesh
//       -> dramatically fewer draw calls per chunk rebuild.
const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 96;
const SEA_LEVEL = 20;
const RENDER_DIST = 3; // chunks in each direction

class World {
    constructor(scene) {
        this.scene = scene;
        this.noise = new SimplexNoise(Math.random());
        this.noise2 = new SimplexNoise(Math.random());
        // Map: "cx,cz" -> chunk data {blocks, meshes}
        this.chunks = new Map();
        // Flat block map for fast lookup: "x,y,z" -> blockId
        this.blockMap = new Map();
        // Pending chunk loads queued for next frame
        this._pendingLoads = new Set();
        // Pending chunk unloads queued for next frames to avoid big spikes
        this._pendingUnloads = new Set();
        // Debounce: chunks pending mesh rebuild (key -> true)
        this._dirtyChunks = new Set();

        // Pre-build a unit box for face extraction
        this._faceVerts = this._buildFaceVerts();
        // Cache: blockId+theme -> [mat0...mat5]
        this._matCache = {};
        // Current color theme and game progression level
        this.currentLevel = 0;
        this.gameLevel = 0;
    }

    // Returns an object mapping direction index 0-5 -> Float32Array of positions (4 verts * 3 floats)
    _buildFaceVerts() {
        // Per-face vertices of a unit box centered at 0, bottom-left at origin
        // Order: +X, -X, +Y, -Y, +Z, -Z
        return [
            // +X face
            new Float32Array([1,0,0, 1,1,0, 1,1,1, 1,0,1]),
            // -X face
            new Float32Array([0,0,1, 0,1,1, 0,1,0, 0,0,0]),
            // +Y face
            new Float32Array([0,1,0, 0,1,1, 1,1,1, 1,1,0]),
            // -Y face
            new Float32Array([0,0,1, 0,0,0, 1,0,0, 1,0,1]),
            // +Z face
            new Float32Array([1,0,1, 1,1,1, 0,1,1, 0,0,1]),
            // -Z face
            new Float32Array([0,0,0, 0,1,0, 1,1,0, 1,0,0]),
        ];
    }

    getMaterials(blockId) {
        const cacheKey = `${blockId}_${this.currentLevel}`;
        if (!this._matCache[cacheKey]) {
            this._matCache[cacheKey] = getBlockMaterials(blockId, this.currentLevel);
        }
        return this._matCache[cacheKey];
    }

    // Get terrain height at world position x, z
    getTerrainHeight(wx, wz) {
        const stage = GAME_LEVELS[this.gameLevel] || GAME_LEVELS[0];
        const scale = stage.roughness;
        const base = this.noise.fbm(wx * scale, wz * scale, 4, 0.5, 2.0);
        const ridge = this.noise2.fbm((wx + 1000) * scale * 1.7, (wz - 1000) * scale * 1.7, 3, 0.55, 2.1);
        const extra = this.gameLevel >= 2 ? Math.abs(ridge) * stage.depthBonus : 0;
        return Math.min(CHUNK_HEIGHT - 4, Math.floor(stage.heightBase + base * stage.heightAmp + extra));
    }

    // Generate all blocks for a chunk
    generateChunk(cx, cz) {
        const blocks = {};
        const stage = GAME_LEVELS[this.gameLevel] || GAME_LEVELS[0];
        const ore = stage.oreMultiplier;

        for (let lx = 0; lx < CHUNK_SIZE; lx++) {
            for (let lz = 0; lz < CHUNK_SIZE; lz++) {
                const wx = cx * CHUNK_SIZE + lx;
                const wz = cz * CHUNK_SIZE + lz;
                const surfaceY = this.getTerrainHeight(wx, wz);

                for (let ly = 0; ly <= surfaceY; ly++) {
                    let blockId = BLOCK.AIR;

                    const caveNoise = this.gameLevel >= 1
                        ? this.noise2.fbm(wx * 0.09, ly * 0.09 + wz * 0.02, 3, 0.5, 2.0)
                        : -1;
                    const hasCave = ly > 8 && ly < surfaceY - 5 && caveNoise > 0.58 - this.gameLevel * 0.035;

                    // Lava lake: carved directly out of the rock using a low-frequency
                    // 2D basin noise (independent of cave generation) restricted to a
                    // thin band near lavaLevel, so it reads as a flat lake instead of
                    // a vertical pillar. Spawn area is excluded so players never
                    // spawn inside solid lava.
                    let inLavaLake = false;
                    if (stage.hasLava) {
                        const lavaLevel = stage.lavaLevel ?? 14;
                        const lavaBandBottom = Math.max(2, lavaLevel - 5);
                        const distToSpawn = Math.hypot(wx - 8, wz - 8);
                        if (ly >= lavaBandBottom && ly <= lavaLevel && distToSpawn > 10) {
                            const basinNoise = this.noise.fbm(wx * 0.035, wz * 0.035, 2, 0.5, 2.0);
                            inLavaLake = basinNoise > 0.22;
                        }
                    }

                    if (ly === 0) {
                        blockId = BLOCK.BEDROCK;
                    } else if (inLavaLake) {
                        blockId = BLOCK.LAVA;
                    } else if (hasCave) {
                        blockId = BLOCK.AIR;
                    } else if (ly < surfaceY - 20) {
                        const r = Math.random();
                        if (stage.hasLava && ly < 14 && r < 0.012) blockId = BLOCK.LAVA;
                        else if (stage.hasGas && r < 0.012) blockId = BLOCK.GAS_POCKET;
                        else if (stage.hasTraps && r < 0.022) blockId = BLOCK.TRAP_CRYSTAL;
                        else if (r < 0.005 * ore) blockId = BLOCK.GOLD_CRYSTAL;
                        else if (r < 0.015 * ore) blockId = BLOCK.NEON_MAGENTA_CRYSTAL;
                        else if (r < 0.04 * ore) blockId = BLOCK.NEON_BLUE_CRYSTAL;
                        else blockId = BLOCK.DEEP_ROCK;
                    } else if (ly < surfaceY) {
                        const r = Math.random();
                        if (stage.hasGas && r < 0.006) blockId = BLOCK.GAS_POCKET;
                        else if (stage.hasTraps && r < 0.014) blockId = BLOCK.TRAP_CRYSTAL;
                        else if (r < 0.001 * ore) blockId = BLOCK.NEON_MAGENTA_CRYSTAL;
                        else if (r < 0.02 * ore) blockId = BLOCK.NEON_BLUE_CRYSTAL;
                        else blockId = BLOCK.CYBER_ROCK;
                    } else {
                        blockId = BLOCK.CYBER_ROCK;
                    }

                    if (blockId !== BLOCK.AIR) {
                        const key = `${lx},${ly},${lz}`;
                        blocks[key] = blockId;
                        this.blockMap.set(`${wx},${ly},${wz}`, blockId);
                    }
                }
            }
        }

        return blocks;
    }

    getBlock(wx, wy, wz) {
        return this.blockMap.get(`${Math.floor(wx)},${Math.floor(wy)},${Math.floor(wz)}`) ?? BLOCK.AIR;
    }

    setBlock(wx, wy, wz, id) {
        const x = Math.floor(wx), y = Math.floor(wy), z = Math.floor(wz);
        const key = `${x},${y},${z}`;

        if (id === BLOCK.AIR) {
            this.blockMap.delete(key);
        } else {
            this.blockMap.set(key, id);
        }

        const cx = Math.floor(x / CHUNK_SIZE);
        const cz = Math.floor(z / CHUNK_SIZE);
        const chunkKey = `${cx},${cz}`;

        if (this.chunks.has(chunkKey)) {
            const chunk = this.chunks.get(chunkKey);
            const lx = x - cx * CHUNK_SIZE;
            const lz = z - cz * CHUNK_SIZE;
            if (id === BLOCK.AIR) {
                delete chunk.blocks[`${lx},${y},${lz}`];
            } else {
                chunk.blocks[`${lx},${y},${lz}`] = id;
            }
            // Mark dirty instead of rebuilding immediately
            this._dirtyChunks.add(chunkKey);
        }
    }

    // PERF: Build ONE merged mesh per block type per chunk.
    // Uses manual geometry merging — avoids THREE.InstancedMesh overhead
    // and reduces draw calls from N*types to just 1 per block type.
    buildChunkMesh(cx, cz, blocks) {
        const chunkKey = `${cx},${cz}`;

        // Remove & dispose old meshes
        if (this.chunks.has(chunkKey)) {
            const old = this.chunks.get(chunkKey);
            for (const mesh of old.meshes) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
            }
        }

        const dirs = [
            [1,0,0],[-1,0,0],
            [0,1,0],[0,-1,0],
            [0,0,1],[0,0,-1]
        ];

        // UVs for a face (same for all faces)
        const faceUVs = new Float32Array([0,0, 0,1, 1,1, 1,0]);
        // Index pattern for a quad (2 triangles)
        const quadIdx = [0,1,2, 0,2,3];

        // Collect face geometry per block type
        // blockId -> { positions: [], normals: [], uvs: [], indices: [] }
        const typeGeos = {};

        const blockEntries = Object.entries(blocks);

        for (const [key, blockId] of blockEntries) {
            if (blockId === BLOCK.AIR) continue;
            const [lx, ly, lz] = key.split(',').map(Number);
            const wx = cx * CHUNK_SIZE + lx;
            const wz = cz * CHUNK_SIZE + lz;

            for (let fi = 0; fi < 6; fi++) {
                const [dx, dy, dz] = dirs[fi];
                const nx = lx+dx, ny = ly+dy, nz = lz+dz;
                let neighborId;
                if (nx >= 0 && nx < CHUNK_SIZE && ny >= 0 && ny < CHUNK_HEIGHT && nz >= 0 && nz < CHUNK_SIZE) {
                    neighborId = blocks[`${nx},${ny},${nz}`] ?? BLOCK.AIR;
                } else {
                    neighborId = this.blockMap.get(`${wx+dx},${ly+dy},${wz+dz}`) ?? BLOCK.AIR;
                }

                // Only render face if neighbor is air (or bedrock for side visibility)
                if (neighborId !== BLOCK.AIR) continue;

                if (!typeGeos[blockId]) {
                    typeGeos[blockId] = { positions: [], normals: [], uvs: [], indices: [] };
                }
                const geo = typeGeos[blockId];
                const base = geo.positions.length / 3; // current vertex count

                const fv = this._faceVerts[fi];
                // Add 4 verts offset by block position
                for (let v = 0; v < 4; v++) {
                    geo.positions.push(fv[v*3+0] + wx, fv[v*3+1] + ly, fv[v*3+2] + wz);
                    geo.normals.push(dx, dy, dz);
                    geo.uvs.push(faceUVs[v*2], faceUVs[v*2+1]);
                }
                for (const i of quadIdx) geo.indices.push(base + i);
            }
        }

        const meshes = [];

        for (const [blockId, data] of Object.entries(typeGeos)) {
            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
            geo.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
            geo.setAttribute('uv', new THREE.Float32BufferAttribute(data.uvs, 2));
            geo.setIndex(data.indices);

            // Use first material from array (all 6 sides share the same material for each block type)
            const mats = this.getMaterials(Number(blockId));
            const mat = mats[0]; // MeshStandardMaterial

            const mesh = new THREE.Mesh(geo, mat);
            mesh.castShadow = false;
            mesh.receiveShadow = false; // PERF: skip shadow receive for most blocks
            mesh.frustumCulled = true;
            this.scene.add(mesh);
            meshes.push(mesh);
        }

        this.chunks.set(chunkKey, { blocks, meshes });
    }

    rebuildChunkMesh(cx, cz) {
        const chunkKey = `${cx},${cz}`;
        if (!this.chunks.has(chunkKey)) return;
        const { blocks } = this.chunks.get(chunkKey);
        this.buildChunkMesh(cx, cz, blocks);
    }

    // PERF: Process at most 2 dirty chunk rebuilds per frame
    flushDirtyChunks() {
        let processed = 0;
        for (const key of this._dirtyChunks) {
            if (processed >= 2) break;
            const [cx, cz] = key.split(',').map(Number);
            this.rebuildChunkMesh(cx, cz);
            this._dirtyChunks.delete(key);
            processed++;
        }
    }

    loadChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (this.chunks.has(key)) return;
        const blocks = this.generateChunk(cx, cz);
        this.buildChunkMesh(cx, cz, blocks);
    }

    unloadChunk(cx, cz) {
        const key = `${cx},${cz}`;
        if (!this.chunks.has(key)) return;
        const { meshes } = this.chunks.get(key);
        for (const mesh of meshes) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
        }
        this.chunks.delete(key);
    }

    setLevel(levelIndex) {
        this.setColorTheme(levelIndex);
    }

    setColorTheme(levelIndex) {
        this.currentLevel = Math.min(Math.max(0, levelIndex), LEVEL_THEMES.length - 1);
        // Clear material cache for new color theme
        this._matCache = {};
        // Rebuild all visible chunks with new materials
        for (const key of this.chunks.keys()) {
            this._dirtyChunks.add(key);
        }
    }

    setGameLevel(levelIndex) {
        this.gameLevel = Math.min(Math.max(0, levelIndex), GAME_LEVELS.length - 1);
        this.noise = new SimplexNoise(Math.random());
        this.noise2 = new SimplexNoise(Math.random());
        this.resetWorld();
    }

    resetWorld() {
        for (const { meshes } of this.chunks.values()) {
            for (const mesh of meshes) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();
            }
        }
        this.chunks.clear();
        this.blockMap.clear();
        this._pendingLoads.clear();
        this._pendingUnloads.clear();
        this._dirtyChunks.clear();
    }

    updateChunks(playerX, playerZ) {
        const pcx = Math.floor(playerX / CHUNK_SIZE);
        const pcz = Math.floor(playerZ / CHUNK_SIZE);

        for (let dx = -RENDER_DIST; dx <= RENDER_DIST; dx++) {
            for (let dz = -RENDER_DIST; dz <= RENDER_DIST; dz++) {
                const kx = pcx + dx;
                const kz = pcz + dz;
                const key = `${kx},${kz}`;
                if (!this.chunks.has(key)) {
                    this._pendingLoads.add(key);
                }
            }
        }

        // Mark far-away chunks for unload (deferred to processQueue)
        for (const [key] of this.chunks) {
            const [kcx, kcz] = key.split(',').map(Number);
            if (Math.abs(kcx - pcx) > RENDER_DIST + 1 || Math.abs(kcz - pcz) > RENDER_DIST + 1) {
                this._pendingUnloads.add(key);
            }
        }

        for (const key of this._pendingLoads) {
            const [kcx, kcz] = key.split(',').map(Number);
            if (Math.abs(kcx - pcx) > RENDER_DIST + 1 || Math.abs(kcz - pcz) > RENDER_DIST + 1) {
                this._pendingLoads.delete(key);
            }
        }
    }

    // PERF: Load only 1 chunk per frame to avoid stutter spikes
    processQueue() {
        // Process at most 1 unload and 1 load per frame to avoid large CPU spikes
        if (this._pendingUnloads.size > 0) {
            const key = this._pendingUnloads.values().next().value;
            this._pendingUnloads.delete(key);
            const [cx, cz] = key.split(',').map(Number);
            this.unloadChunk(cx, cz);
        }

        if (this._pendingLoads.size > 0) {
            const key = this._pendingLoads.values().next().value;
            this._pendingLoads.delete(key);
            const [cx, cz] = key.split(',').map(Number);
            this.loadChunk(cx, cz);
        }

        this.flushDirtyChunks();
    }
}