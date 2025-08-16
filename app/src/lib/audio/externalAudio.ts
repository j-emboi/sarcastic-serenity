export class ExternalAudioEngine {
	private context: AudioContext | null = null;
	private masterGain!: GainNode;
	private backgroundGain!: GainNode;
	private currentSource: AudioBufferSourceNode | null = null;
	private audioBuffers: Map<string, AudioBuffer> = new Map();
	private currentVolume = 0.4;
	private isPlaying = false;

	// Real audio files from the audio folder
	private readonly AUDIO_URLS = {
		japanese_garden: '/audio/Spring Day Forest.mp3',
		waterfall: '/audio/Distant Thunder.mp3',
		beach: '/audio/Waves Crashing on Rock Beach.mp3',
		rain: '/audio/Rain On Roof.mp3',
		singing_bowls: '/audio/Daytime Forest Bonfire.mp3',
		piano: '/audio/Spring Day Forest.mp3' // Using forest as piano alternative
	};

	async ensureContext(): Promise<AudioContext> {
		if (!this.context) {
			console.log('Creating new external audio context...');
			this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.masterGain = this.context.createGain();
			this.backgroundGain = this.context.createGain();
			this.backgroundGain.connect(this.masterGain);
			this.masterGain.connect(this.context.destination);
			
			console.log('External audio context created, state:', this.context.state);
		}
		
		if (this.context.state === 'suspended') {
			console.log('Audio context suspended, attempting to resume...');
			await this.context.resume();
			console.log('Audio context resumed, state:', this.context.state);
		}
		
		return this.context;
	}

	async loadAudioBuffer(preset: string): Promise<AudioBuffer | null> {
		const ctx = await this.ensureContext();
		
		// Check if already loaded
		if (this.audioBuffers.has(preset)) {
			return this.audioBuffers.get(preset)!;
		}

		try {
			const audioUrl = this.AUDIO_URLS[preset as keyof typeof this.AUDIO_URLS];
			if (!audioUrl) {
				console.error(`No audio URL found for preset: ${preset}`);
				return null;
			}
			
			console.log(`Loading real audio file for preset: ${preset} from ${audioUrl}`);
			
			// Fetch the audio file
			const response = await fetch(audioUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch audio: ${response.statusText}`);
			}
			
			const arrayBuffer = await response.arrayBuffer();
			const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
			
			this.audioBuffers.set(preset, audioBuffer);
			console.log(`Successfully loaded audio for ${preset}, duration: ${audioBuffer.duration}s`);
			return audioBuffer;
			
		} catch (error) {
			console.error(`Failed to load audio for ${preset}:`, error);
			// Fallback to procedural audio if real audio fails
			console.log(`Falling back to procedural audio for ${preset}`);
			const buffer = await this.createHighQualityProceduralAudio(preset, ctx);
			this.audioBuffers.set(preset, buffer);
			return buffer;
		}
	}

	private async createHighQualityProceduralAudio(preset: string, ctx: AudioContext): Promise<AudioBuffer> {
		const bufferSize = 10 * ctx.sampleRate; // 10 seconds of audio
		const buffer = ctx.createBuffer(2, bufferSize, ctx.sampleRate); // Stereo
		
		const leftChannel = buffer.getChannelData(0);
		const rightChannel = buffer.getChannelData(1);
		
		switch (preset) {
			case 'japanese_garden':
				this.generateJapaneseGarden(leftChannel, rightChannel, ctx.sampleRate);
				break;
			case 'waterfall':
				this.generateWaterfall(leftChannel, rightChannel, ctx.sampleRate);
				break;
			case 'beach':
				this.generateBeach(leftChannel, rightChannel, ctx.sampleRate);
				break;
			case 'rain':
				this.generateRain(leftChannel, rightChannel, ctx.sampleRate);
				break;
			case 'singing_bowls':
				this.generateSingingBowls(leftChannel, rightChannel, ctx.sampleRate);
				break;
			case 'piano':
				this.generatePiano(leftChannel, rightChannel, ctx.sampleRate);
				break;
			default:
				this.generateWhiteNoise(leftChannel, rightChannel, ctx.sampleRate);
		}
		
		return buffer;
	}

	private generateJapaneseGarden(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Japanese Garden: Water, wind, bamboo, birds, shishi-odoshi
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Water stream (low frequency noise)
			const water = this.brownNoise(i) * 0.3;
			
			// Wind through bamboo (filtered noise)
			const wind = this.filteredNoise(i, 200, 800, sampleRate) * 0.2;
			
			// Occasional bird chirps
			const birdChirp = this.birdChirp(time, i) * 0.1;
			
			// Shishi-odoshi (bamboo water device)
			const shishiOdoshi = this.shishiOdoshi(time, i) * 0.15;
			
			// Bamboo leaves rustling
			const bamboo = this.filteredNoise(i, 1000, 3000, sampleRate) * 0.1;
			
			const combined = water + wind + birdChirp + shishiOdoshi + bamboo;
			left[i] = combined * 0.7;
			right[i] = combined * 0.7;
		}
	}

	private generateWaterfall(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Waterfall: Heavy water flow, splashes, distant rumble
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Main waterfall (white noise with low-pass filter)
			const mainFall = this.filteredNoise(i, 100, 2000, sampleRate) * 0.4;
			
			// Water splashes (high frequency bursts)
			const splashes = this.waterSplashes(time, i) * 0.2;
			
			// Distant rumble (very low frequency)
			const rumble = this.filteredNoise(i, 50, 200, sampleRate) * 0.3;
			
			const combined = mainFall + splashes + rumble;
			left[i] = combined * 0.8;
			right[i] = combined * 0.8;
		}
	}

	private generateBeach(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Beach: Ocean waves, pebbles, seagulls
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Ocean waves (slow oscillating noise)
			const waves = this.oceanWaves(time, i) * 0.4;
			
			// Pebble sounds (crackling high frequency)
			const pebbles = this.filteredNoise(i, 2000, 8000, sampleRate) * 0.15;
			
			// Occasional seagull
			const seagull = this.seagullCall(time, i) * 0.1;
			
			const combined = waves + pebbles + seagull;
			left[i] = combined * 0.7;
			right[i] = combined * 0.7;
		}
	}

	private generateRain(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Rain: Droplets, thunder, wind
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Rain drops (high frequency noise)
			const rain = this.filteredNoise(i, 3000, 10000, sampleRate) * 0.3;
			
			// Occasional thunder
			const thunder = this.thunder(time, i) * 0.2;
			
			// Wind
			const wind = this.filteredNoise(i, 200, 1000, sampleRate) * 0.15;
			
			const combined = rain + thunder + wind;
			left[i] = combined * 0.6;
			right[i] = combined * 0.6;
		}
	}

	private generateSingingBowls(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Singing bowls: Harmonic tones, resonance
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Multiple harmonic frequencies
			const fundamental = Math.sin(2 * Math.PI * 110 * time) * 0.2; // A2
			const harmonic1 = Math.sin(2 * Math.PI * 220 * time) * 0.1; // A3
			const harmonic2 = Math.sin(2 * Math.PI * 330 * time) * 0.05; // E4
			
			// Resonance envelope
			const envelope = Math.exp(-time * 0.1);
			
			const combined = (fundamental + harmonic1 + harmonic2) * envelope;
			left[i] = combined * 0.5;
			right[i] = combined * 0.5;
		}
	}

	private generatePiano(left: Float32Array, right: Float32Array, sampleRate: number): void {
		// Piano: Gentle, ambient piano notes
		for (let i = 0; i < left.length; i++) {
			const time = i / sampleRate;
			
			// Gentle piano notes (C major scale)
			const notes = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88]; // C4 to B4
			let piano = 0;
			
			notes.forEach((freq, index) => {
				const noteTime = time + index * 2; // Stagger notes
				const envelope = Math.exp(-noteTime * 0.3);
				piano += Math.sin(2 * Math.PI * freq * noteTime) * envelope * 0.05;
			});
			
			left[i] = piano * 0.4;
			right[i] = piano * 0.4;
		}
	}

	// Helper methods for generating specific sounds
	private brownNoise(index: number): number {
		return (Math.random() * 2 - 1) * 0.1;
	}

	private filteredNoise(index: number, lowFreq: number, highFreq: number, sampleRate: number): number {
		const noise = Math.random() * 2 - 1;
		const filter = Math.sin(2 * Math.PI * (lowFreq + (highFreq - lowFreq) * Math.random()) * index / sampleRate);
		return noise * filter * 0.1;
	}

	private birdChirp(time: number, index: number): number {
		const chirpInterval = 8; // Every 8 seconds
		const chirpTime = time % chirpInterval;
		if (chirpTime < 0.3) {
			const freq = 2000 + 1000 * Math.sin(chirpTime * 10);
			return Math.sin(2 * Math.PI * freq * chirpTime) * Math.exp(-chirpTime * 5) * 0.2;
		}
		return 0;
	}

	private shishiOdoshi(time: number, index: number): number {
		const interval = 4; // Every 4 seconds
		const odoshiTime = time % interval;
		if (odoshiTime < 0.5) {
			const freq = 800 + 200 * Math.sin(odoshiTime * 4);
			return Math.sin(2 * Math.PI * freq * odoshiTime) * Math.exp(-odoshiTime * 3) * 0.3;
		}
		return 0;
	}

	private waterSplashes(time: number, index: number): number {
		const splashInterval = 2; // Every 2 seconds
		const splashTime = time % splashInterval;
		if (splashTime < 0.1) {
			return (Math.random() * 2 - 1) * Math.exp(-splashTime * 20) * 0.4;
		}
		return 0;
	}

	private oceanWaves(time: number, index: number): number {
		const waveFreq = 0.1; // Slow waves
		return Math.sin(2 * Math.PI * waveFreq * time) * this.filteredNoise(index, 100, 500, 44100) * 0.3;
	}

	private seagullCall(time: number, index: number): number {
		const callInterval = 15; // Every 15 seconds
		const callTime = time % callInterval;
		if (callTime < 1) {
			const freq = 800 + 400 * Math.sin(callTime * 3);
			return Math.sin(2 * Math.PI * freq * callTime) * Math.exp(-callTime * 2) * 0.2;
		}
		return 0;
	}

	private thunder(time: number, index: number): number {
		const thunderInterval = 20; // Every 20 seconds
		const thunderTime = time % thunderInterval;
		if (thunderTime < 2) {
			return this.filteredNoise(index, 50, 200, 44100) * Math.exp(-thunderTime * 0.5) * 0.5;
		}
		return 0;
	}

	private whiteNoise(left: Float32Array, right: Float32Array, sampleRate: number): void {
		for (let i = 0; i < left.length; i++) {
			const noise = (Math.random() * 2 - 1) * 0.1;
			left[i] = noise;
			right[i] = noise;
		}
	}

	async startPreset(preset: string, volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		
		// Stop current audio
		this.stopCurrent();
		
		// Load and play new audio
		const buffer = await this.loadAudioBuffer(preset);
		if (buffer) {
			this.currentSource = ctx.createBufferSource();
			this.currentSource.buffer = buffer;
			this.currentSource.loop = true;
			
			this.backgroundGain.gain.value = volume;
			this.currentVolume = volume;
			
			this.currentSource.connect(this.backgroundGain);
			this.currentSource.start();
			this.isPlaying = true;
			
			console.log(`Started external audio preset: ${preset} at volume ${volume}`);
		}
	}

	stopCurrent(): void {
		console.log('Stopping current audio source...');
		if (this.currentSource) {
			try {
				this.currentSource.stop();
				this.currentSource.disconnect();
				console.log('Audio source stopped successfully');
			} catch (error) {
				console.warn('Error stopping current audio source:', error);
			}
			this.currentSource = null;
		} else {
			console.log('No current audio source to stop');
		}
		this.isPlaying = false;
		console.log('Audio stopped, isPlaying set to false');
	}

	setVolume(volume: number): void {
		this.currentVolume = volume;
		if (this.backgroundGain) {
			this.backgroundGain.gain.value = volume;
		}
	}

	getVolume(): number {
		return this.currentVolume;
	}

	isAudioPlaying(): boolean {
		return this.isPlaying;
	}

	stopAll(): void {
		console.log('stopAll() called on external audio engine');
		this.stopCurrent();
	}

	// Additional methods to match the old AudioEngine interface
	setBackgroundVolume(volume: number): void {
		this.setVolume(volume);
	}

	removeAudioLevelCallback(): void {
		// Not implemented in this version, but keeping interface compatibility
		console.log('Audio level callback removed');
	}

	setAudioLevelCallback(callback: (level: number) => void): void {
		// Not implemented in this version, but keeping interface compatibility
		console.log('Audio level callback set (not implemented in external audio engine)');
	}
}

export const externalAudioEngine = new ExternalAudioEngine();
