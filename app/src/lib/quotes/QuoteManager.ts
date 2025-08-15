import quotes from './catalog.json';
import type { Persona, ProfanityLevel } from '../stores/settings';

export interface Quote {
	text: string;
	persona: Persona[];
	intensity: number; // 0..4
	unsafe: boolean;
}

export interface QuoteOptions {
	persona: Persona;
	intensity: number;
	profanity: ProfanityLevel;
}

export class QuoteManager {
	private usedQuotes: Set<string> = new Set();
	private sessionSeed: number;
	private lastQuoteTime: number = 0;
	private baseInterval: number = 35; // Base 35 seconds
	private jitterRange: number = 10; // ±10 seconds

	constructor() {
		// Generate a session seed for reproducible randomness
		this.sessionSeed = Math.floor(Math.random() * 1000000);
	}

	/**
	 * Get a quote based on options with smart filtering and repetition prevention
	 */
	getQuote(options: QuoteOptions): Quote | null {
		const pool = this.getFilteredPool(options);
		if (pool.length === 0) {
			return null;
		}

		// Remove quotes that have been used in this session
		const availableQuotes = pool.filter(q => !this.usedQuotes.has(q.text));
		
		// If we've used most quotes, reset the used quotes set (but keep some variety)
		if (availableQuotes.length < pool.length * 0.3) {
			this.usedQuotes.clear();
			return this.getRandomQuote(pool);
		}

		const quote = this.getRandomQuote(availableQuotes);
		if (quote) {
			this.usedQuotes.add(quote.text);
		}
		
		return quote;
	}

	/**
	 * Get the next quote timing with jitter
	 */
	getNextQuoteTime(): number {
		const now = Date.now();
		const timeSinceLastQuote = now - this.lastQuoteTime;
		
		// If it's been less than the minimum interval, wait
		const minInterval = (this.baseInterval - this.jitterRange) * 1000;
		if (timeSinceLastQuote < minInterval) {
			return minInterval - timeSinceLastQuote;
		}

		// Calculate jittered interval
		const jitter = (Math.random() - 0.5) * 2 * this.jitterRange;
		const interval = (this.baseInterval + jitter) * 1000;
		
		return interval;
	}

	/**
	 * Mark that a quote was just spoken (updates lastQuoteTime)
	 */
	markQuoteSpoken(): void {
		this.lastQuoteTime = Date.now();
	}

	/**
	 * Get initial delay for first quote (shorter than regular intervals)
	 */
	getInitialDelay(): number {
		// Start with a much shorter delay for the first quote (5-10 seconds)
		const baseDelay = 5; // 5 seconds base
		const jitter = (Math.random() - 0.5) * 5; // ±2.5 seconds
		return (baseDelay + jitter) * 1000;
	}

	/**
	 * Reset the session (clear used quotes, new seed)
	 */
	resetSession(): void {
		this.usedQuotes.clear();
		this.sessionSeed = Math.floor(Math.random() * 1000000);
		this.lastQuoteTime = 0;
	}

	/**
	 * Get statistics about the quote pool
	 */
	getStats(): {
		total: number;
		byPersona: Record<Persona, number>;
		byIntensity: Record<number, number>;
		byProfanity: { safe: number; unsafe: number };
	} {
		const stats = {
			total: quotes.length,
			byPersona: { student: 0, working_adult: 0, creator: 0 } as Record<Persona, number>,
			byIntensity: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 } as Record<number, number>,
			byProfanity: { safe: 0, unsafe: 0 }
		};

		quotes.forEach(quote => {
			quote.persona.forEach(p => {
			if (p in stats.byPersona) {
				stats.byPersona[p as keyof typeof stats.byPersona]++;
			}
		});
			stats.byIntensity[quote.intensity]++;
			if (quote.unsafe) {
				stats.byProfanity.unsafe++;
			} else {
				stats.byProfanity.safe++;
			}
		});

		return stats;
	}

	private getFilteredPool(options: QuoteOptions): Quote[] {
		const allQuotes = quotes as Quote[];
		
		const filtered = allQuotes.filter((q) => {
			const personaMatch = q.persona.includes(options.persona);
			const intensityMatch = q.intensity <= options.intensity;
			const profanityMatch = this.passesProfanityFilter(q, options.profanity);
			
			return personaMatch && intensityMatch && profanityMatch;
		});
		
		return filtered;
	}

	private passesProfanityFilter(quote: Quote, profanityLevel: ProfanityLevel): boolean {
		switch (profanityLevel) {
			case 'off':
				return true; // Allow all quotes (unsafe by default)
			case 'medium':
				return !quote.unsafe; // Only safe quotes
			case 'strict':
				return !quote.unsafe; // Only safe quotes
			default:
				return true;
		}
	}

	private getRandomQuote(pool: Quote[]): Quote | null {
		if (pool.length === 0) return null;
		
		// Use seeded random for reproducible sessions
		const randomIndex = this.getSeededRandom(0, pool.length - 1);
		return pool[randomIndex];
	}

	private getSeededRandom(min: number, max: number): number {
		// Simple seeded random number generator
		this.sessionSeed = (this.sessionSeed * 9301 + 49297) % 233280;
		const random = this.sessionSeed / 233280;
		return Math.floor(random * (max - min + 1)) + min;
	}
}

// Export a singleton instance
export const quoteManager = new QuoteManager();
