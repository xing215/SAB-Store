import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
	plugins: [react()],

	esbuild: {
		loader: 'jsx',
		include: /src\/.*\.jsx?$/,
		exclude: [],
		target: 'es2015',
	},

	optimizeDeps: {
		esbuildOptions: {
			loader: {
				'.js': 'jsx',
			},
		},
	},

	// Development server configuration
	server: {
		port: 3000,
		host: true,
		strictPort: true,
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:5000',
				changeOrigin: true,
				secure: false,
			}
		}
	},

	// Build configuration
	build: {
		outDir: 'build',
		sourcemap: false,
		minify: 'esbuild',
		target: 'es2015',
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['react', 'react-dom', 'react-router-dom'],
					ui: ['react-toastify', 'sweetalert2'],
				},
			},
		},
	},

	// Preview server configuration
	preview: {
		port: 3000,
		host: true,
		strictPort: true,
	},

	// Path resolution
	resolve: {
		alias: {
			'@': '/src',
		},
	},

	// Environment variables prefix
	envPrefix: 'VITE_',
});
