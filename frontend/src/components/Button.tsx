import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`flex items-center gap-1 rounded px-3 py-1.5 shadow outline-none transition focus:ring disabled:cursor-not-allowed disabled:opacity-50`,

  variants: {
    color: {
      primary: tw`bg-brand-500 text-white ring-brand-500/40 hover:bg-brand-600 active:bg-brand-700`,
      danger: tw`bg-red-600 text-white ring-red-600/40 hover:bg-red-700 active:bg-red-800`,
      white: tw`border border-brand-300 bg-white text-gray-900 ring-brand-300/40 hover:border-brand-400 hover:bg-brand-50 hover:text-brand-950 active:bg-brand-75`,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
