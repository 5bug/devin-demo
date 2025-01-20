import animate from "tailwindcss-animate"

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', '"Noto Sans"', '"Segoe UI"', 'sans-serif'],
      },
      fontSize: {
        base: ['1rem', '1.5'],
      },
      colors: {
        primary: '#ECECF1',
        secondary: '#8E8EA0',
        background: '#343541',
        'background-secondary': '#444654',
        'background-input': '#40414F',
        'background-hover': '#2A2B32',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [animate],
}

