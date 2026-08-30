/**
 * Kawaii Sound & Music Synthesizer using Web Audio API
 * Zero external audio files required, highly reliable & low latency!
 */

class SoundEngine {
    constructor() {
        this.ctx = null;
        this.sfxEnabled = true;
        this.bgmEnabled = false;
        this.bgmTimer = null;
        this.bgmStep = 0;
        this.isMuted = false;

        // Pentatonic kawaii melody notes for procedural BGM (C major / A minor pentatonic)
        this.bgmMelody = [
            523.25, 587.33, 659.25, 783.99, 880.00, // C5, D5, E5, G5, A5
            1046.50, 880.00, 783.99, 659.25, 587.33,
            659.25, 783.99, 880.00, 1046.50, 1174.66,
            1046.50, 880.00, 783.99, 659.25, 523.25
        ];

        this.bgmBass = [
            261.63, 261.63, 329.63, 392.00, // C4, C4, E4, G4
            220.00, 220.00, 261.63, 329.63, // A3, A3, C4, E4
            174.61, 174.61, 220.00, 261.63, // F3, F3, A3, C4
            196.00, 196.00, 246.94, 293.66  // G3, G3, B3, D4
        ];
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    // Cute Bubble Pop on fruit drop
    playDrop() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.09);
    }

    // Cute Marimba / Bell Pop on fruit merge with pitch scaled by tier & combo
    playMerge(tier = 0, combo = 1) {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        // Base frequencies for fruit tiers (pleasant ascending scale)
        const baseFreqs = [
            392.00, // G4 (Cherry)
            440.00, // A4 (Strawberry)
            493.88, // B4 (Grape)
            523.25, // C5 (Dekopon)
            587.33, // D5 (Persimmon)
            659.25, // E5 (Apple)
            698.46, // F5 (Pear)
            783.99, // G5 (Peach)
            880.00, // A5 (Pineapple)
            987.77, // B5 (Melon)
            1046.50 // C6 (Watermelon)
        ];

        let freq = baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25;
        if (combo > 1) {
            freq *= Math.pow(1.05946, Math.min(combo, 6)); // Step up semitone per combo
        }

        // Primary bell tone
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(freq, now);
        osc1.frequency.exponentialRampToValueAtTime(freq * 1.3, now + 0.04);
        osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.18);

        gain1.gain.setValueAtTime(0.35, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.26);

        // Secondary sparkle harmonic
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(freq * 2.02, now);

        gain2.gain.setValueAtTime(0.2, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now);
        osc2.stop(now + 0.36);
    }

    // Multi-pop sparkle for Combos
    playCombo(combo = 2) {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const notes = [659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.04;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.15, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.16);
        });
    }

    // High Score / Watermelon Victory Celebration Jingle
    playVictory() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
        chord.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.08;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.65);
        });
    }

    // Cute Game Over Sound
    playGameOver() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const tones = [523.25, 493.88, 440.00, 392.00, 329.63];
        tones.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.15;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);
            osc.frequency.exponentialRampToValueAtTime(freq * 0.85, now + 0.18);

            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.25);
        });
    }

    // Button tap sound
    playClick() {
        if (!this.sfxEnabled || this.isMuted) return;
        this.init();

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.06);
    }

    // Gentle Kawaii Music Loop (synthesized piano / music box)
    startBGM() {
        this.bgmEnabled = true;
        if (this.isMuted) return;
        this.init();
        if (this.bgmTimer) return;

        this.bgmStep = 0;
        this.bgmTimer = setInterval(() => {
            if (!this.bgmEnabled || this.isMuted || !this.ctx) return;

            const now = this.ctx.currentTime;
            
            // Melody note
            const noteFreq = this.bgmMelody[this.bgmStep % this.bgmMelody.length];
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(noteFreq, now);

            // Very gentle soft volume
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.38);

            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now);
            osc.stop(now + 0.4);

            // Bass note every 2 steps
            if (this.bgmStep % 2 === 0) {
                const bassIndex = Math.floor(this.bgmStep / 2) % this.bgmBass.length;
                const bassFreq = this.bgmBass[bassIndex];
                const bOsc = this.ctx.createOscillator();
                const bGain = this.ctx.createGain();

                bOsc.type = 'sine';
                bOsc.frequency.setValueAtTime(bassFreq, now);

                bGain.gain.setValueAtTime(0.04, now);
                bGain.gain.exponentialRampToValueAtTime(0.0005, now + 0.6);

                bOsc.connect(bGain);
                bGain.connect(this.ctx.destination);
                bOsc.start(now);
                bOsc.stop(now + 0.65);
            }

            this.bgmStep++;
        }, 260); // ~115 BPM rhythm
    }

    stopBGM() {
        this.bgmEnabled = false;
        if (this.bgmTimer) {
            clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            if (this.bgmTimer) clearInterval(this.bgmTimer);
            this.bgmTimer = null;
        } else if (this.bgmEnabled) {
            this.startBGM();
        }
        return this.isMuted;
    }

    toggleSFX() {
        this.sfxEnabled = !this.sfxEnabled;
        return this.sfxEnabled;
    }

    toggleBGM() {
        if (this.bgmEnabled) {
            this.stopBGM();
            return false;
        } else {
            this.startBGM();
            return true;
        }
    }
}

window.soundEngine = new SoundEngine();
