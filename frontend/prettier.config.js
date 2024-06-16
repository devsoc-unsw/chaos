/**
 * @type {import("prettier").Config}
 */
module.exports = {
  trailingComma: "es5",
  tabWidth: 2,
  semi: true,
  singleQuote: false,
  printWidth: 80,
  useTabs: false,
  quoteProps: "as-needed",
  jsxSingleQuote: false,
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: "always",

  plugins: ["prettier-plugin-tailwindcss"],
  tailwindAttributes: ["className", "class", "tw"],
  tailwindFunctions: ["tw"],
};
