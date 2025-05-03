const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: [
  				'Nunito',
                    ...defaultTheme.fontFamily.sans
                ]
  		},
  		colors: {
  			brand: {
  				'50': 'hsl(220, 97%, 97%)',
  				'75': 'hsl(220, 97%, 95%)',
  				'100': 'hsl(220, 96%, 93%)',
  				'200': 'hsl(220, 95%, 85%)',
  				'300': 'hsl(220, 95%, 78%)',
  				'400': 'hsl(220, 94%, 70%)',
  				'500': 'hsl(220, 94%, 60%)',
  				'600': 'hsl(220, 93%, 54%)',
  				'700': 'hsl(220, 93%, 48%)',
  				'800': 'hsl(220, 85%, 40%)',
  				'900': 'hsl(220, 70%, 30%)',
  				'950': 'hsl(220, 50%, 20%)'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		minWidth: 'defaultTheme.width',
  		maxWidth: 'defaultTheme.width',
  		minHeight: 'defaultTheme.height',
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [
    require("tailwindcss-gradient"),
    require("@tailwindcss/forms")({
      strategy: "class",
    }),
    require("@tailwindcss/aspect-ratio"),
    require("@headlessui/tailwindcss"),
      require("tailwindcss-animate")
],

};
