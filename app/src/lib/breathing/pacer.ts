import type { BreathingPattern, BreathingState, BreathingPhase, BreathingCallbacks } from './types';

export class BreathingPacer {
  private state: BreathingState;
  private callbacks: BreathingCallbacks;
  private animationFrameId: number | null = null;
  private lastUpdateTime: number = 0;
  private phaseStartTime: number = 0;

  constructor(pattern: BreathingPattern, callbacks: BreathingCallbacks = {}) {
    this.state = {
      isActive: false,
      currentPhase: 'inhale',
      timeRemaining: pattern.inhale,
      cycleCount: 1,
      totalCycles: pattern.cycles,
      elapsedTime: 0,
      pattern
    };
    this.callbacks = callbacks;
  }

  start(): void {
    if (this.state.isActive) return;
    
    this.state.isActive = true;
    this.state.currentPhase = 'inhale';
    this.state.timeRemaining = this.state.pattern.inhale;
    this.state.cycleCount = 1;
    this.state.elapsedTime = 0;
    this.phaseStartTime = performance.now() / 1000;
    this.lastUpdateTime = this.phaseStartTime;
    
    this.callbacks.onPhaseChange?.(this.state.currentPhase);
    this.animate();
    
    console.log('Breathing pacer started:', {
      pattern: this.state.pattern.name,
      firstPhase: this.state.currentPhase,
      timeRemaining: this.state.timeRemaining
    });
  }

  stop(): void {
    if (!this.state.isActive) return;
    
    this.state.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Breathing pacer stopped');
  }

  pause(): void {
    if (!this.state.isActive) return;
    
    this.state.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    console.log('Breathing pacer paused');
  }

  resume(): void {
    if (this.state.isActive) return;
    
    this.state.isActive = true;
    this.lastUpdateTime = performance.now() / 1000;
    this.animate();
    
    console.log('Breathing pacer resumed');
  }

  setPattern(pattern: BreathingPattern): void {
    this.state.pattern = pattern;
    this.state.totalCycles = pattern.cycles;
    
    // Reset to first phase if not active
    if (!this.state.isActive) {
      this.state.currentPhase = 'inhale';
      this.state.timeRemaining = pattern.inhale;
      this.state.cycleCount = 1;
      this.state.elapsedTime = 0;
    }
    
    console.log('Breathing pattern changed to:', pattern.name);
  }

  getState(): BreathingState {
    return { ...this.state };
  }

  private animate(): void {
    if (!this.state.isActive) return;

    const currentTime = performance.now() / 1000;
    const deltaTime = currentTime - this.lastUpdateTime;
    this.lastUpdateTime = currentTime;

    // Update elapsed time
    this.state.elapsedTime += deltaTime;

    // Update time remaining in current phase
    this.state.timeRemaining -= deltaTime;

    // Call time update callback
    this.callbacks.onTimeUpdate?.(this.state.timeRemaining, this.state.currentPhase);

    // Check if phase is complete
    if (this.state.timeRemaining <= 0) {
      this.nextPhase();
    }

    // Continue animation
    this.animationFrameId = requestAnimationFrame(() => this.animate());
  }

  private nextPhase(): void {
    const phases: BreathingPhase[] = ['inhale', 'hold', 'exhale'];
    
    // Add second hold if pattern has it
    if (this.state.pattern.hold2 !== undefined) {
      phases.push('hold2');
    }

    const currentIndex = phases.indexOf(this.state.currentPhase);
    const nextIndex = (currentIndex + 1) % phases.length;

    // Check if cycle is complete
    if (nextIndex === 0) {
      this.state.cycleCount++;
      this.callbacks.onCycleComplete?.(this.state.cycleCount - 1);
      
      // Check if session is complete
      if (this.state.cycleCount > this.state.totalCycles) {
        this.completeSession();
        return;
      }
    }

    // Set next phase
    this.state.currentPhase = phases[nextIndex];
    this.state.timeRemaining = this.getPhaseDuration(this.state.currentPhase);
    this.phaseStartTime = performance.now() / 1000;

    // Call phase change callback
    this.callbacks.onPhaseChange?.(this.state.currentPhase);

    console.log('Breathing phase changed:', {
      phase: this.state.currentPhase,
      timeRemaining: this.state.timeRemaining,
      cycle: this.state.cycleCount
    });
  }

  private getPhaseDuration(phase: BreathingPhase): number {
    switch (phase) {
      case 'inhale':
        return this.state.pattern.inhale;
      case 'hold':
        return this.state.pattern.hold;
      case 'exhale':
        return this.state.pattern.exhale;
      case 'hold2':
        return this.state.pattern.hold2 || 0;
      default:
        return 0;
    }
  }

  private completeSession(): void {
    this.state.isActive = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    this.callbacks.onSessionComplete?.();
    
    console.log('Breathing session completed');
  }

  destroy(): void {
    this.stop();
  }
}
