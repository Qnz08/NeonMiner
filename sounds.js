// Lightweight synthesized sound effects (no external audio files needed)
// Uses the Web Audio API to generate short beeps/noise bursts on demand.
const SFX = (() => {
    let ctx = null;
    let unlocked = false;

    function getCtx() {
        if (!ctx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (!AC) return null;
            ctx = new AC();
        }
        return ctx;
    }

    function unlock() {
        if (unlocked) return;
        const c = getCtx();
        if (c && c.state === 'suspended') c.resume();
        unlocked = true;
    }
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    function tone(freq, duration, type = 'sine', startGain = 0.18, opts = {}) {
        const c = getCtx();
        if (!c) return;
        const t0 = c.currentTime;
        const osc = c.createOscillator();
        const gain = c.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        if (opts.glideTo) {
            osc.frequency.exponentialRampToValueAtTime(Math.max(1, opts.glideTo), t0 + duration);
        }
        gain.gain.setValueAtTime(0.0001, t0);
        gain.gain.linearRampToValueAtTime(startGain, t0 + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
        osc.connect(gain).connect(c.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }

    function noiseBurst(duration, startGain = 0.25, filterFreq = 1200) {
        const c = getCtx();
        if (!c) return;
        const t0 = c.currentTime;
        const bufferSize = Math.floor(c.sampleRate * duration);
        const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const src = c.createBufferSource();
        src.buffer = buffer;
        const filter = c.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(filterFreq, t0);
        filter.frequency.exponentialRampToValueAtTime(40, t0 + duration);

        const gain = c.createGain();
        gain.gain.setValueAtTime(startGain, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

        src.connect(filter).connect(gain).connect(c.destination);
        src.start(t0);
    }

    return {
        mine() { tone(180 + Math.random() * 40, 0.07, 'square', 0.07); },
        breakBlock() { tone(520, 0.09, 'triangle', 0.12, { glideTo: 220 }); },
        money() { tone(880, 0.06, 'sine', 0.1, { glideTo: 1400 }); },
        trap() { tone(160, 0.25, 'sawtooth', 0.16, { glideTo: 60 }); noiseBurst(0.15, 0.12, 600); },
        lava() { noiseBurst(0.3, 0.2, 500); tone(90, 0.3, 'sawtooth', 0.12, { glideTo: 40 }); },
        gas() { tone(300, 0.2, 'sine', 0.1, { glideTo: 500 }); },
        explosion() {
  noiseBurst(0.6, 0.2, 900, {
    filter: "lowpass",
    cutoff: 1200
  });

  tone(95, 0.35, "sine", 0.2, {
    glideTo: 35,
    attack: 0.005,
    release: 0.3,
    gain: 1.4
  });
},
        buy() { tone(660, 0.05, 'sine', 0.12, { glideTo: 880 }); setTimeout(() => tone(990, 0.08, 'sine', 0.12), 60); },
        levelUp() {
            tone(523, 0.12, 'triangle', 0.14, { glideTo: 660 });
            setTimeout(() => tone(784, 0.16, 'triangle', 0.14, { glideTo: 1046 }), 130);
        },
        deny() { tone(140, 0.12, 'square', 0.1); },
        jump() { tone(400, 0.08, 'sine', 0.08, { glideTo: 600 }); },
        autoclickerToggle() { tone(500, 0.05, 'square', 0.08, { glideTo: 700 }); }
    };
})();

function playSound(name) {
    try {
        if (SFX[name]) SFX[name]();
    } catch (e) {
        // Audio not available — fail silently
    }
}
