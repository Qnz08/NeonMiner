// Simplex Noise 2D - Fast procedural terrain generation
class SimplexNoise {
    constructor(seed = Math.random()) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);

        for (let i = 0; i < 256; i++) this.p[i] = i;

        // Seeded shuffle
        let n = seed * 4294967296;
        for (let i = 255; i > 0; i--) {
            n = (n * 1664525 + 1013904223) & 0xffffffff;
            const j = ((n >>> 0) % (i + 1));
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }

        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }

        this.grad3 = [
            [1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
            [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
            [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]
        ];
    }

    dot(g, x, y) { return g[0]*x + g[1]*y; }

    noise2D(xin, yin) {
        const F2 = 0.5*(Math.sqrt(3)-1);
        const G2 = (3-Math.sqrt(3))/6;

        const s = (xin+yin)*F2;
        const i = Math.floor(xin+s);
        const j = Math.floor(yin+s);

        const t = (i+j)*G2;
        const X0 = i-t, Y0 = j-t;
        const x0 = xin-X0, y0 = yin-Y0;

        let i1, j1;
        if (x0 > y0) { i1=1; j1=0; } else { i1=0; j1=1; }

        const x1 = x0-i1+G2, y1 = y0-j1+G2;
        const x2 = x0-1+2*G2, y2 = y0-1+2*G2;

        const ii = i & 255, jj = j & 255;
        const gi0 = this.permMod12[ii+this.perm[jj]];
        const gi1 = this.permMod12[ii+i1+this.perm[jj+j1]];
        const gi2 = this.permMod12[ii+1+this.perm[jj+1]];

        let t0 = 0.5-x0*x0-y0*y0;
        const n0 = t0 < 0 ? 0 : (t0*=t0, t0*t0*this.dot(this.grad3[gi0],x0,y0));

        let t1 = 0.5-x1*x1-y1*y1;
        const n1 = t1 < 0 ? 0 : (t1*=t1, t1*t1*this.dot(this.grad3[gi1],x1,y1));

        let t2 = 0.5-x2*x2-y2*y2;
        const n2 = t2 < 0 ? 0 : (t2*=t2, t2*t2*this.dot(this.grad3[gi2],x2,y2));

        return 70*(n0+n1+n2);
    }

    // Fractal Brownian Motion for more natural terrain
    fbm(x, y, octaves = 4, persistence = 0.5, lacunarity = 2.0) {
        let value = 0, amplitude = 1, frequency = 1, max = 0;
        for (let i = 0; i < octaves; i++) {
            value += this.noise2D(x * frequency, y * frequency) * amplitude;
            max += amplitude;
            amplitude *= persistence;
            frequency *= lacunarity;
        }
        return value / max;
    }
}