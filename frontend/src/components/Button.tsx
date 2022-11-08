import tw, { styled } from "twin.macro";

const Button = styled.button({
  ...tw`px-3 py-1.5 rounded shadow`,

  variants: {
    color: {
      primary: tw`bg-[hsl(220, 93%, 60%)] text-white`,
    },
  },

  defaultVariants: {
    color: "primary",
  },
});

export default Button;
