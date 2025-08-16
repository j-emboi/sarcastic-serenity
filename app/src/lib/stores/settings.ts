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
	backgroundVolume: number; // 0..1
	ambientPreset: 'none' | 'waves' | 'rain' | 'birds' | 'pink';
	// Voice settings
	voiceId?: string; // voice URI for reliable identification
	voicePitch: number; // 0.5..2.0, default 1.8 for "puppet" vibe
	voiceRate: number; // 0.1..10.0, default 1.12
}

const DEFAULT_SETTINGS: AppSettings = {
	durationMinutes: 1, // Micro-wellness: start with 1 minute
	persona: 'student',
	roastIntensity: 4, // Nuclear sarcasm by default
	backgroundVolume: 0.4,
	ambientPreset: 'waves',
	// Voice defaults for normal speech
	voiceId: undefined, // will be auto-selected
	voicePitch: 1.0, // Normal pitch
	voiceRate: 1.0 // Normal speed
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


