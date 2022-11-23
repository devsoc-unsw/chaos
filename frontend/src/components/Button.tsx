import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`
    px-3 py-1.5 flex items-center gap-1 rounded shadow transition outline-none
    disabled:(opacity-50 cursor-not-allowed) focus:ring
  `,

  variants: {
    color: {
      primary: tw`bg-brand-500 text-white ring-brand-500/40 hover:bg-brand-600 active:bg-brand-700`,
      danger: tw`bg-red-600 text-white ring-red-600/40 hover:bg-red-700 active:bg-red-800`,
      white: tw`
        bg-white border border-brand-300 text-gray-900 ring-brand-300/40
        hover:(bg-brand-50 text-brand-950 border-brand-400)
        active:bg-brand-75
      `,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
