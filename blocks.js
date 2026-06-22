// Block type IDs
const BLOCK = {
    AIR:    0,
    CYBER_ROCK: 1,
    DEEP_ROCK:  2,
    NEON_BLUE_CRYSTAL: 3,
    NEON_MAGENTA_CRYSTAL: 4,
    GOLD_CRYSTAL: 5,
    BEDROCK: 6,
    LAVA: 7,
    GAS_POCKET: 8,
    TRAP_CRYSTAL: 9
};

// Level Themes (color palettes)
const LEVEL_THEMES = [
    {
        name: 'Cyan Neon',
        cyberRockBase: '#0b0c10',
        cyberRockLine: 'rgba(69, 162, 158, 0.4)',
        deepRockBase: '#050608',
        deepRockLine: 'rgba(31, 40, 51, 0.8)',
        deepRockSpeckle: 'rgba(102, 252, 241, 0.05)',
        crystal1Color: '#66fcf1',
        crystal1Emissive: 0x66fcf1,
        crystal2Color: '#ff007f',
        crystal2Emissive: 0xff007f,
        treasureColor: '#ffd700',
        treasureEmissive: 0xffd700
    },
    {
        name: 'Purple Neon',
        cyberRockBase: '#0b0c10',
        cyberRockLine: 'rgba(100, 50, 150, 0.4)',
        deepRockBase: '#050608',
        deepRockLine: 'rgba(50, 30, 80, 0.8)',
        deepRockSpeckle: 'rgba(150, 100, 200, 0.05)',
        crystal1Color: '#bb86fc',
        crystal1Emissive: 0xbb86fc,
        crystal2Color: '#ff00ff',
        crystal2Emissive: 0xff00ff,
        treasureColor: '#ffb3ff',
        treasureEmissive: 0xffb3ff
    },
    {
        name: 'Green Neon',
        cyberRockBase: '#0b0c10',
        cyberRockLine: 'rgba(0, 200, 100, 0.4)',
        deepRockBase: '#050608',
        deepRockLine: 'rgba(0, 100, 50, 0.8)',
        deepRockSpeckle: 'rgba(100, 255, 150, 0.05)',
        crystal1Color: '#00ff00',
        crystal1Emissive: 0x00ff00,
        crystal2Color: '#00ffaa',
        crystal2Emissive: 0x00ffaa,
        treasureColor: '#88ff00',
        treasureEmissive: 0x88ff00
    },
    {
        name: 'Orange Fire',
        cyberRockBase: '#0b0c10',
        cyberRockLine: 'rgba(255, 150, 50, 0.4)',
        deepRockBase: '#050608',
        deepRockLine: 'rgba(150, 80, 30, 0.8)',
        deepRockSpeckle: 'rgba(255, 180, 100, 0.05)',
        crystal1Color: '#ff6600',
        crystal1Emissive: 0xff6600,
        crystal2Color: '#ff0033',
        crystal2Emissive: 0xff0033,
        treasureColor: '#ffaa00',
        treasureEmissive: 0xffaa00
    },
    {
        name: 'Ice Blue',
        cyberRockBase: '#071018',
        cyberRockLine: 'rgba(130, 220, 255, 0.45)',
        deepRockBase: '#02070c',
        deepRockLine: 'rgba(40, 90, 130, 0.8)',
        deepRockSpeckle: 'rgba(180, 240, 255, 0.06)',
        crystal1Color: '#8be9ff',
        crystal1Emissive: 0x8be9ff,
        crystal2Color: '#4d8dff',
        crystal2Emissive: 0x4d8dff,
        treasureColor: '#e5fbff',
        treasureEmissive: 0xe5fbff
    },
    {
        name: 'Ruby Core',
        cyberRockBase: '#100607',
        cyberRockLine: 'rgba(255, 45, 85, 0.45)',
        deepRockBase: '#060102',
        deepRockLine: 'rgba(120, 20, 35, 0.8)',
        deepRockSpeckle: 'rgba(255, 100, 120, 0.06)',
        crystal1Color: '#ff2d55',
        crystal1Emissive: 0xff2d55,
        crystal2Color: '#ff8a00',
        crystal2Emissive: 0xff8a00,
        treasureColor: '#ffd1dc',
        treasureEmissive: 0xffd1dc
    },
    {
        name: 'Solar Gold',
        cyberRockBase: '#101008',
        cyberRockLine: 'rgba(255, 220, 90, 0.45)',
        deepRockBase: '#050503',
        deepRockLine: 'rgba(120, 100, 35, 0.85)',
        deepRockSpeckle: 'rgba(255, 230, 120, 0.06)',
        crystal1Color: '#ffe66d',
        crystal1Emissive: 0xffe66d,
        crystal2Color: '#ff9f1c',
        crystal2Emissive: 0xff9f1c,
        treasureColor: '#ffffff',
        treasureEmissive: 0xffffff
    },
    {
        name: 'Ghost White',
        cyberRockBase: '#0d0f12',
        cyberRockLine: 'rgba(230, 240, 255, 0.4)',
        deepRockBase: '#050608',
        deepRockLine: 'rgba(110, 130, 150, 0.75)',
        deepRockSpeckle: 'rgba(255, 255, 255, 0.06)',
        crystal1Color: '#f8f9fa',
        crystal1Emissive: 0xf8f9fa,
        crystal2Color: '#b8c0ff',
        crystal2Emissive: 0xb8c0ff,
        treasureColor: '#d7fffe',
        treasureEmissive: 0xd7fffe
    },
    {
        name: 'Toxic Lime',
        cyberRockBase: '#071008',
        cyberRockLine: 'rgba(180, 255, 40, 0.45)',
        deepRockBase: '#020602',
        deepRockLine: 'rgba(90, 130, 20, 0.8)',
        deepRockSpeckle: 'rgba(180, 255, 90, 0.06)',
        crystal1Color: '#baff39',
        crystal1Emissive: 0xbaff39,
        crystal2Color: '#39ff88',
        crystal2Emissive: 0x39ff88,
        treasureColor: '#eeff00',
        treasureEmissive: 0xeeff00
    },
    {
        name: 'Vapor Pink',
        cyberRockBase: '#100812',
        cyberRockLine: 'rgba(255, 120, 220, 0.45)',
        deepRockBase: '#060308',
        deepRockLine: 'rgba(130, 55, 125, 0.8)',
        deepRockSpeckle: 'rgba(255, 170, 240, 0.06)',
        crystal1Color: '#ff7ad9',
        crystal1Emissive: 0xff7ad9,
        crystal2Color: '#7a5cff',
        crystal2Emissive: 0x7a5cff,
        treasureColor: '#ffc2f2',
        treasureEmissive: 0xffc2f2
    },
    {
        name: 'Deep Sea',
        cyberRockBase: '#040c10',
        cyberRockLine: 'rgba(0, 180, 220, 0.4)',
        deepRockBase: '#01060a',
        deepRockLine: 'rgba(0, 80, 110, 0.85)',
        deepRockSpeckle: 'rgba(0, 220, 255, 0.06)',
        crystal1Color: '#00d4ff',
        crystal1Emissive: 0x00d4ff,
        crystal2Color: '#0066ff',
        crystal2Emissive: 0x0066ff,
        treasureColor: '#aef9ff',
        treasureEmissive: 0xaef9ff
    },
    {
        name: 'Blood Moon',
        cyberRockBase: '#120505',
        cyberRockLine: 'rgba(255, 60, 30, 0.45)',
        deepRockBase: '#080202',
        deepRockLine: 'rgba(130, 25, 10, 0.85)',
        deepRockSpeckle: 'rgba(255, 90, 60, 0.07)',
        crystal1Color: '#ff3300',
        crystal1Emissive: 0xff3300,
        crystal2Color: '#990000',
        crystal2Emissive: 0x990000,
        treasureColor: '#ffd9c2',
        treasureEmissive: 0xffd9c2
    },
    {
        name: 'Synth Violet',
        cyberRockBase: '#0a0614',
        cyberRockLine: 'rgba(150, 80, 255, 0.45)',
        deepRockBase: '#04020a',
        deepRockLine: 'rgba(70, 35, 130, 0.85)',
        deepRockSpeckle: 'rgba(180, 110, 255, 0.07)',
        crystal1Color: '#9d4eff',
        crystal1Emissive: 0x9d4eff,
        crystal2Color: '#ff4ecb',
        crystal2Emissive: 0xff4ecb,
        treasureColor: '#e6d1ff',
        treasureEmissive: 0xe6d1ff
    },
    {
        name: 'Copper Dusk',
        cyberRockBase: '#120c08',
        cyberRockLine: 'rgba(220, 140, 60, 0.45)',
        deepRockBase: '#070402',
        deepRockLine: 'rgba(120, 70, 20, 0.85)',
        deepRockSpeckle: 'rgba(230, 160, 90, 0.07)',
        crystal1Color: '#e3923a',
        crystal1Emissive: 0xe3923a,
        crystal2Color: '#ff5e3a',
        crystal2Emissive: 0xff5e3a,
        treasureColor: '#ffe0b3',
        treasureEmissive: 0xffe0b3
    },
    {
        name: 'Mint Static',
        cyberRockBase: '#04120c',
        cyberRockLine: 'rgba(80, 255, 190, 0.45)',
        deepRockBase: '#020806',
        deepRockLine: 'rgba(20, 120, 85, 0.85)',
        deepRockSpeckle: 'rgba(120, 255, 210, 0.07)',
        crystal1Color: '#4dffc1',
        crystal1Emissive: 0x4dffc1,
        crystal2Color: '#19c3ff',
        crystal2Emissive: 0x19c3ff,
        treasureColor: '#d4fff0',
        treasureEmissive: 0xd4fff0
    }
];

// Game progression levels. Color themes above are visual only.
const GAME_LEVELS = [
    {
        name: 'Startmine',
        goalCost: 10000,
        heightBase: 58,
        heightAmp: 9,
        roughness: 0.03,
        depthBonus: 0,
        oreMultiplier: 1.0,
        valueMultiplier: 1.0,
        hardnessMultiplier: 1.0,
        gravityMultiplier: 1.0,
        hasLava: false,
        hasGas: false,
        hasTraps: false,
        fogColor: 0x0b0c10,
        fogDensity: 0.018,
        ambientColor: 0x66fcf1
    },
    {
        name: 'Kristall-Schlucht',
        goalCost: 18000,
        heightBase: 62,
        heightAmp: 15,
        roughness: 0.045,
        depthBonus: 4,
        oreMultiplier: 1.15,
        valueMultiplier: 1.25,
        hardnessMultiplier: 1.2,
        gravityMultiplier: 1.0,
        hasLava: false,
        hasGas: true,
        hasTraps: true,
        gasSlowSeconds: 3.0,
        fogColor: 0x0a1410,
        fogDensity: 0.024,
        ambientColor: 0x39ff88
    },
    {
        name: 'Tiefenkern',
        goalCost: 32000,
        heightBase: 66,
        heightAmp: 20,
        roughness: 0.06,
        depthBonus: 8,
        oreMultiplier: 1.3,
        valueMultiplier: 1.55,
        hardnessMultiplier: 1.45,
        gravityMultiplier: 1.0,
        hasLava: true,
        hasGas: true,
        hasTraps: true,
        lavaLevel: 15,
        gasSlowSeconds: 4.0,
        fogColor: 0x140604,
        fogDensity: 0.03,
        ambientColor: 0xff5e3a
    },
    {
        name: 'Hypermine',
        goalCost: 50000,
        heightBase: 70,
        heightAmp: 24,
        roughness: 0.075,
        depthBonus: 12,
        oreMultiplier: 1.45,
        valueMultiplier: 2.0,
        hardnessMultiplier: 1.75,
        gravityMultiplier: 0.55,
        hasLava: true,
        hasGas: true,
        hasTraps: true,
        lavaLevel: 18,
        gasSlowSeconds: 5.0,
        fogColor: 0x06040f,
        fogDensity: 0.02,
        ambientColor: 0x9d4eff
    }
];

// Block display names
const BLOCK_NAMES = {
    [BLOCK.CYBER_ROCK]:    'Cyber-Gestein',
    [BLOCK.DEEP_ROCK]:     'Tiefen-Gestein',
    [BLOCK.NEON_BLUE_CRYSTAL]: 'Neon-Kristall',
    [BLOCK.NEON_MAGENTA_CRYSTAL]: 'Magenta-Kristall',
    [BLOCK.GOLD_CRYSTAL]:  'Gold-Kern',
    [BLOCK.BEDROCK]:       'Fundament',
    [BLOCK.LAVA]:          'Plasma-Lava',
    [BLOCK.GAS_POCKET]:    'Gas-Tasche',
    [BLOCK.TRAP_CRYSTAL]:  'Korrupter Kristall'
};

// Block Values ($)
const BLOCK_VALUES = {
    [BLOCK.CYBER_ROCK]:    1,
    [BLOCK.DEEP_ROCK]:     3,
    [BLOCK.NEON_BLUE_CRYSTAL]: 25,
    [BLOCK.NEON_MAGENTA_CRYSTAL]: 100,
    [BLOCK.GOLD_CRYSTAL]:  500,
    [BLOCK.BEDROCK]:       0,
    [BLOCK.LAVA]:          0,
    [BLOCK.GAS_POCKET]:    8,
    [BLOCK.TRAP_CRYSTAL]: -60
};

// Block Hardness (mining time multiplier)
const BLOCK_HARDNESS = {
    [BLOCK.CYBER_ROCK]:    1.0,
    [BLOCK.DEEP_ROCK]:     2.0,
    [BLOCK.NEON_BLUE_CRYSTAL]: 3.0,
    [BLOCK.NEON_MAGENTA_CRYSTAL]: 5.0,
    [BLOCK.GOLD_CRYSTAL]:  10.0,
    [BLOCK.BEDROCK]:       99999.0,
    [BLOCK.LAVA]:          1.5,
    [BLOCK.GAS_POCKET]:    0.6,
    [BLOCK.TRAP_CRYSTAL]: 1.8
};

function getBlockValue(blockId, gameLevel = 0) {
    const stage = GAME_LEVELS[gameLevel] || GAME_LEVELS[0];
    return Math.round((BLOCK_VALUES[blockId] || 0) * stage.valueMultiplier);
}

function getBlockHardness(blockId, gameLevel = 0) {
    if (blockId === BLOCK.BEDROCK) return BLOCK_HARDNESS[blockId];
    const stage = GAME_LEVELS[gameLevel] || GAME_LEVELS[0];
    return (BLOCK_HARDNESS[blockId] || 1.0) * stage.hardnessMultiplier;
}

// Canvas-based texture generation
function createBlockTexture(drawFn, size = 64) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, size);
    const tex = new THREE.CanvasTexture(canvas);
    tex.magFilter = THREE.LinearFilter;
    tex.minFilter = THREE.LinearMipmapLinearFilter;
    return tex;
}

function drawGrid(ctx, size, lineColor, bg) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, size, size);

    // Inner grid
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(size/2, 0); ctx.lineTo(size/2, size);
    ctx.moveTo(0, size/2); ctx.lineTo(size, size/2);
    ctx.stroke();
}

// All block textures generated via canvas
function createTextures(themeIndex = 0) {
    const theme = LEVEL_THEMES[themeIndex] || LEVEL_THEMES[0];
    const T = {};

    T.cyberRock = createBlockTexture((ctx, s) => {
        drawGrid(ctx, s, theme.cyberRockLine, theme.cyberRockBase);
        ctx.strokeStyle = theme.cyberRockLine;
        ctx.beginPath();
        ctx.moveTo(10, 10); ctx.lineTo(20, 10); ctx.lineTo(20, 30);
        ctx.stroke();
    });

    T.deepRock = createBlockTexture((ctx, s) => {
        drawGrid(ctx, s, theme.deepRockLine, theme.deepRockBase);
        ctx.fillStyle = theme.deepRockSpeckle;
        for(let i=0; i<5; i++) {
            ctx.fillRect(Math.random()*s, Math.random()*s, 4, 4);
        }
    });

    T.neonBlue = createBlockTexture((ctx, s) => {
        const grad = ctx.createLinearGradient(0, 0, s, s);
        grad.addColorStop(0, '#1f2833');
        grad.addColorStop(0.5, theme.cyberRockLine);
        grad.addColorStop(1, theme.crystal1Color);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);

        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 4, s-8, s-8);
    });

    T.neonMagenta = createBlockTexture((ctx, s) => {
        const grad = ctx.createLinearGradient(0, s, s, 0);
        grad.addColorStop(0, '#4a0e4e');
        grad.addColorStop(0.5, theme.crystal2Color);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);

        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath(); ctx.arc(s/2, s/2, s/4, 0, Math.PI*2); ctx.fill();
    });

    T.goldCore = createBlockTexture((ctx, s) => {
        const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.2, theme.treasureColor);
        grad.addColorStop(1, 'rgba(255, 255, 0, 0.6)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);

        drawGrid(ctx, s, 'rgba(255,255,255,0.3)', 'transparent');
    });

    T.bedrock = createBlockTexture((ctx, s) => {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = '#222';
        for(let i=0; i<s; i+=8) {
            ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(s, i); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, s); ctx.stroke();
        }
    });

    T.lava = createBlockTexture((ctx, s) => {
        const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s*0.7);
        grad.addColorStop(0, '#fff6c2');
        grad.addColorStop(0.35, '#ff8a00');
        grad.addColorStop(0.7, '#ff2d00');
        grad.addColorStop(1, '#3a0500');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = 'rgba(255, 200, 80, 0.5)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(Math.random()*s, Math.random()*s);
            ctx.lineTo(Math.random()*s, Math.random()*s);
            ctx.stroke();
        }
    });

    T.gasPocket = createBlockTexture((ctx, s) => {
        const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s*0.75);
        grad.addColorStop(0, 'rgba(180, 255, 140, 0.9)');
        grad.addColorStop(0.5, 'rgba(80, 200, 90, 0.6)');
        grad.addColorStop(1, 'rgba(10, 30, 15, 0.9)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = 'rgba(200, 255, 180, 0.5)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(3, 3, s-6, s-6);
        ctx.beginPath();
        for (let i = 0; i < 4; i++) {
            ctx.arc(Math.random()*s, Math.random()*s, 3 + Math.random()*3, 0, Math.PI*2);
        }
        ctx.stroke();
    });

    T.trapCrystal = createBlockTexture((ctx, s) => {
        const grad = ctx.createRadialGradient(s/2, s/2, 0, s/2, s/2, s*0.75);
        grad.addColorStop(0, 'rgba(20, 0, 0, 0.95)');
        grad.addColorStop(0.5, 'rgba(120, 0, 20, 0.85)');
        grad.addColorStop(1, 'rgba(255, 0, 40, 0.5)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, s, s);
        ctx.strokeStyle = 'rgba(255, 30, 30, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(s*0.5, s*0.1); ctx.lineTo(s*0.8, s*0.5);
        ctx.lineTo(s*0.5, s*0.9); ctx.lineTo(s*0.2, s*0.5);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(s*0.5, s*0.1); ctx.lineTo(s*0.5, s*0.9);
        ctx.moveTo(s*0.2, s*0.5); ctx.lineTo(s*0.8, s*0.5);
        ctx.stroke();
    });

    return T;
}

// Material factory with theme support
let _textureCache = {}; // Cache textures per theme

function getBlockMaterials(blockId, themeIndex = 0) {
    themeIndex = themeIndex || 0;
    const theme = LEVEL_THEMES[themeIndex];
    const cacheKey = `theme_${themeIndex}`;

    if (!_textureCache[cacheKey]) {
        _textureCache[cacheKey] = createTextures(themeIndex);
    }

    const T = _textureCache[cacheKey];

    const mat = (tex, emissiveColor = 0x000000, emissiveIntensity = 0) => {
        return new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.7,
            metalness: 0.2,
            emissive: emissiveColor,
            emissiveIntensity: emissiveIntensity
        });
    };

    const side = (m) => [m, m, m, m, m, m];

    switch(blockId) {
        case BLOCK.CYBER_ROCK:  return side(mat(T.cyberRock, 0x45a29e, 0.2));
        case BLOCK.DEEP_ROCK:   return side(mat(T.deepRock, 0x000000, 0));
        case BLOCK.NEON_BLUE_CRYSTAL: return side(mat(T.neonBlue, theme.crystal1Emissive, 1.5));
        case BLOCK.NEON_MAGENTA_CRYSTAL: return side(mat(T.neonMagenta, theme.crystal2Emissive, 2.0));
        case BLOCK.GOLD_CRYSTAL:  return side(mat(T.goldCore, theme.treasureEmissive, 2.5));
        case BLOCK.BEDROCK:     return side(mat(T.bedrock, 0x000000, 0));
        case BLOCK.LAVA:        return side(mat(T.lava, 0xff5500, 2.2));
        case BLOCK.GAS_POCKET:  return side(mat(T.gasPocket, 0x55ff77, 1.4));
        case BLOCK.TRAP_CRYSTAL: return side(mat(T.trapCrystal, 0xff1133, 2.0));
        default: return side(mat(T.cyberRock));
    }
}

// Hotbar blocks are no longer used for placing in Neon Miner
const HOTBAR_BLOCKS = [];