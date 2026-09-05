/**
 * Kawaii Sound Synthesizer using Web Audio API
 * Pure synthesized cute sound effects: bubble bloop, marimba chimes, soft pops, victory sparkles!
 * Zero external audio files required, ultra-low latency & iOS/Safari compatible.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.isMuted = false;
        this.lastBounceTime = 0;

        // Auto-unlock audio context on first user interaction
        this.setupUnlock();
    }

    setupUnlock() {
        const unlock = () => {
            this.init();
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
            document.removeEventListener('pointerdown', unlock);
        };
        document.addEventListener('click', unlock, { once: true });
        document.addEventListener('touchstart', unlock, { once: true });
        document.addEventListener('pointerdown', unlock, { once: true });
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // 1. Cute Bubble Bloop on fruit drop (水滴啵啵聲)
    playDrop() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        // Gentle cheerful bloop
        osc.frequency.setValueAtTime(420, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + 0.08);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // 2. Cute Soft Squish/Pop on fruit collisions (水果彈跳輕微啵聲)
    playBounce() {
        if (!this.sfxEnabled || this.isMuted) return;
        const nowMs = Date.now();
        if (nowMs - this.lastBounceTime < 90) return; // Throttle to prevent acoustic clutter
        this.lastBounceTime = nowMs;

        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(260 + Math.random() * 80, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.05);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.06);
    }

    // 3. Cute Sweet Glockenspiel / Marimba Bell on Fruit Merge (水果合成清脆鈴鐺聲)
    playMerge(tier = 0, combo = 1) {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

        // Pentatonic / Diatonic ascending scale for sweet harmonies
        const baseFreqs = [
            440.00, // A4 (Cherry)
            493.88, // B4 (Strawberry)
            554.37, // C#5 (Grape)
            587.33, // D5 (Dekopon)
            659.25, // E5 (Persimmon)
            739.99, // F#5 (Apple)
            830.61, // G#5 (Pear)
            880.00, // A5 (Peach)
            987.77, // B5 (Pineapple)
            1108.73, // C#6 (Melon)
            1174.66  // D6 (Watermelon)
        ];

        let freq = baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25;
        if (combo > 1) {
            freq *= Math.pow(1.05946, Math.min(combo, 6)); // Shift pitch up per combo
        }

        // Primary cute chime
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.frequency.exponentialRampToValueAtTime(freq * 1.02, now + 0.03);
        osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.16);

        gain1.gain.setValueAtTime(0.32, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.28);

        // Secondary sparkle overtone (adds kawaii shimmer)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.0, now);

        gain2.gain.setValueAtTime(0.18, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.24);
    }

    // 4. Multi-pop sparkle for Combo Chains (連擊小精靈音)
    playCombo(combo = 2) {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const chordNotes = [783.99, 987.77, 1174.66, 1567.98];
        chordNotes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.04;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.14, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.15);
        });
    }

    // 5. Watermelon Synthesis Celebration Jingle (合成大西瓜歡慶音)
    playVictory() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        chord.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.07;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.6);
        });
    }

    // 6. Cute Gentle Game Over (遊戲結束音)
    playGameOver() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const tones = [587.33, 523.25, 493.88, 392.00];
        tones.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.14;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.9, now + 0.16);

            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.22);
        });
    }

    // 7. Button Tap Pop (按鍵音)
    playClick() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(650, now);
        osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.05);
    }
}

window.soundEngine = new SoundEngine();
