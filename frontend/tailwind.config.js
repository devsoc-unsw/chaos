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
          50: 'hsl(220, 93%, 97%)',
          500: 'hsl(220, 93%, 60%)',
          600: 'hsl(220, 93%, 54%)',
          900: 'hsl(220, 70%, 30%)',
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
