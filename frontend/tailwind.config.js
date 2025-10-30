/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./src/**/*.{js,jsx,ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				// Brand colors based on logo CMYK values
				primary: {
					50: '#f0f2ff',
					100: '#e1e6ff',
					200: '#c8d1ff',
					300: '#a6b4ff',
					400: '#8591ff',
					500: '#5d6eff',
					600: '#4651f5',
					700: '#3a42e0',
					800: '#334CA6', // C 80 M 70 Y 00 K 00 - Main dark blue
					900: '#2a3985',
				},
				secondary: {
					50: '#f0fffe',
					100: '#ccffff',
					200: '#99ffff',
					300: '#66CCCC', // C 60 M 00 Y 20 K 00 - Main light blue/teal
					400: '#33cccc',
					500: '#00cccc',
					600: '#00b3b3',
					700: '#009999',
					800: '#008080',
					900: '#006666',
				},
				accent: {
					50: '#fffef5',
					100: '#fffbe6',
					200: '#fff7cc',
					300: '#fff0a3',
					400: '#ffe680',
					500: '#ffdd4d',
					600: '#FFCC66', // C 00 M 20 Y 70 K 00 - Main yellow
					700: '#ffb833',
					800: '#e6a000',
					900: '#b37a00',
				},
				success: {
					50: '#f0fdf4',
					100: '#dcfce7',
					200: '#bbf7d0',
					300: '#86efac',
					400: '#4ade80',
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d',
					800: '#166534',
					900: '#14532d',
				},
				warning: {
					50: '#fffbeb',
					100: '#fef3c7',
					200: '#fde68a',
					300: '#fcd34d',
					400: '#fbbf24',
					500: '#f59e0b',
					600: '#d97706',
					700: '#b45309',
					800: '#92400e',
					900: '#78350f',
				},
				danger: {
					50: '#fef2f2',
					100: '#fee2e2',
					200: '#fecaca',
					300: '#fca5a5',
					400: '#f87171',
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c',
					800: '#991b1b',
					900: '#7f1d1d',
				}
			},
			fontFamily: {
				'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
				'vietnamese': ['Roboto', 'Arial', 'sans-serif']
			},
			animation: {
				'bounce-slow': 'bounce 2s infinite',
				'pulse-slow': 'pulse 3s infinite',
				'fade-in': 'fadeIn 0.5s ease-in-out',
				'slide-up': 'slideUp 0.3s ease-out',
				'scale-in': 'scaleIn 0.2s ease-out'
			},
			keyframes: {
				fadeIn: {
					'0%': { opacity: '0' },
					'100%': { opacity: '1' }
				},
				slideUp: {
					'0%': { transform: 'translateY(10px)', opacity: '0' },
					'100%': { transform: 'translateY(0)', opacity: '1' }
				},
				scaleIn: {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				}
			}
		},
	},
	plugins: [],
}
