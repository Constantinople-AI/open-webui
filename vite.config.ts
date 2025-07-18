import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
	plugins: [
		sveltekit(),
		viteStaticCopy({
			targets: [
				{
					src: 'node_modules/onnxruntime-web/dist/*.jsep.*',

					dest: 'wasm'
				}
			]
		})
	],
	define: {
		APP_VERSION: JSON.stringify(process.env.npm_package_version),
		APP_BUILD_HASH: JSON.stringify(process.env.APP_BUILD_HASH || 'dev-build')
	},
	build: {
		sourcemap: true
	},
	worker: {
		format: 'es'
	},
	esbuild: {
		pure: process.env.ENV === 'dev' ? [] : ['console.log', 'console.debug']
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		watch: {
			usePolling: true,
			interval: 1000
		},
		hmr: {
			port: 5173,
			host: '0.0.0.0'
		},
		proxy: {
			'/api': {
				target: 'http://localhost:3100',
				changeOrigin: true,
				secure: false
			},
			'/ws': {
				target: 'ws://localhost:3100',
				ws: true,
				changeOrigin: true
			}
		}
	}
});
