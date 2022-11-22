import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`
    px-3 py-1.5 flex items-center gap-1 rounded shadow transition outline-none
    disabled:(opacity-50 cursor-not-allowed) focus:ring
  `,

  variants: {
    color: {
      primary: tw`bg-brand-500 text-white hocus:bg-brand-600`,
      danger: tw`bg-red-600 text-white hocus:bg-red-700`,
      white: tw`bg-white border border-brand-500 text-gray-900 hocus:(bg-brand-50 text-brand-900)`,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
