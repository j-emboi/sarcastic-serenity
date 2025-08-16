import { writable, type Writable } from 'svelte/store';
import type { BreathingAnimationType } from '../breathing/types';

export type Persona = 'student' | 'working_adult' | 'creator' | 'teacher' | 'caregiver';
export type ProfanityLevel = 'off' | 'medium' | 'strict';

export interface AppSettings {
	durationMinutes: number;
	persona: Persona;
	roastIntensity: number; // 0..4
	profanity: ProfanityLevel; // default 'off' (unsafe)
	serendipity: number; // 0..1
	breathingEnabled: boolean;
	breathingAnimation: BreathingAnimationType;
	backgroundVolume: number; // 0..1
	backgroundSrc?: string; // path under /audio, e.g. '/audio/loop.mp3'
	ambientPreset: 'none' | 'waves' | 'rain' | 'birds' | 'pink';
	// Voice settings
	voiceId?: string; // voice URI for reliable identification
	voicePitch: number; // 0.5..2.0, default 1.8 for "puppet" vibe
	voiceRate: number; // 0.1..10.0, default 1.12
}

const DEFAULT_SETTINGS: AppSettings = {
	durationMinutes: 1, // Micro-wellness: start with 1 minute
	persona: 'student',
	roastIntensity: 1, // Gentler by default for micro-moments
	profanity: 'off',
	serendipity: 0.1,
	breathingEnabled: false,
	breathingAnimation: 'expanding-circle',
	backgroundVolume: 0.4,
	backgroundSrc: '',
	ambientPreset: 'waves',
	// Voice defaults for "puppet" vibe
	voiceId: undefined, // will be auto-selected
	voicePitch: 1.8,
	voiceRate: 1.12
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


