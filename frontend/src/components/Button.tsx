import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`
    px-3 py-1.5 rounded shadow transition disabled:(opacity-50 cursor-not-allowed)
    outline-none focus:ring
  `,

  variants: {
    color: {
      primary: tw`bg-[hsl(220, 93%, 60%)] text-white hocus:bg-[hsl(220, 93%, 54%)]`,
      danger: tw`bg-red-600 text-white hocus:bg-red-700`,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
