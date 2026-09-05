/**
 * Kawaii Sound & Continuous Background Music Synthesizer (Web Audio API)
 * Plays a warm, charming Music Box / Kalimba melody that loops continuously
 * whether clicking or not, with ultra-cute interactive sound effects.
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.bgmEnabled = true;
        this.isMuted = false;
        this.lastBounceTime = 0;

        // BGM Sequencer State
        this.bgmTimer = null;
        this.currentStep = 0;
        this.nextNoteTime = 0;
        this.tempo = 118; // Warm, cheerful Kawaii tempo
        this.stepDuration = 60 / this.tempo / 2; // Eighth notes (approx 0.254s per step)
        this.scheduleAheadTime = 0.15; // 150ms lookahead for jitter-free rhythm

        // Kawaii Music Box Frequencies (Fmaj7 -> G7 -> Em7 -> Am7 Royal Road Loop)
        // Melody notes (0 = rest)
        this.melodyTrack = [
            // Bar 1: Fmaj7 (Sweet & cozy)
            523.25, 659.25, 783.99, 880.00,  659.25, 783.99, 1046.50, 880.00,
            // Bar 2: G7 (Playful lift)
            783.99, 880.00, 987.77, 1046.50, 880.00, 783.99, 659.25,  587.33,
            // Bar 3: Em7 (Dreamy warmth)
            659.25, 783.99, 880.00, 1046.50, 783.99, 659.25, 587.33,  523.25,
            // Bar 4: Am7 (Gentle resolution)
            587.33, 659.25, 783.99, 659.25,  587.33, 523.25, 440.00,  523.25
        ];

        // Bassline chords (Root + Fifth pulse)
        this.bassTrack = [
            174.61, 0, 261.63, 0,  174.61, 0, 261.63, 0, // F3, C4
            196.00, 0, 293.66, 0,  196.00, 0, 293.66, 0, // G3, D4
            164.81, 0, 246.94, 0,  164.81, 0, 246.94, 0, // E3, B3
            220.00, 0, 261.63, 0,  220.00, 0, 329.63, 0  // A3, C4, E4
        ];

        // Soft arpeggio accompaniment
        this.harmonyTrack = [
            349.23, 440.00, 523.25, 659.25, // F4, A4, C5, E5
            392.00, 493.88, 587.33, 783.99, // G4, B4, D5, G5
            329.63, 392.00, 493.88, 659.25, // E4, G4, B4, E5
            440.00, 523.25, 659.25, 880.00  // A4, C5, E5, A5
        ];

        this.setupAutoPlay();
    }

    setupAutoPlay() {
        // Attempt autoplay immediately
        this.init();
        if (this.ctx && this.ctx.state === 'running') {
            this.startBGM();
        }

        // Resume / Start on ANY user interaction if initial state was suspended by browser policy
        const startAudio = () => {
            this.init();
            if (this.ctx && this.ctx.state === 'running') {
                this.startBGM();
            }
        };

        const events = ['click', 'touchstart', 'pointerdown', 'keydown', 'mousemove', 'wheel'];
        const triggerOnce = () => {
            startAudio();
            events.forEach(evt => document.removeEventListener(evt, triggerOnce));
        };
        events.forEach(evt => document.addEventListener(evt, triggerOnce, { passive: true }));

        // Keep playing if tab becomes visible
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.init();
                if (this.bgmEnabled) {
                    this.startBGM();
                }
            }
        });
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.ctx = new AudioCtx();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().then(() => {
                if (this.bgmEnabled) {
                    this.startBGM();
                }
            }).catch(() => {});
        }
    }

    /**
     * Start continuous background music loop
     */
    startBGM() {
        this.bgmEnabled = true;
        if (!this.ctx || this.isMuted) return;

        if (this.bgmTimer) return; // Already running

        this.nextNoteTime = this.ctx.currentTime + 0.05;
        this.currentStep = 0;

        // Rock-solid lookahead scheduler: runs every 35ms
        this.bgmTimer = setInterval(() => {
            if (!this.bgmEnabled || this.isMuted || !this.ctx) return;
            this.scheduler();
        }, 35);
    }

    scheduler() {
        if (!this.ctx) return;
        // Schedule all notes up to the lookahead boundary
        while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.playBGMStep(this.currentStep, this.nextNoteTime);
            this.nextNoteTime += this.stepDuration;
            this.currentStep = (this.currentStep + 1) % this.melodyTrack.length;
        }
    }

    playBGMStep(step, time) {
        if (!this.ctx) return;

        // 1. Kawaii Music Box Melody Note
        const melFreq = this.melodyTrack[step];
        if (melFreq > 0) {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            // Blend triangle for sweet kalimba/music box warmth
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(melFreq, time);

            // Very gentle volume (~0.05) so it's charming and soothing
            gain.gain.setValueAtTime(0.045, time);
            gain.gain.exponentialRampToValueAtTime(0.0002, time + 0.38);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(time);
            osc.stop(time + 0.4);

            // Shimmer overtone
            const osc2 = this.ctx.createOscillator();
            const gain2 = this.ctx.createGain();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(melFreq * 2, time);

            gain2.gain.setValueAtTime(0.015, time);
            gain2.gain.exponentialRampToValueAtTime(0.0001, time + 0.22);

            osc2.connect(gain2);
            gain2.connect(this.ctx.destination);

            osc2.start(time);
            osc2.stop(time + 0.25);
        }

        // 2. Gentle Bass Note
        const bassFreq = this.bassTrack[step];
        if (bassFreq > 0) {
            const bOsc = this.ctx.createOscillator();
            const bGain = this.ctx.createGain();

            bOsc.type = 'sine';
            bOsc.frequency.setValueAtTime(bassFreq, time);

            bGain.gain.setValueAtTime(0.038, time);
            bGain.gain.exponentialRampToValueAtTime(0.0002, time + 0.48);

            bOsc.connect(bGain);
            bGain.connect(this.ctx.destination);

            bOsc.start(time);
            bOsc.stop(time + 0.5);
        }

        // 3. Soft Arpeggio Accent every 2 steps
        if (step % 2 === 1) {
            const chordIdx = Math.floor(step / 8);
            const harmFreq = this.harmonyTrack[(chordIdx * 4 + ((step % 8) >> 1)) % this.harmonyTrack.length];
            if (harmFreq > 0) {
                const hOsc = this.ctx.createOscillator();
                const hGain = this.ctx.createGain();

                hOsc.type = 'sine';
                hOsc.frequency.setValueAtTime(harmFreq, time);

                hGain.gain.setValueAtTime(0.018, time);
                hGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.32);

                hOsc.connect(hGain);
                hGain.connect(this.ctx.destination);

                hOsc.start(time);
                hOsc.stop(time + 0.34);
            }
        }
    }

    stopBGM() {
        this.bgmEnabled = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    /* -------------------------------------------------------------
     * INTERACTIVE CUTE SOUND EFFECTS (SFX)
     * ------------------------------------------------------------- */

    // 1. Cute Bubble Bloop on fruit drop (水滴啵啵聲)
    playDrop() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(190, now + 0.08);

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
        if (nowMs - this.lastBounceTime < 90) return;
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

    // 3. Cute Glockenspiel / Marimba Bell on Fruit Merge (水果合成清脆鈴鐺聲)
    playMerge(tier = 0, combo = 1) {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;

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
            freq *= Math.pow(1.05946, Math.min(combo, 6));
        }

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
