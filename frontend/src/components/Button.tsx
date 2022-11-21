import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`px-3 py-1.5 rounded shadow transition disabled:(opacity-50 cursor-not-allowed)`,

  variants: {
    color: {
      primary: tw`bg-[hsl(220, 93%, 60%)] text-white`,
      danger: tw`bg-red-600 text-white hover:bg-red-700`,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
