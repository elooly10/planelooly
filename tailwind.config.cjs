/** @type {import('tailwindcss').Config} */
module.exports = {
	important: false,
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		fontSize: {
			'2xs': '0.25rem',
			xs: '0.5rem',
			sm: '0.8rem',
			md: '0.9rem',
			base: '1rem',
			mg: '1.0625rem',
			lg: '1.125rem',
			xl: '1.25rem',
			'2xl': '1.563rem',
			'3xl': '1.953rem',
			'4xl': '2.441rem',
			'5xl': '3.052rem',
			'6xl': '3.751rem',
			'7xl': '4.252rem',
			'8xl': '5.012rem',
			'9xl': '5.772rem',
			'10xl': '6.532rem',
			'11xl': '7.292rem',
			'12xl': '8.052rem',
			'13xl': '8.812rem',
			'14xl': '9.572rem',
			'15xl': '10.332rem',
			'16xl': '11.092rem',
			'17xl': '11.852rem',
			'18xl': '12.612rem',
			'19xl': '13.312rem',
			'20xl': '14.132rem'
		},
		fontFamily: {
			sans: ['Roboto', 'Arial', 'Helvetica', 'ui-sans-serif', 'system-ui'],
			serif: ['"Roboto Slab"', 'Georgia', 'ui-serif'],
			mono: ['"Ubuntu Mono"', 'ui-monospace', 'SFMono-Regular']
		},
		extend: {
			backgroundImage: {
				'auth-background': "url('/AuthBackground.svg')"
			},
			colors: {
				scarlet_pin: '#f28c5a',
				fuchsia_pin: '#d326a8',
				pink_pin: '#f78dc5',
				primary: {
					50: '#f4f7fd',
					100: '#eaf0fb',
					200: '#c2d3f4',
					300: '#9ab6ed',
					400: '#628de3',
					500: '#386edc',
					600: '#2257c0',
					700: '#1a4396',
					800: '#13306b',
					900: '#162d5a'
				},
				focus: {
					50: '#f9f4fd',
					100: '#f1e5f4',
					200: '#e6d4f7',
					300: '#c9a3ef',
					400: '#a362e3',
					500: '#8f40dd',
					600: '#7b25d1',
					700: '#671fb0',
					800: '#54198e',
					900: '#522183'
				},
				secondary: {
					50: '#f4fdf7',
					100: '#e5f4e9',
					200: '#d4f7e0',
					300: '#a3efbc',
					400: '#62e38d',
					500: '#40dd75',
					600: '#25a15e',
					700: '#1f903f',
					800: '#197e30',
					900: '#136328',
					950: '#025521'
				},
				tertiary: {
					50: '#fdf4f6',
					100: '#f8e4ea',
					200: '#f7d4da',
					300: '#efa3b0',
					400: '#e36277',
					500: '#dd405a',
					600: '#d12542',
					700: '#b01f37',
					800: '#8e192d',
					900: '#832131'
				},
				pretzel: {
					50: '#fff9f3',
					100: '#fef3e7',
					200: '#fddbb9',
					300: '#fcc48b',
					400: '#faa34b',
					500: '#f98a1a',
					600: '#dc7106',
					700: '#ac5804',
					800: '#7b3f03',
					900: '#683808'
				},
			},
			animation: {
				'spin-750': 'spin .75s linear infinite',
				'bounce-750': 'bounce .75s linear infinite',
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms')
	]
};
