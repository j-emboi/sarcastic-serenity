import { quoteManager, type Quote, type QuoteOptions } from './QuoteManager';

// Re-export types for backward compatibility
export type { Quote, QuoteOptions } from './QuoteManager';

/**
 * Legacy function for backward compatibility
 * @deprecated Use quoteManager.getQuote() instead
 */
export function pickQuote(options: QuoteOptions): Quote | null {
	return quoteManager.getQuote(options);
}

// Re-export the quote manager for new functionality
export { quoteManager };


