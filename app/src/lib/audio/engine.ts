export class AudioEngine {
	private context: AudioContext | null = null;
	private masterGain!: GainNode;
	private backgroundGain!: GainNode;
	private backgroundSource: AudioBufferSourceNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
	private proceduralNodes: AudioNode[] = [];
	private analyser: AnalyserNode | null = null;
	private audioLevelCallback: ((level: number) => void) | null = null;
	private analysisInterval: number | null = null;

	// Public getters for external systems
	getContext(): AudioContext | null {
		return this.context;
	}

	getMasterGain(): GainNode | null {
		return this.masterGain;
	}

	async ensureContext(): Promise<AudioContext> {
		if (!this.context) {
			console.log('Creating new audio context...');
			this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
			this.masterGain = this.context.createGain();
			this.backgroundGain = this.context.createGain();
			this.backgroundGain.connect(this.masterGain);
			this.masterGain.connect(this.context.destination);
			
			// Create audio analyser for real-time level monitoring
			this.analyser = this.context.createAnalyser();
			this.analyser.fftSize = 256;
			this.analyser.smoothingTimeConstant = 0.8;
			this.masterGain.connect(this.analyser);
			
			console.log('Audio context created, state:', this.context.state);
			console.log('Analyser connected to master gain');
			
			// Start audio level monitoring
			this.startAudioLevelMonitoring();
		}
		
		// Ensure audio context is resumed (browsers suspend it until user interaction)
		if (this.context.state === 'suspended') {
			console.log('Audio context suspended, attempting to resume...');
			await this.context.resume();
			console.log('Audio context resumed, state:', this.context.state);
		} else {
			console.log('Audio context already running, state:', this.context.state);
		}
		
		return this.context;
	}

	private startAudioLevelMonitoring(): void {
		if (!this.analyser) return;
		
		const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
		let debugCounter = 0;
		let lastRms = 0;
		
		const updateLevel = () => {
			if (!this.analyser) return;
			
			this.analyser.getByteFrequencyData(dataArray);
			
			// Calculate RMS (Root Mean Square) for overall level
			let sum = 0;
			for (let i = 0; i < dataArray.length; i++) {
				sum += dataArray[i] * dataArray[i];
			}
			const rms = Math.sqrt(sum / dataArray.length);
			const normalizedLevel = rms / 255; // Normalize to 0-1
			
			// Debug logging (every 60 frames = ~1 second at 60fps)
			debugCounter++;
			if (debugCounter % 60 === 0) {
				console.log('Audio Level Debug:', {
					rms: rms.toFixed(3),
					normalizedLevel: normalizedLevel.toFixed(3),
					hasCallback: !!this.audioLevelCallback,
					analyserConnected: !!this.analyser,
					contextState: this.context?.state,
					backgroundGainValue: this.backgroundGain?.gain.value,
					noiseSourceActive: !!this.noiseSource,
					dataArraySample: Array.from(dataArray.slice(0, 5)) // Show first 5 frequency bins
				});
				
				// Check if we're getting any audio data at all
				const maxValue = Math.max(...dataArray);
				if (maxValue === 0) {
					console.warn('⚠️ No audio data detected - analyser receiving all zeros');
				} else {
					console.log('✅ Audio data detected, max value:', maxValue);
				}
			}
			
			// Apply smoothing and call callback
			if (this.audioLevelCallback) {
				this.audioLevelCallback(normalizedLevel);
			}
			
			this.analysisInterval = requestAnimationFrame(updateLevel);
		};
		
		console.log('Starting audio level monitoring...');
		updateLevel();
	}

	private stopAudioLevelMonitoring(): void {
		if (this.analysisInterval) {
			cancelAnimationFrame(this.analysisInterval);
			this.analysisInterval = null;
		}
	}

	setAudioLevelCallback(callback: (level: number) => void): void {
		this.audioLevelCallback = callback;
	}

	removeAudioLevelCallback(): void {
		this.audioLevelCallback = null;
	}

	// Test method to generate a simple tone for debugging
	async testAudioGeneration(): Promise<void> {
		const ctx = await this.ensureContext();
		console.log('Testing audio generation...');
		
		// Create a simple oscillator for testing
		const oscillator = ctx.createOscillator();
		const gainNode = ctx.createGain();
		
		oscillator.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
		gainNode.gain.setValueAtTime(0.1, ctx.currentTime); // Low volume
		
		oscillator.connect(gainNode);
		gainNode.connect(this.masterGain);
		
		oscillator.start(ctx.currentTime);
		oscillator.stop(ctx.currentTime + 2); // Stop after 2 seconds
		
		console.log('Test tone started - should see audio levels in 2 seconds');
	}

	async loadAndLoopBackground(url: string, volume: number): Promise<void> {
		const ctx = await this.ensureContext();
		this.stopBackground();
		const resp = await fetch(url);
		const arr = await resp.arrayBuffer();
		const buf = await ctx.decodeAudioData(arr);
		const src = ctx.createBufferSource();
		src.buffer = buf;
		src.loop = true;
		src.connect(this.backgroundGain);
		this.backgroundGain.gain.value = volume;
		src.start();
		this.backgroundSource = src;
	}

	setBackgroundVolume(volume: number): void {
		if (this.backgroundGain) this.backgroundGain.gain.value = volume;
	}

	duckBackground(duckDb = 0.5): () => void {
		const original = this.backgroundGain.gain.value;
		this.backgroundGain.gain.value = original * duckDb;
		return () => (this.backgroundGain.gain.value = original);
	}

	stopBackground(): void {
		try {
			this.backgroundSource?.stop();
			this.backgroundSource?.disconnect();
			this.backgroundSource = null;
		} catch {}
	}

  async startProceduralNoise(kind: 'white' | 'pink' | 'brown', volume: number, serendipity: number = 0.1): Promise<void> {
    console.log('Starting procedural noise:', kind, 'volume:', volume);
    const ctx = await this.ensureContext();
    this.stopProceduralNoise();
    const bufferSize = 2 * ctx.sampleRate; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    if (kind === 'white') {
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    } else if (kind === 'pink') {
      // Voss-McCartney pink noise approximation
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // gain trim
        b6 = white * 0.115926;
      }
    } else {
      // brown noise (integrated white)
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5; // compensation gain
      }
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const gain = this.backgroundGain;
    gain.gain.value = volume;
    src.connect(gain);
    src.start();
    this.noiseSource = src;
    console.log('Procedural noise started, connected to background gain');
    console.log('Noise source active:', !!this.noiseSource);
    console.log('Background gain value:', this.backgroundGain?.gain.value);
    console.log('Audio context state:', this.context?.state);

    // Add serendipitous effects for pink noise
    if (kind === 'pink' && serendipity > 0) {
      const effectGain = ctx.createGain();
      effectGain.gain.value = 0;
      effectGain.connect(this.backgroundGain);
      
      const makeEffect = () => {
        const effectSrc = ctx.createBufferSource();
        effectSrc.buffer = buffer;
        const effectFilter = ctx.createBiquadFilter();
        effectFilter.type = 'bandpass';
        effectFilter.frequency.value = 100 + Math.random() * 2000;
        effectFilter.Q.value = 2 + Math.random() * 3;
        
        const now = ctx.currentTime;
        effectGain.gain.cancelScheduledValues(now);
        effectGain.gain.setValueAtTime(0, now);
        effectGain.gain.linearRampToValueAtTime(volume * serendipity * 0.6, now + 0.05);
        effectGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
        
        effectSrc.connect(effectFilter).connect(effectGain);
        effectSrc.start(now);
        effectSrc.stop(now + 0.8);
        
        // Schedule next effect based on serendipity
        const nextEffect = 2000 + Math.random() * (8000 - 2000 * serendipity);
        setTimeout(makeEffect, nextEffect);
        this.proceduralNodes.push(effectSrc, effectFilter);
      };
      
      // Start first effect after a delay
      setTimeout(makeEffect, 3000 + Math.random() * 4000);
      this.proceduralNodes.push(effectGain);
    }
  }

  stopProceduralNoise(): void {
    try {
      this.noiseSource?.stop();
      this.noiseSource?.disconnect();
      this.noiseSource = null;
    } catch {}
  }

	private clearProcedural(): void {
		for (const node of this.proceduralNodes) {
			try { (node as any).stop?.(); } catch {}
			try { node.disconnect(); } catch {}
		}
		this.proceduralNodes = [];
	}

	async startWaves(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		// Noise source
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource();
		src.buffer = buffer; src.loop = true;
		// Filter + slow LFO on cutoff
		const filter = ctx.createBiquadFilter();
		filter.type = 'lowpass';
		filter.frequency.value = 400;
		const lfo = ctx.createOscillator();
		lfo.frequency.value = 0.1; // slow
		const lfoGain = ctx.createGain(); lfoGain.gain.value = 300;
		lfo.connect(lfoGain).connect(filter.frequency);
		// Gain
		const gain = ctx.createGain();
		gain.gain.value = volume;
		src.connect(filter).connect(gain).connect(this.backgroundGain);
		src.start(); lfo.start();
		this.proceduralNodes.push(src, filter, lfo, lfoGain, gain);

		// Serendipitous wave crashes
		if (serendipity > 0) {
			const crashGain = ctx.createGain();
			crashGain.gain.value = 0;
			crashGain.connect(this.backgroundGain);
			
			const makeCrash = () => {
				const crashSrc = ctx.createBufferSource();
				crashSrc.buffer = buffer;
				const crashFilter = ctx.createBiquadFilter();
				crashFilter.type = 'lowpass';
				crashFilter.frequency.value = 200 + Math.random() * 300;
				
				const now = ctx.currentTime;
				crashGain.gain.cancelScheduledValues(now);
				crashGain.gain.setValueAtTime(0, now);
				crashGain.gain.linearRampToValueAtTime(volume * serendipity * 0.8, now + 0.1);
				crashGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
				
				crashSrc.connect(crashFilter).connect(crashGain);
				crashSrc.start(now);
				crashSrc.stop(now + 1.5);
				
				// Schedule next crash based on serendipity
				const nextCrash = 3000 + Math.random() * (10000 - 3000 * serendipity);
				setTimeout(makeCrash, nextCrash);
				this.proceduralNodes.push(crashSrc, crashFilter);
			};
			
			// Start first crash after a delay
			setTimeout(makeCrash, 2000 + Math.random() * 5000);
			this.proceduralNodes.push(crashGain);
		}
	}

	async startRain(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		// Base hiss
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(); src.buffer = buffer; src.loop = true;
		const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1500;
		const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 8000;
		const baseGain = ctx.createGain(); baseGain.gain.value = volume * 0.6;
		src.connect(hp).connect(lp).connect(baseGain).connect(this.backgroundGain);
		src.start();
		// Occasional droplets via short noise bursts
		const burstGain = ctx.createGain(); burstGain.gain.value = 0; burstGain.connect(this.backgroundGain);
		const burstSrc = ctx.createBufferSource(); burstSrc.buffer = buffer; burstSrc.loop = true;
		const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 3000; bp.Q.value = 5;
		burstSrc.connect(bp).connect(burstGain);
		burstSrc.start();
		const scheduleBurst = () => {
			const now = ctx.currentTime;
			const g = burstGain.gain;
			g.cancelScheduledValues(now);
			g.setValueAtTime(0, now);
			g.linearRampToValueAtTime(volume * 0.4 * serendipity, now + 0.02);
			g.exponentialRampToValueAtTime(0.0001, now + 0.25);
			// Adjust frequency based on serendipity (higher = more frequent)
			const baseInterval = 400 + Math.random() * 1200;
			const serendipityMultiplier = 1 - (serendipity * 0.7); // Higher serendipity = shorter intervals
			setTimeout(scheduleBurst, baseInterval * serendipityMultiplier);
		};
		scheduleBurst();
		this.proceduralNodes.push(src, hp, lp, baseGain, burstGain, burstSrc, bp);
	}

	async startBirds(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		const out = ctx.createGain(); out.gain.value = volume; out.connect(this.backgroundGain);
		const makeChirp = () => {
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			const g = ctx.createGain(); g.gain.value = 0; osc.connect(g).connect(out);
			const now = ctx.currentTime;
			const startFreq = 1500 + Math.random() * 2000;
			const endFreq = 800 + Math.random() * 1200;
			osc.frequency.setValueAtTime(startFreq, now);
			osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.18);
			g.gain.linearRampToValueAtTime(volume * 0.5 * serendipity, now + 0.02);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
			osc.start(now);
			osc.stop(now + 0.3);
			// Adjust frequency based on serendipity (higher = more frequent)
			const baseInterval = 800 + Math.random() * 2500;
			const serendipityMultiplier = 1 - (serendipity * 0.8); // Higher serendipity = shorter intervals
			setTimeout(makeChirp, baseInterval * serendipityMultiplier);
			this.proceduralNodes.push(osc, g);
		};
		makeChirp();
		this.proceduralNodes.push(out);
	}

	async startForest(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		
		// Base forest ambience (wind through trees)
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(); 
		src.buffer = buffer; 
		src.loop = true;
		
		// Filter for forest-like frequencies
		const hp = ctx.createBiquadFilter(); 
		hp.type = 'highpass'; 
		hp.frequency.value = 200;
		const lp = ctx.createBiquadFilter(); 
		lp.type = 'lowpass'; 
		lp.frequency.value = 3000;
		
		const baseGain = ctx.createGain(); 
		baseGain.gain.value = volume * 0.4;
		src.connect(hp).connect(lp).connect(baseGain).connect(this.backgroundGain);
		src.start();
		
		// Add bird chirps (less frequent than dedicated birds preset)
		const birdGain = ctx.createGain(); 
		birdGain.gain.value = 0; 
		birdGain.connect(this.backgroundGain);
		
		const makeForestBird = () => {
			const osc = ctx.createOscillator();
			osc.type = 'triangle';
			const g = ctx.createGain(); 
			g.gain.value = 0; 
			osc.connect(g).connect(birdGain);
			
			const now = ctx.currentTime;
			const startFreq = 1200 + Math.random() * 1500;
			const endFreq = 600 + Math.random() * 800;
			osc.frequency.setValueAtTime(startFreq, now);
			osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.15);
			g.gain.linearRampToValueAtTime(volume * 0.3 * serendipity, now + 0.02);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
			osc.start(now);
			osc.stop(now + 0.25);
			
			// Less frequent than dedicated birds preset
			const baseInterval = 3000 + Math.random() * 8000;
			const serendipityMultiplier = 1 - (serendipity * 0.5);
			setTimeout(makeForestBird, baseInterval * serendipityMultiplier);
			this.proceduralNodes.push(osc, g);
		};
		
		// Start first bird after a delay
		setTimeout(makeForestBird, 2000 + Math.random() * 5000);
		this.proceduralNodes.push(src, hp, lp, baseGain, birdGain);
	}

	async startFireplace(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		
		// Base crackling fire sound
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(); 
		src.buffer = buffer; 
		src.loop = true;
		
		// Filter for fire-like frequencies (low to mid)
		const hp = ctx.createBiquadFilter(); 
		hp.type = 'highpass'; 
		hp.frequency.value = 100;
		const lp = ctx.createBiquadFilter(); 
		lp.type = 'lowpass'; 
		lp.frequency.value = 2000;
		
		const baseGain = ctx.createGain(); 
		baseGain.gain.value = volume * 0.5;
		src.connect(hp).connect(lp).connect(baseGain).connect(this.backgroundGain);
		src.start();
		
		// Add crackling pops
		const popGain = ctx.createGain(); 
		popGain.gain.value = 0; 
		popGain.connect(this.backgroundGain);
		
		const makePop = () => {
			const popSrc = ctx.createBufferSource();
			popSrc.buffer = buffer;
			const popFilter = ctx.createBiquadFilter();
			popFilter.type = 'bandpass';
			popFilter.frequency.value = 800 + Math.random() * 1200;
			popFilter.Q.value = 3 + Math.random() * 2;
			
			const now = ctx.currentTime;
			popGain.gain.cancelScheduledValues(now);
			popGain.gain.setValueAtTime(0, now);
			popGain.gain.linearRampToValueAtTime(volume * 0.6 * serendipity, now + 0.01);
			popGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
			
			popSrc.connect(popFilter).connect(popGain);
			popSrc.start(now);
			popSrc.stop(now + 0.15);
			
			// Schedule next pop
			const baseInterval = 200 + Math.random() * 800;
			const serendipityMultiplier = 1 - (serendipity * 0.6);
			setTimeout(makePop, baseInterval * serendipityMultiplier);
			this.proceduralNodes.push(popSrc, popFilter);
		};
		
		// Start first pop after a delay
		setTimeout(makePop, 1000 + Math.random() * 2000);
		this.proceduralNodes.push(src, hp, lp, baseGain, popGain);
	}

	async startStream(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		
		// Base water flow sound
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(); 
		src.buffer = buffer; 
		src.loop = true;
		
		// Filter for water-like frequencies
		const hp = ctx.createBiquadFilter(); 
		hp.type = 'highpass'; 
		hp.frequency.value = 800;
		const lp = ctx.createBiquadFilter(); 
		lp.type = 'lowpass'; 
		lp.frequency.value = 6000;
		
		const baseGain = ctx.createGain(); 
		baseGain.gain.value = volume * 0.6;
		src.connect(hp).connect(lp).connect(baseGain).connect(this.backgroundGain);
		src.start();
		
		// Add water splashes
		const splashGain = ctx.createGain(); 
		splashGain.gain.value = 0; 
		splashGain.connect(this.backgroundGain);
		
		const makeSplash = () => {
			const splashSrc = ctx.createBufferSource();
			splashSrc.buffer = buffer;
			const splashFilter = ctx.createBiquadFilter();
			splashFilter.type = 'bandpass';
			splashFilter.frequency.value = 2000 + Math.random() * 3000;
			splashFilter.Q.value = 2 + Math.random() * 2;
			
			const now = ctx.currentTime;
			splashGain.gain.cancelScheduledValues(now);
			splashGain.gain.setValueAtTime(0, now);
			splashGain.gain.linearRampToValueAtTime(volume * 0.4 * serendipity, now + 0.02);
			splashGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);
			
			splashSrc.connect(splashFilter).connect(splashGain);
			splashSrc.start(now);
			splashSrc.stop(now + 0.3);
			
			// Schedule next splash
			const baseInterval = 1500 + Math.random() * 3000;
			const serendipityMultiplier = 1 - (serendipity * 0.4);
			setTimeout(makeSplash, baseInterval * serendipityMultiplier);
			this.proceduralNodes.push(splashSrc, splashFilter);
		};
		
		// Start first splash after a delay
		setTimeout(makeSplash, 2000 + Math.random() * 4000);
		this.proceduralNodes.push(src, hp, lp, baseGain, splashGain);
	}

	async startWind(volume: number, serendipity: number = 0.1): Promise<void> {
		const ctx = await this.ensureContext();
		this.clearProcedural();
		
		// Base wind sound
		const bufferSize = 2 * ctx.sampleRate;
		const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource(); 
		src.buffer = buffer; 
		src.loop = true;
		
		// Filter for wind-like frequencies (low to mid)
		const hp = ctx.createBiquadFilter(); 
		hp.type = 'highpass'; 
		hp.frequency.value = 150;
		const lp = ctx.createBiquadFilter(); 
		lp.type = 'lowpass'; 
		lp.frequency.value = 1500;
		
		const baseGain = ctx.createGain(); 
		baseGain.gain.value = volume * 0.5;
		src.connect(hp).connect(lp).connect(baseGain).connect(this.backgroundGain);
		src.start();
		
		// Add wind gusts
		const gustGain = ctx.createGain(); 
		gustGain.gain.value = 0; 
		gustGain.connect(this.backgroundGain);
		
		const makeGust = () => {
			const gustSrc = ctx.createBufferSource();
			gustSrc.buffer = buffer;
			const gustFilter = ctx.createBiquadFilter();
			gustFilter.type = 'lowpass';
			gustFilter.frequency.value = 800 + Math.random() * 700;
			
			const now = ctx.currentTime;
			gustGain.gain.cancelScheduledValues(now);
			gustGain.gain.setValueAtTime(0, now);
			gustGain.gain.linearRampToValueAtTime(volume * 0.7 * serendipity, now + 0.5);
			gustGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.0);
			
			gustSrc.connect(gustFilter).connect(gustGain);
			gustSrc.start(now);
			gustSrc.stop(now + 2.0);
			
			// Schedule next gust
			const baseInterval = 4000 + Math.random() * 8000;
			const serendipityMultiplier = 1 - (serendipity * 0.3);
			setTimeout(makeGust, baseInterval * serendipityMultiplier);
			this.proceduralNodes.push(gustSrc, gustFilter);
		};
		
		// Start first gust after a delay
		setTimeout(makeGust, 3000 + Math.random() * 5000);
		this.proceduralNodes.push(src, hp, lp, baseGain, gustGain);
	}

	async startPreset(preset: 'waves' | 'rain' | 'birds' | 'pink' | 'forest' | 'fireplace' | 'stream' | 'wind' | 'white' | 'brown', volume: number, serendipity: number = 0.1): Promise<void> {
		console.log('Starting audio preset:', preset, 'volume:', volume, 'serendipity:', serendipity);
		switch (preset) {
			case 'waves':
				return this.startWaves(volume, serendipity);
			case 'rain':
				return this.startRain(volume, serendipity);
			case 'birds':
				return this.startBirds(volume, serendipity);
			case 'forest':
				return this.startForest(volume, serendipity);
			case 'fireplace':
				return this.startFireplace(volume, serendipity);
			case 'stream':
				return this.startStream(volume, serendipity);
			case 'wind':
				return this.startWind(volume, serendipity);
			case 'white':
				return this.startProceduralNoise('white', volume, serendipity);
			case 'brown':
				return this.startProceduralNoise('brown', volume, serendipity);
			case 'pink':
			default:
				return this.startProceduralNoise('pink', volume, serendipity);
		}
	}

	stopAll(): void {
		this.stopBackground();
		this.stopProceduralNoise();
		this.clearProcedural();
		this.stopAudioLevelMonitoring();
	}
}

export const audioEngine = new AudioEngine();


