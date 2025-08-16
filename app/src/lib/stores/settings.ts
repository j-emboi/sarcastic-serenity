import { writable, type Writable } from 'svelte/store';

export type Persona = 'student' | 'working_adult' | 'creator' | 'teacher' | 'caregiver';
export type ProfanityLevel = 'off' | 'medium' | 'strict';

// Utility function to get all available personas
export function getAvailablePersonas(): { value: Persona; label: string }[] {
	return [
		{ value: 'student', label: 'Student' },
		{ value: 'working_adult', label: 'Working Adult' },
		{ value: 'creator', label: 'Creator' },
		{ value: 'teacher', label: 'Teacher' },
		{ value: 'caregiver', label: 'Caregiver' }
	];
}

export interface AppSettings {
	durationMinutes: number;
	persona: Persona;
	roastIntensity: number; // 0..4
	// Voice settings
	voiceId?: string; // voice URI for reliable identification
	voicePitch: number; // 0.5..2.0, default 1.0 (normal)
	voiceRate: number; // 0.1..10.0, default 1.0 (normal)
	// AI Voice settings
	useAIVoice: boolean; // Whether to use AI voice instead of browser TTS
	aiVoiceId?: string; // AI voice ID
	aiVoicePitch: number; // -50 to 50, default 0
	aiVoiceRate: number; // -50 to 50, default 0
	aiVoiceVolume: number; // 0 to 100, default 80
	// Unified Voice settings
	selectedVoiceType: 'character' | 'ai' | 'browser'; // Type of voice to use
	selectedVoiceId?: string; // Selected voice ID
}

const DEFAULT_SETTINGS: AppSettings = {
	durationMinutes: 3, // Micro-wellness: extended to 3 minutes
	persona: 'student',
	roastIntensity: 4, // Nuclear sarcasm by default
	// Voice defaults for normal speech
	voiceId: undefined, // will be auto-selected
	voicePitch: 1.0, // Normal pitch
	voiceRate: 1.0, // Normal speed
	// AI Voice defaults
	useAIVoice: false, // Default to browser TTS
	aiVoiceId: undefined, // will be auto-selected
	aiVoicePitch: 0, // Normal pitch
	aiVoiceRate: 0, // Normal speed
	aiVoiceVolume: 80, // Good volume level
	// Unified Voice defaults
	selectedVoiceType: 'browser', // Default to browser TTS
	selectedVoiceId: undefined // will be auto-selected
};

const STORAGE_KEY = 'sarcastic-serenity:settings';

function loadFromStorage(): AppSettings {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return DEFAULT_SETTINGS;
		const parsed = JSON.parse(raw);
		return { ...DEFAULT_SETTINGS, ...parsed } satisfies AppSettings;
	} catch {
		return DEFAULT_SETTINGS;
	}
}

export const settings: Writable<AppSettings> = writable(DEFAULT_SETTINGS);

export function initSettingsFromStorage(): void {
	settings.set(loadFromStorage());
}

settings.subscribe((value) => {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
	} catch {
		/* ignore */
	}
});


