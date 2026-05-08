(function () {
    const FILLED_CIRCLE_CFG = { rAddRate: 26, maxLife: 16 };
    const RINGS_ANIM_CFG = {
        rsList: [0, 0.08, 0.1],
        rRoundRateList: [0, 1, 1.5, 2],
        len: 1.1 * Math.PI,
        maxLife: 23,
        segNum: 10,
        minW: 0.4,
        maxW: 3.3,
        lenStopAddPoint: 0.1,
        lenStartDimPoint: 0.4,
    };
    const CREATE_CLICK_CFG = {
        rings: {
            rsList: [0, 0.03, 0.06],
            rRoundRateList: [0, 1, 1.5, 2],
            len: 1.1 * Math.PI,
        },
        sparksCount: 4,
    };

    function ringsEndColorFromRgb(rgbString) {
        return rgbString.split(',').map(Number).map((n) => (n + 255 * 2) / 3);
    }

    class MouseSpark {
        constructor(opts = {}) {
            this.color = opts.color || '45,175,255';
            this.scale = opts.scale || 1.5;
            this.opacity = opts.opacity || 1.0;
            this.trailSpeed = opts.trailSpeed != null ? opts.trailSpeed : (opts.speed || 1.0);
            this.clickSpeed = opts.clickSpeed != null ? opts.clickSpeed : (opts.speed || 1.0);
            this.maxTrail = opts.maxTrail || 16;
            this.enableTrail = opts.enableTrail != null ? Boolean(opts.enableTrail) : true;

            this.sparksPool = [];
            this.wavesPool = [];

            this.waves = [];
            this.sparks = [];
            this.trail = [];
            this.isDown = false;
            this.lastPos = null;
            this.baseFrameMs = 1000 / 60;
            this.maxDeltaMs = 100;
            this.lastFrameTime = performance.now();

            this.ringsStartColor = [250, 252, 252];
            this.ringsEndColor = ringsEndColorFromRgb(this.color);

            this._canvas = null;
            this._initialized = false;
        }

        init(canvasId) {
            if (this._initialized) return;
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error('[MouseSpark] Canvas element not found:', canvasId);
                return;
            }

            this.mainCanvas = canvas;
            this.mainCtx = this.mainCanvas.getContext('2d');

            this.bufferCanvas = document.createElement('canvas');
            this.bufferCtx = this.bufferCanvas.getContext('2d');

            this.resize();

            window.addEventListener('resize', () => this.resize());
            this._initialized = true;

            requestAnimationFrame((now) => this.animationLoops(now));
        }

        bindEvents() {
            const getPos = (e) => ({ x: e.clientX, y: e.clientY });
            const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

            window.addEventListener('mousedown', (e) => {
                this.isDown = true;
                this.lastPos = getPos(e);
                this.createEffects(this.lastPos.x, this.lastPos.y);
            });

            window.addEventListener('mousemove', (e) => {
                if (!this.enableTrail) return;
                if (!this.isDown && !window.effectiveAlwaysTrail) return;
                const p = getPos(e);
                const prev = this.lastPos;
                if (!prev) {
                    this.lastPos = p;
                    return;
                }
                if (dist(p, prev) > 2) {
                    this.trail.push({ x: p.x, y: p.y, life: 1 });
                    if (this.trail.length > this.maxTrail) this.trail.shift();

                    if (Math.random() < 0.3) {
                        const a = Math.random() * Math.PI * 2;
                        const speedAdjust = this.scale / 1.5;
                        this.sparks.push({
                            x: p.x + Math.cos(a) * 10 * this.scale,
                            y: p.y + Math.sin(a) * 10 * this.scale,
                            vx: Math.cos(a) * 1.3 * speedAdjust,
                            vy: Math.sin(a) * 1.3 * speedAdjust,
                            rot: Math.random() * Math.PI * 2,
                            rs: 0.16,
                            s: 9 * this.scale,
                            a: 0.7,
                            f: 0.95,
                            fromClick: false,
                        });
                    }
                }
                this.lastPos = p;
            });

            window.addEventListener('mouseup', () => {
                this.isDown = false;
            });
        }

        initCanvas() {
            this.mainCanvas = document.getElementById('sparkCanvas');
            this.mainCtx = this.mainCanvas.getContext('2d');

            this.bufferCanvas = document.createElement('canvas');
            this.bufferCtx = this.bufferCanvas.getContext('2d');

            this.resize();

            window.addEventListener('resize', () => this.resize());
        }

        alpha(value) {
            return Math.max(0, Math.min(1, value * this.opacity));
        }

        resize() {
            const dpr = window.devicePixelRatio || 1;
            const w = Math.max(1, Math.floor(window.innerWidth * dpr));
            const h = Math.max(1, Math.floor(window.innerHeight * dpr));

            this.mainCanvas.width = w;
            this.mainCanvas.height = h;
            this.bufferCanvas.width = w;
            this.bufferCanvas.height = h;

            this.bufferCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        }

        createEffects(x, y) {
            const rc = CREATE_CLICK_CFG.rings;
            const sparksCount = CREATE_CLICK_CFG.sparksCount;

            let wave;
            if (this.wavesPool.length > 0) {
                wave = this.wavesPool.pop();
            } else {
                wave = {};
            }
            if (!wave.ring) wave.ring = { segs: [] };

            wave.x = x;
            wave.y = y;
            wave.r = 0;
            wave.life = 0;
            wave.ring.ang = Math.random() * Math.PI * 2;
            wave.ring.rs = rc.rsList[Math.floor(Math.random() * rc.rsList.length)];
            wave.ring.segs[0] = {
                off: 0,
                len: rc.len,
                rRoundRate: rc.rRoundRateList[Math.floor(Math.random() * rc.rRoundRateList.length)],
            };
            wave.ring.segs[1] = {
                off: (Math.random() * 3 - 1.5) * Math.PI,
                len: rc.len,
                rRoundRate: rc.rRoundRateList[Math.floor(Math.random() * rc.rRoundRateList.length)],
            };

            this.waves.push(wave);

            const speedAdjust = this.scale / 1.5;
            for (let i = 0; i < sparksCount; i++) {
                const a = Math.random() * Math.PI * 2;
                const speed = (4.8 + Math.random() * 2) * speedAdjust;

                let spark;
                if (this.sparksPool.length > 0) {
                    spark = this.sparksPool.pop();
                } else {
                    spark = {};
                }

                spark.x = x;
                spark.y = y;
                spark.vx = Math.cos(a) * speed;
                spark.vy = Math.sin(a) * speed;
                spark.rot = Math.random() * Math.PI * 2;
                spark.rs = (Math.random() - 0.5) * 0.28;
                spark.s = (4 + Math.random() * 3) * this.scale;
                spark.a = 1;
                spark.f = 0.9;
                spark.fromClick = true;
                this.sparks.push(spark);
            }
        }

        _clearBuffer() {
            const ctx = this.bufferCtx;
            ctx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        }

        _updateTrail(frameScale) {
            const ctx = this.bufferCtx;
            const n = this.trail.length;
            let baseDecay;
            if (window.effectiveAlwaysTrail) {
                baseDecay = 0.085 * frameScale;
            } else {
                baseDecay = (this.isDown ? 0.085 : 0.18) * frameScale;
            }
            const maxStep = 0.42;
            for (let i = n - 1; i >= 0; i--) {
                const t = this.trail[i];
                const span = Math.max(1, n - 1);
                const along = n > 1 ? i / span : 1;
                const towardCursorBias = 1.25 - 0.55 * along;
                let step = baseDecay * towardCursorBias;
                if (step > maxStep) step = maxStep;
                t.life -= step;
                if (t.life <= 0) this.trail.splice(i, 1);
            }

            const head = this.lastPos;
            const pts =
                head && this.trail.length > 0
                    ? this.trail.concat([{ x: head.x, y: head.y, life: 1 }])
                    : this.trail.slice();

            if (pts.length < 2) {
                return;
            }

            const gap = Math.hypot(
                pts[pts.length - 1].x - pts[pts.length - 2].x,
                pts[pts.length - 1].y - pts[pts.length - 2].y
            );
            if (gap < 0.75 && this.trail.length === 1) {
                const fade = Math.max(0, this.trail[0].life);
                ctx.shadowColor = 'transparent';
                ctx.beginPath();
                ctx.arc(pts[0].x, pts[0].y, 2.5 + 2 * fade, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${fade * 0.85})`;
                ctx.fill();
                return;
            }

            ctx.lineWidth = 5.0;
            ctx.shadowColor = `rgba(${this.color}, 0.6)`;
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            const lastIdx = pts.length - 1;
            for (let i = 0; i < lastIdx; i++) {
                const alphaStart = i / lastIdx;
                const alphaEnd = (i + 1) / lastIdx;
                const a0 = pts[i];
                const a1 = pts[i + 1];

                const segGrad = ctx.createLinearGradient(a0.x, a0.y, a1.x, a1.y);
                segGrad.addColorStop(0, `rgba(${this.color}, ${alphaStart})`);
                segGrad.addColorStop(1, `rgba(${this.color}, ${alphaEnd})`);

                ctx.beginPath();
                ctx.moveTo(a0.x, a0.y);
                ctx.lineTo(a1.x, a1.y);
                ctx.strokeStyle = segGrad;
                ctx.stroke();
            }

            ctx.shadowColor = 'transparent';
        }

        _strokeRingSegment(wx, wy, radius, a0, a1, lineWidth, strokeStyle) {
            const ctx = this.bufferCtx;
            ctx.beginPath();
            ctx.arc(wx, wy, radius, a0, a1);
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = strokeStyle;
            ctx.stroke();
        }

        _updateWaves(clickFrameScale) {
            const filled = FILLED_CIRCLE_CFG;
            const rings = RINGS_ANIM_CFG;
            const ctx = this.bufferCtx;

            const updateFilledCircle = (w, waveProg) => {
                w.life += clickFrameScale;
                const ease = 1 - Math.pow(1 - waveProg, 3);
                w.r = filled.rAddRate * this.scale * ease;
                const alpha = Math.max(0, 1 - waveProg);
                if (alpha > 0) {
                    ctx.beginPath();
                    ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${this.color},${this.alpha(alpha)})`;
                    ctx.fill();
                }
            };

            const updateRings = (w, ringProg) => {
                const getWeightProp = (t) => Math.min(2 - Math.abs(4 * (t - 0.5)), 1);
                const ringRgbAt = (rProg) => {
                    const t = Math.min(1.2 * rProg, 1);
                    const r = this.ringsStartColor[0] * (1 - t) + this.ringsEndColor[0] * t;
                    const g = this.ringsStartColor[1] * (1 - t) + this.ringsEndColor[1] * t;
                    const b = this.ringsStartColor[2] * (1 - t) + this.ringsEndColor[2] * t;
                    return [Math.round(r), Math.round(g), Math.round(b)];
                };
                const getAlpha = (rProg) => Math.min(1.1 - 0.3 * rProg, 1);

                const r = w.ring;
                r.ang -= r.rs * clickFrameScale;

                let start = 0;
                let end = 0;
                let len = 0;
                let seg;

                for (let i = 0; i < 2; i++) {
                    seg = r.segs[i];
                    const base = r.ang + seg.off;

                    if (ringProg <= rings.lenStopAddPoint) {
                        len = seg.len * (ringProg / rings.lenStopAddPoint);
                        end = base + seg.len;
                        start = end - len;
                    } else if (ringProg > rings.lenStartDimPoint) {
                        len = seg.len * (1 - (ringProg - rings.lenStartDimPoint) / (1 - rings.lenStartDimPoint));
                        start = base;
                        end = start + len;
                    } else {
                        len = seg.len;
                        start = base;
                        end = start + len;
                    }

                    const lineWidthMul = Math.min(-0.8 * (ringProg - 0.8) + 1, 1);
                    const [rr, gg, bb] = ringRgbAt(ringProg);
                    const alphaRing = getAlpha(ringProg);

                    for (let k = 0; k < rings.segNum; k++) {
                        const t0 = k / rings.segNum;
                        const t1 = (k + 1) / rings.segNum;
                        const a0 = start + (end - start) * t0;
                        const a1 = start + (end - start) * t1;

                        if (Math.abs(a1 - a0) < 0.01) continue;

                        const wT = getWeightProp(t0);
                        const lw = (rings.minW * (1 - wT) + rings.maxW * wT) * lineWidthMul;
                        const strokeStyle = `rgba(${rr},${gg},${bb},${alphaRing})`;
                        const radius = w.r + seg.rRoundRate * this.scale;
                        this._strokeRingSegment(w.x, w.y, radius, a0, a1, lw, strokeStyle);
                    }
                }
            };

            for (let i = this.waves.length - 1; i >= 0; i--) {
                const w = this.waves[i];
                const waveProg = Math.min(w.life / filled.maxLife, 1);
                const ringProg = Math.min(w.life / rings.maxLife, 1);

                updateFilledCircle(w, waveProg);
                updateRings(w, ringProg);

                if (ringProg >= 1 && waveProg >= 1) {
                    this.wavesPool.push(this.waves[i]);
                    this.waves.splice(i, 1);
                }
            }
        }

        _updateSparks(clickFrameScale, trailFrameScale) {
            const ctx = this.bufferCtx;
            for (let i = this.sparks.length - 1; i >= 0; i--) {
                const s = this.sparks[i];
                const fs = s.fromClick ? clickFrameScale : trailFrameScale;
                s.x += s.vx * fs;
                s.y += s.vy * fs;
                s.vx *= Math.pow(s.f, fs);
                s.vy *= Math.pow(s.f, fs);
                s.rot += s.rs * fs;
                s.a -= 0.032 * fs;
                if (s.a <= 0) {
                    this.sparksPool.push(this.sparks[i]);
                    this.sparks.splice(i, 1);
                    continue;
                }

                ctx.save();
                ctx.translate(s.x, s.y);
                ctx.rotate(s.rot);
                ctx.beginPath();
                ctx.moveTo(0, -s.s);
                ctx.lineTo(s.s * 0.6, s.s * 0.6);
                ctx.lineTo(-s.s * 0.6, s.s * 0.6);
                ctx.fillStyle = `rgba(255,255,255,${this.alpha(s.a)})`;
                ctx.fill();
                ctx.restore();
            }
        }

        _renderToMain() {
            const { mainCtx, mainCanvas, bufferCanvas } = this;
            mainCtx.clearRect(0, 0, mainCanvas.width, mainCanvas.height);
            mainCtx.drawImage(bufferCanvas, 0, 0);
        }

        animationLoops(now) {
            const hasWork =
                this.waves.length > 0 ||
                this.sparks.length > 0 ||
                this.trail.length > 0;

            if (!hasWork) {
                this.lastFrameTime = now;
                this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
                requestAnimationFrame((nextNow) => this.animationLoops(nextNow));
                return;
            }

            const deltaMs = Math.min(now - this.lastFrameTime, this.maxDeltaMs);
            this.lastFrameTime = now;
            const baseScale = deltaMs / this.baseFrameMs;
            const trailFrameScale = baseScale * this.trailSpeed;
            const clickFrameScale = baseScale * this.clickSpeed;

            const bctx = this.bufferCtx;
            bctx.globalCompositeOperation = 'lighter';

            this._clearBuffer();
            this._updateTrail(trailFrameScale);
            this._updateWaves(clickFrameScale);
            this._updateSparks(clickFrameScale, trailFrameScale);

            bctx.globalCompositeOperation = 'source-over';

            this._renderToMain();

            requestAnimationFrame((nextNow) => this.animationLoops(nextNow));
        }
    }

    function createSparkEffect(canvasId, opts) {
        const spark = new MouseSpark(opts);
        spark.init(canvasId);
        spark.bindEvents();
        return spark;
    }

    window.SparkEffect = {
        create: createSparkEffect,
        MouseSpark: MouseSpark,
        ringsEndColorFromRgb: ringsEndColorFromRgb
    };

    window.spark = createSparkEffect('sparkCanvas');

    let lastBoomX = -1, lastBoomY = -1;
    let lastBoomTime = 0;
    let lastMoveX = -1, lastMoveY = -1;

    window.currentInputMode = 'mouse';
    window.enableAlwaysTrailEffect = false;
    window.effectiveAlwaysTrail = false;

    window.setInputContext = (mode, alwaysTrailEnabled) => {
        window.currentInputMode = mode === 'touch' ? 'touch' : 'mouse';
        window.enableAlwaysTrailEffect = Boolean(alwaysTrailEnabled);
        window.effectiveAlwaysTrail = window.currentInputMode === 'mouse' && window.enableAlwaysTrailEffect;
    };

    window.setInputContext('mouse', false);

    window.externalBoom = (percentX, percentY) => {
        const now = Date.now();
        if (percentX === lastBoomX && percentY === lastBoomY && (now - lastBoomTime) < 25) return;
        lastBoomX = percentX;
        lastBoomY = percentY;
        lastBoomTime = now;

        const cx = percentX * window.innerWidth;
        const cy = percentY * window.innerHeight;
        window.dispatchEvent(new MouseEvent('mousedown', { clientX: cx, clientY: cy, bubbles: true }));
    };

    window.externalMove = (percentX, percentY) => {
        if (percentX === lastMoveX && percentY === lastMoveY) return;
        lastMoveX = percentX;
        lastMoveY = percentY;

        const cx = percentX * window.innerWidth;
        const cy = percentY * window.innerHeight;
        window.dispatchEvent(new MouseEvent('mousemove', { clientX: cx, clientY: cy, bubbles: true }));
    };

    window.externalUp = () => {
        window.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    };

    window.updateColor = (rgbString) => {
        if (window.spark) {
            window.spark.color = rgbString;
            window.spark.ringsEndColor = ringsEndColorFromRgb(rgbString);
        }
    };

    window.updateEffectSettings = (scale, opacity, trailSpeed, clickSpeed) => {
        if (!window.spark) return;
        window.spark.scale = Math.max(0.5, Math.min(3, Number(scale) || 1.5));
        window.spark.opacity = Math.max(0.1, Math.min(1, Number(opacity) || 1.0));
        let t = Number(trailSpeed);
        if (!Number.isFinite(t)) t = 1.0;
        let c = Number(clickSpeed);
        if (!Number.isFinite(c)) c = t;
        window.spark.trailSpeed = Math.max(0.2, Math.min(3, t));
        window.spark.clickSpeed = Math.max(0.2, Math.min(3, c));
    };
})();
