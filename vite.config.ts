import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		VitePWA({
			registerType: 'autoUpdate',
			manifest: {
				name: 'Sarcastic Serenity',
				short_name: 'Serenity',
				description: 'Offline-first sarcastic relaxation app',
				display: 'standalone',
				background_color: '#0b0b0f',
				theme_color: '#111827',
				icons: [
					{ src: '/favicon.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
				]
			},
			workbox: {
				cleanupOutdatedCaches: true,
				navigateFallback: '/'
			}
		})
	],
	server: {
		port: 5173,
		strictPort: true,
		host: true,
		hmr: {
			port: 5173
		},
		headers: {
			'Cross-Origin-Embedder-Policy': 'require-corp',
			'Cross-Origin-Opener-Policy': 'same-origin'
		}
	},
	optimizeDeps: {
		include: ['ogl']
	},
	build: {
		target: 'esnext',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte']
				}
			}
		},
		minify: 'terser',
		terserOptions: {
			compress: {
				drop_console: false // Keep console logs for debugging
			}
		}
	}
});
