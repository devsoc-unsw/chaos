const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Nunito", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: 'hsl(220, 97%, 98%)',
          100: 'hsl(220, 96%, 93%)',
          200: 'hsl(220, 95%, 85%)',
          300: 'hsl(220, 95%, 78%)',
          400: 'hsl(220, 94%, 70%)',
          500: 'hsl(220, 94%, 60%)',
          600: 'hsl(220, 93%, 54%)',
          700: 'hsl(220, 93%, 46%)',
          800: 'hsl(220, 85%, 38%)',
          900: 'hsl(220, 70%, 30%)',
          950: 'hsl(220, 50%, 20%)',
        },
      },
      minWidth: defaultTheme.width,
      maxWidth: defaultTheme.width,
      minHeight: defaultTheme.height,
    },
  },
  plugins: [
    require("tailwindcss-gradient"),
    require("@tailwindcss/forms"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
